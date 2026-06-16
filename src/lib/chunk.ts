import type { Chunk } from "./types";

/**
 * Split text into overlapping chunks of roughly `size` characters.
 *
 * We break on paragraph/sentence boundaries when possible so chunks stay
 * semantically coherent, and overlap consecutive chunks by `overlap`
 * characters so an answer that straddles a boundary is still retrievable.
 */
export function chunkText(
  text: string,
  docId: string,
  docTitle: string,
  size = 1100,
  overlap = 200,
): Chunk[] {
  const clean = text.replace(/\r\n/g, "\n").trim();
  if (!clean) return [];

  // Prefer to cut at paragraph breaks, falling back to sentence ends.
  const boundaries = findBoundaries(clean);

  const chunks: Chunk[] = [];
  let start = 0;
  let index = 0;

  while (start < clean.length) {
    let end = Math.min(start + size, clean.length);

    // Snap `end` back to the nearest boundary inside the window, if any,
    // so we don't slice mid-sentence.
    if (end < clean.length) {
      const snapped = nearestBoundaryBefore(boundaries, end, start + size / 2);
      if (snapped > start) end = snapped;
    }

    const slice = clean.slice(start, end).trim();
    if (slice) {
      chunks.push({
        id: `${docId}::${index}`,
        docId,
        docTitle,
        index,
        text: slice,
      });
      index++;
    }

    if (end >= clean.length) break;
    start = Math.max(end - overlap, start + 1);
  }

  return chunks;
}

/** Character offsets just after each paragraph or sentence terminator. */
function findBoundaries(text: string): number[] {
  const offsets: number[] = [];
  const re = /\n\n|[.!?]\s|\n/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    offsets.push(m.index + m[0].length);
  }
  return offsets;
}

/** Largest boundary <= `limit` and >= `floor`, or -1 if none. */
function nearestBoundaryBefore(
  boundaries: number[],
  limit: number,
  floor: number,
): number {
  let best = -1;
  for (const b of boundaries) {
    if (b > limit) break;
    if (b >= floor) best = b;
  }
  return best;
}
