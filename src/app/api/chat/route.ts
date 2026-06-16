import { NextRequest } from "next/server";
import { store } from "@/lib/store";
import { streamAnswer } from "@/lib/anthropic";
import type { ChatMessage, Citation } from "@/lib/types";

export const runtime = "nodejs";

/**
 * POST /api/chat — answer a question over the indexed documents.
 *
 * Pipeline: retrieve top-k chunks (BM25) -> stream a cited answer from Claude.
 * The response is a text stream; the first line is a JSON header carrying the
 * citations, followed by a form-feed (\f) separator, then the streamed answer.
 */
export async function POST(req: NextRequest) {
  let body: { question?: string; history?: ChatMessage[] };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const question = (body.question ?? "").trim();
  if (!question) {
    return Response.json({ error: "Question is required" }, { status: 400 });
  }

  await store.init();
  if (store.size === 0) {
    return Response.json(
      { error: "No documents yet — upload something first." },
      { status: 400 },
    );
  }

  const passages = await store.search(question, 4);
  const citations: Citation[] = passages.map((p) => ({
    docId: p.chunk.docId,
    docTitle: p.chunk.docTitle,
    chunkIndex: p.chunk.index,
    snippet: p.chunk.text.slice(0, 200),
  }));

  const history = (body.history ?? []).slice(-6); // keep recent turns only

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // Header line with citations, then \f, then the streamed answer.
      controller.enqueue(encoder.encode(JSON.stringify({ citations }) + "\f"));
      try {
        for await (const delta of streamAnswer(question, passages, history)) {
          controller.enqueue(encoder.encode(delta));
        }
      } catch (err) {
        console.error("Generation error:", err);
        controller.enqueue(
          encoder.encode("\n\n⚠️ The model request failed. Please try again."),
        );
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
