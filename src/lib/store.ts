import { promises as fs } from "fs";
import path from "path";
import { BM25Index } from "./bm25";
import { chunkText } from "./chunk";
import type { Doc, ScoredChunk } from "./types";

/**
 * In-memory document store with a BM25 index and lightweight disk persistence.
 *
 * Next.js reloads route modules on every edit in development, so we stash the
 * singleton on `globalThis` to keep documents across hot reloads. Documents are
 * also mirrored to a JSON file so they survive a full server restart — no
 * database required for a self-contained demo.
 */
class DocStore {
  private docs = new Map<string, Doc>();
  private index = new BM25Index();
  private loaded = false;
  private dataFile = path.join(process.cwd(), ".data", "docs.json");

  /** Load persisted docs from disk once, then rebuild the index. */
  async init(): Promise<void> {
    if (this.loaded) return;
    this.loaded = true;
    try {
      const raw = await fs.readFile(this.dataFile, "utf8");
      const docs: Doc[] = JSON.parse(raw);
      for (const d of docs) this.docs.set(d.id, d);
    } catch {
      // No file yet — start empty.
    }
    this.reindex();
  }

  list(): Doc[] {
    return [...this.docs.values()].sort((a, b) => b.createdAt - a.createdAt);
  }

  async add(title: string, content: string): Promise<Doc> {
    await this.init();
    const id = randomId();
    const safeTitle = title.trim() || "Untitled";
    const doc: Doc = {
      id,
      title: safeTitle,
      content,
      chunks: chunkText(content, id, safeTitle),
      createdAt: Date.now(),
    };
    this.docs.set(id, doc);
    this.reindex();
    await this.persist();
    return doc;
  }

  async remove(id: string): Promise<boolean> {
    await this.init();
    const existed = this.docs.delete(id);
    if (existed) {
      this.reindex();
      await this.persist();
    }
    return existed;
  }

  /** Retrieve the top-`k` most relevant chunks across all documents. */
  async search(query: string, k = 4): Promise<ScoredChunk[]> {
    await this.init();
    return this.index.search(query, k);
  }

  get size(): number {
    return this.docs.size;
  }

  private reindex(): void {
    const allChunks = [...this.docs.values()].flatMap((d) => d.chunks);
    this.index.build(allChunks);
  }

  private async persist(): Promise<void> {
    try {
      await fs.mkdir(path.dirname(this.dataFile), { recursive: true });
      await fs.writeFile(this.dataFile, JSON.stringify(this.list(), null, 2));
    } catch (err) {
      console.error("Failed to persist docs:", err);
    }
  }
}

function randomId(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  );
}

// Persist the singleton across hot reloads in development.
const globalForStore = globalThis as unknown as { __docStore?: DocStore };
export const store: DocStore = globalForStore.__docStore ?? new DocStore();
if (process.env.NODE_ENV !== "production") globalForStore.__docStore = store;
