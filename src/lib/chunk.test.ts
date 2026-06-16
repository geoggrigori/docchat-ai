import { describe, it, expect } from "vitest";
import { chunkText } from "./chunk";

describe("chunkText", () => {
  it("returns no chunks for empty input", () => {
    expect(chunkText("", "d", "Doc")).toEqual([]);
  });

  it("keeps short text as a single chunk", () => {
    const chunks = chunkText("A short note.", "d", "Doc");
    expect(chunks).toHaveLength(1);
    expect(chunks[0].text).toBe("A short note.");
    expect(chunks[0].docId).toBe("d");
  });

  it("splits long text into multiple chunks with stable ids", () => {
    const long = "Sentence number. ".repeat(400); // ~6.8k chars
    const chunks = chunkText(long, "d", "Doc", 1000, 150);
    expect(chunks.length).toBeGreaterThan(3);
    chunks.forEach((c, i) => {
      expect(c.id).toBe(`d::${i}`);
      expect(c.index).toBe(i);
    });
  });

  it("overlaps consecutive chunks so boundary content is retrievable", () => {
    const text = Array.from({ length: 60 }, (_, i) => `word${i}.`).join(" ");
    const chunks = chunkText(text, "d", "Doc", 120, 40);
    expect(chunks.length).toBeGreaterThan(1);
    // The tail of chunk 0 should reappear at the head of chunk 1.
    const tail = chunks[0].text.slice(-20);
    expect(chunks[1].text.includes(tail.trim().split(" ")[0])).toBe(true);
  });
});
