import { NextRequest, NextResponse } from "next/server";

// Fetching an external page needs the Node.js runtime (not Edge).
export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_HTML_BYTES = 2_000_000; // cap the raw HTML we process
const MAX_CHARS = 200_000; // matches the indexing limit
const FETCH_TIMEOUT_MS = 12_000;

/**
 * POST /api/extract — fetch a web page server-side and return its readable
 * text. Doing the fetch on the server avoids browser CORS restrictions and
 * lets us strip HTML down to plain text before indexing.
 *
 * Body: { url }  ->  { title, content }
 */
export async function POST(req: NextRequest) {
  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo JSON inválido." }, { status: 400 });
  }

  const raw = (body.url ?? "").trim();
  if (!raw) {
    return NextResponse.json({ error: "Informe uma URL." }, { status: 400 });
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return NextResponse.json(
      { error: "URL inválida. Inclua http:// ou https://" },
      { status: 400 },
    );
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return NextResponse.json(
      { error: "Apenas URLs http(s) são suportadas." },
      { status: 400 },
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; DocChatBot/1.0; +https://github.com/geoggrigori/docchat-ai)",
        Accept: "text/html,application/xhtml+xml,text/plain,*/*",
      },
      signal: controller.signal,
      redirect: "follow",
    });
  } catch {
    clearTimeout(timer);
    return NextResponse.json(
      { error: "Não consegui acessar a URL (tempo esgotado ou site bloqueou o acesso)." },
      { status: 502 },
    );
  }
  clearTimeout(timer);

  if (!res.ok) {
    return NextResponse.json(
      { error: `A página respondeu com status ${res.status}.` },
      { status: 502 },
    );
  }

  const contentType = res.headers.get("content-type") ?? "";
  const html = (await res.text()).slice(0, MAX_HTML_BYTES);
  const looksHtml = contentType.includes("html") || /<html|<body|<p[\s>]/i.test(html);

  const content = (looksHtml ? htmlToText(html) : html).slice(0, MAX_CHARS).trim();
  if (!content) {
    return NextResponse.json(
      { error: "A página não tem texto extraível." },
      { status: 422 },
    );
  }

  const title =
    (looksHtml ? extractTitle(html) : "") || url.hostname.replace(/^www\./, "");

  return NextResponse.json({ title, content });
}

/** Pull a readable title from <title> (falls back to empty). */
function extractTitle(html: string): string {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? decodeEntities(m[1]).replace(/\s+/g, " ").trim().slice(0, 120) : "";
}

/** Strip tags/scripts/styles and collapse whitespace into plain text. */
function htmlToText(html: string): string {
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    // Turn block-level closers into line breaks so paragraphs survive.
    .replace(/<\/(p|div|li|h[1-6]|tr|section|article)\s*>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ");

  return decodeEntities(stripped)
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Decode the handful of HTML entities that matter for readable text. */
function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, n) => {
      try {
        return String.fromCodePoint(Number(n));
      } catch {
        return " ";
      }
    });
}
