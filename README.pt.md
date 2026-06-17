# DocChat AI 🔎

[English](README.md) · **Português** · [Español](README.es.md)

Converse com seus documentos. Cole texto **ou importe qualquer página da web por URL**, faça perguntas em linguagem natural e receba **os trechos mais relevantes das suas fontes, com citações inline** — tudo movido por um pipeline de RAG (Geração Aumentada por Recuperação) feito do zero.

A recuperação roda **100% localmente** (BM25, sem serviço de embeddings, sem banco de dados vetorial, sem API externa). O aplicativo inteiro é autossuficiente e não precisa de chaves de API para funcionar.

> Construído com Next.js 15 (App Router), React 19, TypeScript e Tailwind CSS v4.

![DocChat AI — converse com seus documentos](docs/screenshot.png)

---

## ✨ Recursos

- **Busca BM25 feita do zero** — a clássica função de ranqueamento de RI (frequência do termo × frequência inversa de documento com normalização por tamanho), implementada com zero dependências. Tokenizador bilíngue (PT/EN) com remoção de acentos e de stopwords.
- **Geração Aumentada por Recuperação** — os documentos são fragmentados, indexados, e os trechos mais relevantes são recuperados a cada pergunta e devolvidos como contexto fundamentado e citado.
- **Resultados com citação** — cada trecho referencia o documento de onde veio, exibido como chips de fonte que você pode passar o mouse para pré-visualizar.
- **Importação por URL** — cole um link e o servidor busca a página, reduz a texto legível e a indexa (sem dores de cabeça com CORS, feito no lado do servidor).
- **Respostas em streaming** — os resultados são renderizados ao vivo, usando um `ReadableStream` sobre a fronteira do Node.
- **Stateless e pronto para serverless** — os documentos vivem no navegador (`localStorage`) e são enviados a cada pergunta, então a API não guarda estado e roda de forma confiável em plataformas serverless, sem banco de dados para provisionar.
- **Sem serviços externos** — sem chaves de API, sem provedor de IA de terceiros, sem banco vetorial. Simplesmente funciona offline.
- **Interface escura caprichada** — responsiva, acessível e amigável ao teclado (Enter para enviar, Shift+Enter para nova linha).

## 🏗️ Arquitetura

![Architecture](docs/architecture.svg)

**Módulos principais**

| Arquivo | Responsabilidade |
|------|----------------|
| `src/lib/chunk.ts`        | Divide documentos em fragmentos sobrepostos e cientes de fronteiras |
| `src/lib/bm25.ts`         | Índice de ranqueamento BM25 sem dependências + tokenizador |
| `src/lib/answer.ts`       | Compõe um resultado citado a partir dos trechos recuperados (local, em streaming) |
| `src/app/api/extract`     | Busca uma URL no lado do servidor e retorna texto legível |
| `src/app/api/chat`        | Recuperação stateless + resultado citado em streaming |
| `src/app/page.tsx`        | Interface de chat, barra lateral de documentos (localStorage), cliente de streaming |

## 🚀 Primeiros passos

```bash
# 1. Install dependencies
npm install

# 2. Run the dev server
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000), clique em **Exemplo** na barra lateral (ou importe uma URL) e faça uma pergunta. Nenhuma configuração ou chave de API é necessária.

## 🧪 Testes

```bash
npm test
```

Os testes unitários cobrem o núcleo de recuperação — fronteiras de fragmentação e ranqueamento BM25 — as partes onde a correção realmente importa.

## 🛠️ Stack tecnológica

- **Framework:** Next.js 15 (App Router, Route Handlers, streaming)
- **Linguagem:** TypeScript (strict)
- **UI:** React 19, Tailwind CSS v4
- **Recuperação:** BM25 personalizado — sem banco vetorial externo, sem provedor de IA

## 📦 Deploy

Implanta sem complicações na [Vercel](https://vercel.com/) com **zero configuração** — a API é stateless (os documentos vivem no navegador), então não há banco de dados para provisionar nem variáveis de ambiente para definir.

## 📝 Notas e possíveis extensões

- Adicionar uma camada opcional de síntese de respostas sobre a recuperação (qualquer provedor de LLM) atrás de uma feature flag.
- Trocar o BM25 por embeddings vetoriais + um reranker híbrido.
- Adicionar parsing de PDF/DOCX no upload.
- Espaços de documentos por usuário com autenticação + um datastore compartilhado.

---

Feito como projeto de portfólio para demonstrar engenharia full-stack e recuperação de informação aplicada. Fragmentação, ranqueamento BM25, ingestão de URL, streaming e interface são todos construídos à mão.
