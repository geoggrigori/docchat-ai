import { NextRequest, NextResponse } from "next/server";
import { extractText, getDocumentProxy } from "unpdf";

// PDF parsing runs on the Node.js runtime.
export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_BYTES = 15_000_000; // 15 MB upload cap
const MAX_CHARS = 200_000; // matches the indexing limit

/**
 * POST /api/pdf — extract readable text from an uploaded PDF.
 * Body: multipart/form-data with a `file` field.  ->  { title, content, pages }
 */
export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Envio inválido." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "O arquivo está vazio." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "PDF muito grande (limite de 15 MB)." },
      { status: 413 },
    );
  }
  const isPdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) {
    return NextResponse.json({ error: "Envie um arquivo PDF." }, { status: 415 });
  }

  let content = "";
  let pages = 0;
  try {
    const buffer = new Uint8Array(await file.arrayBuffer());
    const pdf = await getDocumentProxy(buffer);
    const result = await extractText(pdf, { mergePages: true });
    pages = result.totalPages;
    content = (Array.isArray(result.text) ? result.text.join("\n") : result.text)
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
      .slice(0, MAX_CHARS);
  } catch {
    return NextResponse.json(
      { error: "Não consegui ler este PDF (pode estar protegido ou ser só imagem)." },
      { status: 422 },
    );
  }

  if (!content) {
    return NextResponse.json(
      { error: "Nenhum texto extraível (PDF parece ser digitalizado/imagem)." },
      { status: 422 },
    );
  }

  const title = file.name.replace(/\.pdf$/i, "").slice(0, 120) || "Documento PDF";
  return NextResponse.json({ title, content, pages });
}
