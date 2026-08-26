<!-- ══════════════════════════ TITLE ══════════════════════════ -->
<div align="center">
  <img src="docs/title-banner.svg" width="100%" alt="DocChat AI"/>
</div>

<!-- ══════════════════════ IDIOMAS / LANGUAGES ══════════════════════ -->
<div align="center">
<a href="README.md"><img src="https://img.shields.io/badge/Português-555555?style=for-the-badge" alt="Português"/></a>
<a href="README.en.md"><img src="https://img.shields.io/badge/English-1987F0?style=for-the-badge" alt="English"/></a>
<a href="README.es.md"><img src="https://img.shields.io/badge/Español-555555?style=for-the-badge" alt="Español"/></a>
</div>

<!-- ══════════════════════════ COVER ══════════════════════════ -->
<div align="center">
  <img src="docs/screenshot.png" width="100%" alt="DocChat AI — chat with your documents"/>
</div>

<br/>

<h1 align="center">DocChat AI</h1>
<p align="center"><em>Paste a document or import any web page by URL, ask questions in natural language, get cited answers</em></p>
<p align="center"><strong>Document → chunking → local BM25 index → cited streaming answer</strong></p>

<div align="center">

<img src="https://img.shields.io/badge/RAG-100%25_Local-2E7D32?style=for-the-badge" alt="rag local"/>
<img src="https://img.shields.io/badge/Zero_API_Keys-1987F0?style=for-the-badge" alt="zero api keys"/>
<br/>
<img src="https://img.shields.io/badge/Next.js_15-000000?style=flat-square&logo=nextdotjs&logoColor=white" alt="nextjs"/>
<img src="https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="react"/>
<img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="typescript"/>
<img src="https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="tailwind"/>
<img src="https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white" alt="vercel"/>

</div>

<!-- ══════════════════════════ NAV ══════════════════════════ -->
<div align="center">

<a href="#about"><img src="https://img.shields.io/badge/▸_ABOUT-1987F0?style=for-the-badge" alt="about"/></a>
<a href="#highlights"><img src="https://img.shields.io/badge/▸_HIGHLIGHTS-000000?style=for-the-badge" alt="highlights"/></a>
<a href="#architecture"><img src="https://img.shields.io/badge/▸_ARCHITECTURE-1987F0?style=for-the-badge" alt="architecture"/></a>
<a href="#tech-stack"><img src="https://img.shields.io/badge/▸_TECH_STACK-000000?style=for-the-badge" alt="tech"/></a>
<a href="#usage"><img src="https://img.shields.io/badge/▸_USAGE-1987F0?style=for-the-badge" alt="usage"/></a>

</div>

<br/>

> 💡 **No API keys, no vector database, no external service.** Retrieval runs 100% locally with a from-scratch BM25 implementation — `npm install && npm run dev` and it just works.

<!-- ══════════════════════════ ABOUT ══════════════════════════ -->
## About

**DocChat AI** is a full-stack **RAG (Retrieval-Augmented Generation)** app built from scratch: paste text or import any web page by URL, ask a question in natural language, and get **the most relevant passages from your sources, with inline citations** — no third-party AI provider, embedding service, or vector database involved.

Chunking, BM25 ranking, URL ingestion, streaming and UI: all hand-built, no AI framework underneath.

<!-- ══════════════════════════ HIGHLIGHTS ══════════════════════════ -->
## Highlights

| Feature | What it does |
|---|---|
| **From-scratch BM25** | Classic IR ranking (TF-IDF with length normalization), zero dependencies. Bilingual (PT/EN) tokenizer with accent folding and stopword removal |
| **Cited RAG** | Documents are chunked, indexed, and the most relevant passages come back as grounded, cited context |
| **Import by URL** | Paste a link and the server fetches the page, extracts readable text, and indexes it — no CORS headaches |
| **Streaming** | Answers render live via a `ReadableStream` |
| **Stateless / serverless-ready** | Documents live in the browser's `localStorage` and are sent with each question — no database to provision |
| **No external services** | No API key, no third-party AI provider, no vector DB — works offline |

<!-- ══════════════════════════ ARCHITECTURE ══════════════════════════ -->
## Architecture

```mermaid
flowchart TD
    A[User pastes text / imports URL] --> B["/api/extract — fetches URL, extracts readable text"]
    B --> C[Document saved to browser localStorage]
    C --> D[User asks a question]
    D --> E["/api/chat — chunking + BM25 index (stateless)"]
    E --> F[Most relevant passages selected]
    F --> G[Cited answer streamed back via ReadableStream]
```

| File | Responsibility |
|---|---|
| `src/lib/chunk.ts` | Splits documents into overlapping, boundary-aware chunks |
| `src/lib/bm25.ts` | Dependency-free BM25 ranking index + tokenizer |
| `src/lib/answer.ts` | Composes a cited answer from the retrieved passages |
| `src/app/api/extract` | Fetches a URL server-side, returns readable text |
| `src/app/api/chat` | Stateless retrieval + streamed, cited answer |
| `src/app/page.tsx` | Chat UI, document sidebar (localStorage), client-side streaming |

<!-- ══════════════════════════ TECH STACK ══════════════════════════ -->
## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, Route Handlers, streaming) |
| Language | TypeScript (strict) |
| UI | React 19, Tailwind CSS v4 |
| Retrieval | Custom BM25 — no vector DB, no AI provider |
| Deploy | Vercel, zero configuration |

<!-- ══════════════════════════ USAGE ══════════════════════════ -->
## Usage

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), click **Exemplo** in the sidebar (or import a URL), and ask a question. No configuration, no API key.

**Tests:**
```bash
npm test
```
Covers the retrieval core — chunking boundaries and BM25 ranking.

<!-- ══════════════════════════ LICENSE ══════════════════════════ -->
## License

[MIT](LICENSE).

<div align="center">
  <img src="https://file.loading.io/color/feature/thumb/Blues-8.png?" width="100%" height="10px" alt="divider"/>
</div>

<p align="center"><sub>Built by <strong><a href="https://github.com/geoggrigori">Grigori</a></strong> · 2026</sub></p>
