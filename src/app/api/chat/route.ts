import { NextRequest } from "next/server";
import { BM25Index } from "@/lib/bm25";
import { chunkText } from "@/lib/chunk";
import { streamAnswer } from "@/lib/anthropic";
import type { ChatMessage, Chunk, Citation } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

interface InputDoc {
  id?: string;
  title?: string;
  content?: string;
}

/**
 * POST /api/chat — answer a question over the documents sent in the request.
 *
 * The client owns the documents (kept in the browser), so the API is fully
 * stateless: every request rebuilds a BM25 index from the provided docs,
 * retrieves the top-k chunks, then streams a cited answer. Being stateless is
 * what lets this run reliably on serverless platforms (e.g. Vercel), where no
 * shared filesystem or memory survives between requests.
 *
 * Stream format: a JSON header with citations, a form-feed (\f) separator,
 * then the streamed answer text.
 */
export async function POST(req: NextRequest) {
  let body: { question?: string; history?: ChatMessage[]; docs?: InputDoc[] };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const question = (body.question ?? "").trim();
  if (!question) {
    return Response.json({ error: "Question is required" }, { status: 400 });
  }

  const docs = (body.docs ?? []).filter((d) => (d.content ?? "").trim());
  if (docs.length === 0) {
    return Response.json(
      { error: "No documents yet — add one first." },
      { status: 400 },
    );
  }

  const chunks: Chunk[] = docs.flatMap((d, i) =>
    chunkText(
      (d.content ?? "").slice(0, 200_000),
      d.id ?? `doc-${i}`,
      (d.title ?? "").trim() || "Untitled",
    ),
  );

  const index = new BM25Index();
  index.build(chunks);
  const passages = index.search(question, 4);

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
