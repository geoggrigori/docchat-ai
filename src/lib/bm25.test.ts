import { describe, it, expect } from "vitest";
import { BM25Index, tokenize } from "./bm25";
import type { Chunk } from "./types";

function chunk(id: string, text: string): Chunk {
  return { id, docId: "d", docTitle: "Doc", index: 0, text };
}

describe("tokenize", () => {
  it("lowercases, strips punctuation and accents", () => {
    expect(tokenize("Férias, são ótimas!")).toEqual(["ferias", "otimas"]);
  });

  it("removes stopwords and single characters", () => {
    // "of", "the", "a" are stopwords; "x" is a single char.
    expect(tokenize("the cost of a x report")).toEqual(["cost", "report"]);
  });
});

describe("BM25Index", () => {
  const docs = [
    chunk("1", "Vacation policy: employees get thirty days of vacation per year."),
    chunk("2", "Expense reports must be submitted within thirty days."),
    chunk("3", "The office cafeteria serves lunch from noon to two."),
  ];

  it("ranks the most relevant chunk first", () => {
    const idx = new BM25Index();
    idx.build(docs);
    const results = idx.search("how many vacation days", 3);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].chunk.id).toBe("1");
  });

  it("returns nothing for a query with no matching terms", () => {
    const idx = new BM25Index();
    idx.build(docs);
    expect(idx.search("quantum spaceship", 3)).toEqual([]);
  });

  it("respects the k limit", () => {
    const idx = new BM25Index();
    idx.build(docs);
    expect(idx.search("days", 1).length).toBeLessThanOrEqual(1);
  });

  it("handles an empty index gracefully", () => {
    const idx = new BM25Index();
    idx.build([]);
    expect(idx.search("anything")).toEqual([]);
  });
});
