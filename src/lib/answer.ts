import type { ScoredChunk } from "./types";

/**
 * Compose an answer locally from the retrieved passages — no external LLM.
 *
 * BM25 retrieval does the heavy lifting: it finds the passages in your
 * documents most relevant to the question. Here we present those passages as a
 * grounded, cited response and stream it word-by-word so the UI feels live.
 * The whole pipeline runs offline with no API keys or third-party services.
 */
export async function* streamAnswer(
  passages: ScoredChunk[],
): AsyncGenerator<string> {
  if (!passages.length) {
    yield "Não encontrei nada relevante nos seus documentos. Tente reformular a pergunta ou adicionar mais conteúdo.";
    return;
  }

  const parts = [
    "Com base nos seus documentos, estes são os trechos mais relevantes:\n",
  ];
  passages.forEach((p, i) => {
    parts.push(
      `\n[${i + 1}] *${p.chunk.docTitle}* — ${p.chunk.text.slice(0, 320).trim()}…`,
    );
  });

  // Stream word-by-word so the typing animation in the UI stays alive.
  for (const word of parts.join("").split(/(\s+)/)) {
    yield word;
    await new Promise((r) => setTimeout(r, 4));
  }
}
