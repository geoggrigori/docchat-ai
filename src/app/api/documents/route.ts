import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

// The store uses the Node filesystem for persistence, so pin this route to the
// Node.js runtime (not Edge).
export const runtime = "nodejs";

/** GET /api/documents — list all uploaded documents (metadata only). */
export async function GET() {
  await store.init();
  const docs = store.list().map((d) => ({
    id: d.id,
    title: d.title,
    chunks: d.chunks.length,
    chars: d.content.length,
    createdAt: d.createdAt,
  }));
  return NextResponse.json({ docs });
}

/** POST /api/documents — add a document. Body: { title, content }. */
export async function POST(req: NextRequest) {
  let body: { title?: string; content?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const content = (body.content ?? "").trim();
  if (!content) {
    return NextResponse.json(
      { error: "Document content is required" },
      { status: 400 },
    );
  }
  if (content.length > 200_000) {
    return NextResponse.json(
      { error: "Document too large (200k character limit)" },
      { status: 413 },
    );
  }

  const doc = await store.add(body.title ?? "Untitled", content);
  return NextResponse.json(
    { id: doc.id, title: doc.title, chunks: doc.chunks.length },
    { status: 201 },
  );
}

/** DELETE /api/documents?id=... — remove a document. */
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  const removed = await store.remove(id);
  if (!removed) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
