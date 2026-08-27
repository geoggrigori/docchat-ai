<!-- ══════════════════════════ TÍTULO ══════════════════════════ -->
<div align="center">
  <img src="docs/title-banner.svg" width="100%" alt="DocChat AI"/>
</div>

<br/>

<!-- ══════════════════════ IDIOMAS / LANGUAGES ══════════════════════ -->
<div align="center">
<a href="README.md"><img src="https://img.shields.io/badge/Português-555555?style=for-the-badge" alt="Português"/></a>
<a href="README.en.md"><img src="https://img.shields.io/badge/English-555555?style=for-the-badge" alt="English"/></a>
<a href="README.es.md"><img src="https://img.shields.io/badge/Español-1987F0?style=for-the-badge" alt="Español"/></a>
</div>

<br/>

<!-- ══════════════════════════ PORTADA ══════════════════════════ -->
<div align="center">
  <img src="docs/screenshot.png" width="100%" alt="DocChat AI — chatea con tus documentos"/>
</div>

<br/>

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

<a href="#acerca-de"><img src="https://img.shields.io/badge/▸_ACERCA_DE-1987F0?style=for-the-badge" alt="acerca"/></a>
<a href="#destacados"><img src="https://img.shields.io/badge/▸_DESTACADOS-000000?style=for-the-badge" alt="destacados"/></a>
<a href="#arquitectura"><img src="https://img.shields.io/badge/▸_ARQUITECTURA-1987F0?style=for-the-badge" alt="arquitectura"/></a>
<a href="#tecnologías"><img src="https://img.shields.io/badge/▸_TECNOLOGÍAS-000000?style=for-the-badge" alt="tech"/></a>
<a href="#uso"><img src="https://img.shields.io/badge/▸_USO-1987F0?style=for-the-badge" alt="uso"/></a>

</div>

<br/>

> 💡 **Sin API keys, sin base de datos vectorial, sin servicio externo.** La búsqueda corre 100% local con BM25 escrito desde cero — `npm install && npm run dev` y ya funciona.

<!-- ══════════════════════════ ACERCA DE ══════════════════════════ -->
## Acerca de

**DocChat AI** es una app full-stack de **RAG (Retrieval-Augmented Generation)** construida desde cero: pega un texto o importa cualquier página por URL, haz una pregunta en lenguaje natural y recibe **los pasajes más relevantes de tus fuentes, con citas en línea** — sin depender de ningún proveedor de IA, servicio de embeddings o base de datos vectorial.

Fragmentación, ranking BM25, ingesta por URL, streaming y UI: todo hecho a mano, sin ningún framework de IA por detrás.

<!-- ══════════════════════════ DESTACADOS ══════════════════════════ -->
## Destacados

| Función | Qué hace |
|---|---|
| **BM25 desde cero** | Ranking clásico de IR (TF-IDF con normalización por longitud), cero dependencias. Tokenizador bilingüe (PT/EN) con normalización de acentos y remoción de stopwords |
| **RAG con citas** | Los documentos se fragmentan, se indexan y los pasajes más relevantes vuelven como contexto citado |
| **Importar por URL** | Pega un enlace y el servidor busca la página, extrae el texto legible y lo indexa — sin problemas de CORS |
| **Streaming** | Las respuestas se renderizan en vivo vía `ReadableStream` |
| **Sin estado / listo para serverless** | Los documentos viven en el `localStorage` del navegador y se envían con cada pregunta — sin base de datos que aprovisionar |
| **Cero servicios externos** | Sin API key, sin proveedor de IA externo, sin vector DB — funciona sin conexión |

<!-- ══════════════════════════ ARQUITECTURA ══════════════════════════ -->
## Arquitectura

```mermaid
flowchart TD
    A[Usuario pega texto / importa URL] --> B["/api/extract — busca la URL y extrae texto legible"]
    B --> C[Documento guardado en localStorage del navegador]
    C --> D[Pregunta del usuario]
    D --> E["/api/chat — fragmentación + índice BM25 (sin estado)"]
    E --> F[Se seleccionan los pasajes más relevantes]
    F --> G[Respuesta citada, enviada en streaming vía ReadableStream]
```

| Archivo | Responsabilidad |
|---|---|
| `src/lib/chunk.ts` | Divide documentos en fragmentos superpuestos, respetando límites |
| `src/lib/bm25.ts` | Índice BM25 sin dependencias + tokenizador |
| `src/lib/answer.ts` | Compone la respuesta citada a partir de los pasajes recuperados |
| `src/app/api/extract` | Busca una URL en el servidor y devuelve texto legible |
| `src/app/api/chat` | Recuperación sin estado + respuesta citada en streaming |
| `src/app/page.tsx` | UI de chat, barra lateral de documentos (localStorage), streaming en el cliente |

<!-- ══════════════════════════ TECNOLOGÍAS ══════════════════════════ -->
## Tecnologías

| Capa | Tecnología |
|---|---|
| Framework | Next.js 15 (App Router, Route Handlers, streaming) |
| Lenguaje | TypeScript (strict) |
| UI | React 19, Tailwind CSS v4 |
| Recuperación | BM25 propio — sin vector DB, sin proveedor de IA |
| Deploy | Vercel, cero configuración |

<!-- ══════════════════════════ USO ══════════════════════════ -->
## Uso

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000), haz clic en **Exemplo** en la barra lateral (o importa una URL) y haz una pregunta. Sin configuración, sin API key.

**Pruebas:**
```bash
npm test
```
Cubren el núcleo de recuperación — límites de fragmentación y ranking BM25.

<!-- ══════════════════════════ LICENCIA ══════════════════════════ -->
## Licencia

[MIT](LICENSE).

<div align="center">
  <img src="https://file.loading.io/color/feature/thumb/Blues-8.png?" width="100%" height="10px" alt="divider"/>
</div>

<p align="center"><sub>Desarrollado por <strong><a href="https://github.com/geoggrigori">Grigori</a></strong> · 2026</sub></p>
