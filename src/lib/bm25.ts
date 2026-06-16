import type { Chunk, ScoredChunk } from "./types";

/**
 * A small, dependency-free BM25 ranking index.
 *
 * BM25 is the classic information-retrieval scoring function used by search
 * engines like Elasticsearch. It ranks documents by term frequency (how often
 * a query word appears in a chunk) weighted by inverse document frequency
 * (how rare that word is across the whole corpus), with saturation so that
 * repeating a word many times yields diminishing returns.
 *
 * Running retrieval locally means the app needs no external embedding service
 * or vector database — the whole RAG pipeline works offline.
 */
export class BM25Index {
  private k1: number;
  private b: number;
  private chunks: Chunk[] = [];
  private tokenized: string[][] = [];
  /** document frequency: in how many chunks each term appears */
  private df = new Map<string, number>();
  private avgLen = 0;

  constructor(k1 = 1.5, b = 0.75) {
    this.k1 = k1;
    this.b = b;
  }

  /** Rebuild the index from scratch for the given chunks. */
  build(chunks: Chunk[]): void {
    this.chunks = chunks;
    this.tokenized = chunks.map((c) => tokenize(c.text));
    this.df.clear();

    for (const tokens of this.tokenized) {
      for (const term of new Set(tokens)) {
        this.df.set(term, (this.df.get(term) ?? 0) + 1);
      }
    }

    const totalLen = this.tokenized.reduce((sum, t) => sum + t.length, 0);
    this.avgLen = this.tokenized.length ? totalLen / this.tokenized.length : 0;
  }

  /** Return the top-`k` chunks ranked by BM25 score for the query. */
  search(query: string, k = 4): ScoredChunk[] {
    const qTerms = new Set(tokenize(query));
    if (!qTerms.size || !this.chunks.length) return [];

    const N = this.chunks.length;
    const scored: ScoredChunk[] = this.tokenized.map((tokens, i) => {
      const freq = termFrequencies(tokens);
      const len = tokens.length;
      let score = 0;

      for (const term of qTerms) {
        const tf = freq.get(term);
        if (!tf) continue;
        const df = this.df.get(term) ?? 0;
        // BM25 idf with the standard +0.5 smoothing, floored at 0.
        const idf = Math.max(
          0,
          Math.log(1 + (N - df + 0.5) / (df + 0.5)),
        );
        const denom =
          tf + this.k1 * (1 - this.b + (this.b * len) / (this.avgLen || 1));
        score += idf * ((tf * (this.k1 + 1)) / denom);
      }

      return { chunk: this.chunks[i], score };
    });

    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
  }
}

/** Lowercase, strip punctuation, split on whitespace, drop stopwords. */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents (cafe == cafe)
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

function termFrequencies(tokens: string[]): Map<string, number> {
  const freq = new Map<string, number>();
  for (const t of tokens) freq.set(t, (freq.get(t) ?? 0) + 1);
  return freq;
}

// A compact bilingual (pt/en) stopword list — common words carry little signal.
const STOPWORDS = new Set([
  "the","and","for","are","but","not","you","all","any","can","her","was","one",
  "our","out","has","had","were","they","with","this","that","from","what","when",
  "your","have","more","will","about","which","their","there","would","could",
  "a","an","of","to","in","is","it","on","as","at","by","or","be","if","do","so",
  "o","a","os","as","de","do","da","dos","das","um","uma","uns","umas","no","na",
  "nos","nas","ao","aos","que","com","sem","por","para","como","mais","mas","ou",
  "se","seu","sua","seus","suas","este","esta","esse","essa","isto","isso","ele",
  "ela","eles","elas","foi","ser","sao","tem","entre","quando","muito","ja","nao",
]);
