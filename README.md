# DocChat AI 🔎🤖

Chat with your documents. Upload text, ask questions in natural language, and get **answers grounded in your sources with inline citations** — powered by a from-scratch RAG (Retrieval-Augmented Generation) pipeline.

Retrieval runs **100% locally** (BM25, no embedding service or vector database), so the whole app is self-contained. Answer generation uses the [Claude API](https://www.anthropic.com/api) and streams token-by-token. No API key? The app still runs in **demo mode**, showing the retrieved passages.

> Built with Next.js 15 (App Router), React 19, TypeScript and Tailwind CSS v4.

---

## ✨ Features

- **Retrieval-Augmented Generation** — documents are chunked, indexed, and the most relevant passages are retrieved per question and fed to the model as grounded context.
- **From-scratch BM25 search** — the classic IR ranking function (term frequency × inverse document frequency with length normalization), implemented with zero dependencies. Bilingual (PT/EN) tokenizer with accent folding and stopword removal.
- **Cited answers** — every claim references the passages it came from, shown as source chips you can hover to preview.
- **Streaming responses** — answers render live as Claude generates them, using a `ReadableStream` over the Node boundary.
- **Graceful degradation** — works with or without an `ANTHROPIC_API_KEY`.
- **Zero-infra persistence** — uploaded documents survive restarts via a small JSON file; no database to provision.
- **Polished dark UI** — responsive, accessible, keyboard-friendly (Enter to send, Shift+Enter for newline).

## 🏗️ Architecture

```
          ┌──────────────┐   upload    ┌──────────────────────┐
 Browser  │  Next.js UI  │ ─────────▶  │ /api/documents       │
 (React)  │ (page.tsx)   │             │  chunk → BM25 index   │
          └──────┬───────┘             └──────────────────────┘
                 │ question
                 ▼
          ┌─────────────────────┐  retrieve top-k   ┌──────────────┐
          │ /api/chat           │ ────────────────▶ │  BM25Index   │
          │  1. search passages │                   │ (lib/bm25)   │
          │  2. build prompt    │                   └──────────────┘
          │  3. stream answer   │  context + question
          └──────────┬──────────┘ ────────────────▶  Claude API
                     │                                (claude-opus-4-8)
                     ▼  text stream (citations header + tokens)
                 Browser renders cited answer live
```

**Key modules**

| File | Responsibility |
|------|----------------|
| `src/lib/chunk.ts`     | Split documents into overlapping, boundary-aware chunks |
| `src/lib/bm25.ts`      | Dependency-free BM25 ranking index + tokenizer |
| `src/lib/store.ts`     | In-memory document store, indexing, JSON persistence |
| `src/lib/anthropic.ts` | Prompt construction + streaming Claude calls (with demo fallback) |
| `src/app/api/*`        | REST endpoints for documents and chat |
| `src/app/page.tsx`     | Chat UI, document sidebar, streaming client |

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

Deploys cleanly to [Vercel](https://vercel.com/) — set `ANTHROPIC_API_KEY` as an environment variable. (Note: the JSON-file persistence is for local/demo use; for serverless production, swap `store.ts` for a real datastore.)

## 📝 Notes & possible extensions

- Swap BM25 for vector embeddings (e.g. Voyage AI) + a hybrid reranker.
- Add PDF/DOCX parsing on upload.
- Per-user document spaces with auth.

---

Made as a portfolio project to demonstrate full-stack engineering and applied AI. Retrieval, prompting, streaming, and UI are all hand-built.
