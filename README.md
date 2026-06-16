# DocChat AI 🔎🤖

Chat with your documents. Paste text **or import any web page by URL**, ask questions in natural language, and get **answers grounded in your sources with inline citations** — powered by a from-scratch RAG (Retrieval-Augmented Generation) pipeline.

Retrieval runs **100% locally** (BM25, no embedding service or vector database), so the whole app is self-contained. Answer generation uses the [Claude API](https://www.anthropic.com/api) and streams token-by-token. No API key? The app still runs in **demo mode**, showing the retrieved passages.

> Built with Next.js 15 (App Router), React 19, TypeScript and Tailwind CSS v4.

---

## ✨ Features

- **Retrieval-Augmented Generation** — documents are chunked, indexed, and the most relevant passages are retrieved per question and fed to the model as grounded context.
- **From-scratch BM25 search** — the classic IR ranking function (term frequency × inverse document frequency with length normalization), implemented with zero dependencies. Bilingual (PT/EN) tokenizer with accent folding and stopword removal.
- **Cited answers** — every claim references the passages it came from, shown as source chips you can hover to preview.
- **Streaming responses** — answers render live as Claude generates them, using a `ReadableStream` over the Node boundary.
- **Import by URL** — paste a link and the server fetches the page, strips it to readable text, and indexes it (no CORS headaches, done server-side).
- **Graceful degradation** — works with or without an `ANTHROPIC_API_KEY`.
- **Stateless & serverless-ready** — documents live in the browser (`localStorage`) and are sent with each question, so the API holds no state and runs reliably on serverless platforms with no database to provision.
- **Polished dark UI** — responsive, accessible, keyboard-friendly (Enter to send, Shift+Enter for newline).

## 🏗️ Architecture

```
          ┌──────────────┐  paste URL  ┌──────────────────────┐
 Browser  │  Next.js UI  │ ─────────▶  │ /api/extract         │
 (React)  │ (page.tsx)   │ ◀─────────  │  fetch + HTML→text    │
          │  docs in     │   text       └──────────────────────┘
          │  localStorage│
          └──────┬───────┘
                 │ question + docs
                 ▼
          ┌─────────────────────┐  build index + top-k  ┌──────────────┐
          │ /api/chat (stateless)│ ───────────────────▶ │  BM25Index   │
          │  1. chunk docs       │                       │ (lib/bm25)   │
          │  2. search passages  │                       └──────────────┘
          │  3. stream answer    │  context + question
          └──────────┬──────────┘ ─────────────────────▶  Claude API
                     │                                     (claude-opus-4-8)
                     ▼  text stream (citations header + tokens)
                 Browser renders cited answer live
```

**Key modules**

| File | Responsibility |
|------|----------------|
| `src/lib/chunk.ts`        | Split documents into overlapping, boundary-aware chunks |
| `src/lib/bm25.ts`         | Dependency-free BM25 ranking index + tokenizer |
| `src/lib/anthropic.ts`    | Prompt construction + streaming Claude calls (with demo fallback) |
| `src/app/api/extract`     | Fetch a URL server-side and return readable text |
| `src/app/api/chat`        | Stateless retrieval + streamed, cited answer |
| `src/app/page.tsx`        | Chat UI, document sidebar (localStorage), streaming client |

## 🚀 Getting started

```bash
# 1. Install dependencies
npm install

# 2. (optional) add your Claude API key for real answers
cp .env.example .env.local
#   then edit .env.local and set ANTHROPIC_API_KEY=...

# 3. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), click **Exemplo** in the sidebar to load a sample document, and ask a question.

## 🧪 Tests

```bash
npm test
```

Unit tests cover the retrieval core — chunking boundaries and BM25 ranking — the parts where correctness actually matters.

## 🛠️ Tech stack

- **Framework:** Next.js 15 (App Router, Route Handlers, streaming)
- **Language:** TypeScript (strict)
- **UI:** React 19, Tailwind CSS v4
- **AI:** Anthropic Claude (`@anthropic-ai/sdk`), model `claude-opus-4-8`
- **Retrieval:** custom BM25 — no external vector DB

## 📦 Deploy

Deploys cleanly to [Vercel](https://vercel.com/) with **zero configuration** — the API is stateless (documents live in the browser), so there's no database to provision. Set `ANTHROPIC_API_KEY` as an environment variable for real Claude answers; without it the live demo runs in demo mode (retrieval only).

## 📝 Notes & possible extensions

- Swap BM25 for vector embeddings (e.g. Voyage AI) + a hybrid reranker.
- Add PDF/DOCX parsing on upload.
- Per-user document spaces with auth + a shared datastore.

---

Made as a portfolio project to demonstrate full-stack engineering and applied AI. Retrieval, prompting, streaming, and UI are all hand-built.
