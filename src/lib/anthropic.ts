import Anthropic from "@anthropic-ai/sdk";
import type { ChatMessage, ScoredChunk } from "./types";

/** Single Claude model used for answer generation. */
const MODEL = "claude-opus-4-8";

const SYSTEM_PROMPT = `You are DocChat, a careful assistant that answers questions strictly from the user's documents.

Rules:
- Answer ONLY using the numbered context passages provided. Do not use outside knowledge.
- Cite the passages you used inline with bracketed numbers like [1], [2]. Cite every claim.
- If the passages do not contain the answer, say so plainly and do not invent details.
- Be concise and direct. Match the user's language (Portuguese or English).`;

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic()
  : null;

/** True when an API key is configured and real generation is available. */
export function hasApiKey(): boolean {
  return client !== null;
}

/** Build the user-turn prompt: numbered context passages + the question. */
export function buildPrompt(question: string, passages: ScoredChunk[]): string {
  const context = passages
    .map(
      (p, i) =>
        `[${i + 1}] (from "${p.chunk.docTitle}")\n${p.chunk.text}`,
    )
    .join("\n\n");

  return `Context passages:\n\n${context}\n\n---\nQuestion: ${question}\n\nAnswer using only the passages above, citing them with [n].`;
}

/**
 * Stream an answer from Claude as an async iterable of text deltas.
 * Streaming keeps the request under HTTP timeouts and powers the live UI.
 */
export async function* streamAnswer(
  question: string,
  passages: ScoredChunk[],
  history: ChatMessage[],
): AsyncGenerator<string> {
  if (!client) {
    yield* demoAnswer(passages);
    return;
  }

  const messages: Anthropic.MessageParam[] = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user" as const, content: buildPrompt(question, passages) },
  ];

  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages,
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      yield event.delta.text;
    }
  }
}

/**
 * Fallback used when no ANTHROPIC_API_KEY is set, so the app is fully
 * demoable. It returns the retrieved passages verbatim instead of a
 * generated answer — retrieval still works; only generation is stubbed.
 */
async function* demoAnswer(passages: ScoredChunk[]): AsyncGenerator<string> {
  if (!passages.length) {
    yield "I couldn't find anything relevant in your documents. Try uploading more context or rephrasing the question.";
    return;
  }
  const parts = [
    "**Demo mode** (no `ANTHROPIC_API_KEY` set — showing the retrieved passages instead of a generated answer):\n",
  ];
  passages.forEach((p, i) => {
    parts.push(`\n[${i + 1}] *${p.chunk.docTitle}* — ${p.chunk.text.slice(0, 280)}…`);
  });
  parts.push(
    "\n\nSet an API key in `.env.local` to get real, cited answers from Claude.",
  );
  // Emit word-by-word so the UI streaming animation still looks alive.
  for (const word of parts.join("").split(/(\s+)/)) {
    yield word;
    await new Promise((r) => setTimeout(r, 4));
  }
}
