# DocChat AI 🔎

[English](README.md) · [Português](README.pt.md) · **Español**

Conversa con tus documentos. Pega texto **o importa cualquier página web por URL**, haz preguntas en lenguaje natural y obtén **los fragmentos más relevantes de tus fuentes, con citas en línea** — todo impulsado por un pipeline de RAG (Generación Aumentada por Recuperación) hecho desde cero.

La recuperación se ejecuta **100 % localmente** (BM25, sin servicio de embeddings, sin base de datos vectorial, sin API externa). La aplicación entera es autónoma y no necesita claves de API para funcionar.

> Construido con Next.js 15 (App Router), React 19, TypeScript y Tailwind CSS v4.

![DocChat AI — conversa con tus documentos](docs/screenshot.png)

---

## ✨ Características

- **Búsqueda BM25 hecha desde cero** — la clásica función de ranking de RI (frecuencia del término × frecuencia inversa de documento con normalización por longitud), implementada con cero dependencias. Tokenizador bilingüe (PT/EN) con eliminación de acentos y de stopwords.
- **Generación Aumentada por Recuperación** — los documentos se fragmentan, se indexan, y los fragmentos más relevantes se recuperan por cada pregunta y se devuelven como contexto fundamentado y citado.
- **Resultados con citas** — cada fragmento referencia el documento del que proviene, mostrado como chips de fuente sobre los que puedes pasar el cursor para previsualizar.
- **Importación por URL** — pega un enlace y el servidor obtiene la página, la reduce a texto legible y la indexa (sin dolores de cabeza con CORS, hecho en el lado del servidor).
- **Respuestas en streaming** — los resultados se renderizan en vivo, usando un `ReadableStream` sobre la frontera de Node.
- **Stateless y listo para serverless** — los documentos viven en el navegador (`localStorage`) y se envían con cada pregunta, por lo que la API no guarda estado y se ejecuta de forma fiable en plataformas serverless, sin base de datos que aprovisionar.
- **Sin servicios externos** — sin claves de API, sin proveedor de IA de terceros, sin base de datos vectorial. Simplemente funciona sin conexión.
- **Interfaz oscura pulida** — responsiva, accesible y compatible con el teclado (Enter para enviar, Shift+Enter para salto de línea).

## 🏗️ Arquitectura

![Architecture](docs/architecture.svg)

**Módulos clave**

| Archivo | Responsabilidad |
|------|----------------|
| `src/lib/chunk.ts`        | Divide los documentos en fragmentos solapados y conscientes de los límites |
| `src/lib/bm25.ts`         | Índice de ranking BM25 sin dependencias + tokenizador |
| `src/lib/answer.ts`       | Compone un resultado citado a partir de los fragmentos recuperados (local, en streaming) |
| `src/app/api/extract`     | Obtiene una URL en el lado del servidor y devuelve texto legible |
| `src/app/api/chat`        | Recuperación stateless + resultado citado en streaming |
| `src/app/page.tsx`        | Interfaz de chat, barra lateral de documentos (localStorage), cliente de streaming |

## 🚀 Primeros pasos

```bash
# 1. Install dependencies
npm install

# 2. Run the dev server
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000), haz clic en **Exemplo** en la barra lateral (o importa una URL) y haz una pregunta. No se necesita configuración ni clave de API.

## 🧪 Pruebas

```bash
npm test
```

Las pruebas unitarias cubren el núcleo de recuperación — los límites de fragmentación y el ranking BM25 — las partes donde la corrección realmente importa.

## 🛠️ Stack tecnológico

- **Framework:** Next.js 15 (App Router, Route Handlers, streaming)
- **Lenguaje:** TypeScript (strict)
- **UI:** React 19, Tailwind CSS v4
- **Recuperación:** BM25 personalizado — sin base de datos vectorial externa, sin proveedor de IA

## 📦 Despliegue

Se despliega sin complicaciones en [Vercel](https://vercel.com/) con **cero configuración** — la API es stateless (los documentos viven en el navegador), por lo que no hay base de datos que aprovisionar ni variables de entorno que definir.

## 📝 Notas y posibles extensiones

- Añadir una capa opcional de síntesis de respuestas sobre la recuperación (cualquier proveedor de LLM) detrás de un feature flag.
- Sustituir BM25 por embeddings vectoriales + un reranker híbrido.
- Añadir análisis de PDF/DOCX en la subida.
- Espacios de documentos por usuario con autenticación + un almacén de datos compartido.

---

Hecho como proyecto de portafolio para demostrar ingeniería full-stack y recuperación de información aplicada. Fragmentación, ranking BM25, ingesta de URL, streaming e interfaz están todos construidos a mano.
