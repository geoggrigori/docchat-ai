// Shared domain types for DocChat AI.

/** A document uploaded by the user, split into searchable chunks. */
export interface Doc {
  id: string;
  title: string;
  /** Full original text, kept for reference. */
  content: string;
  chunks: Chunk[];
  createdAt: number;
}

/** A contiguous slice of a document — the unit we index and retrieve. */
export interface Chunk {
  id: string;
  docId: string;
  docTitle: string;
  /** Position of this chunk within its document (0-based). */
  index: number;
  text: string;
}

/** A chunk paired with its relevance score for a given query. */
export interface ScoredChunk {
  chunk: Chunk;
  score: number;
}

/** A source citation returned alongside an answer. */
export interface Citation {
  docId: string;
  docTitle: string;
  chunkIndex: number;
  snippet: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
