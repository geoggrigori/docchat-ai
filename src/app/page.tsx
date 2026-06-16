"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface DocMeta {
  id: string;
  title: string;
  chunks: number;
  chars: number;
  createdAt: number;
}

interface Citation {
  docId: string;
  docTitle: string;
  chunkIndex: number;
  snippet: string;
}

interface Msg {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  streaming?: boolean;
}

const SAMPLE = {
  title: "Política de Férias — Atol Incorporadora",
  content: `POLÍTICA DE FÉRIAS

Todo colaborador com 12 meses completos de trabalho tem direito a 30 dias corridos de férias.

As férias podem ser divididas em até três períodos, sendo que um deles não pode ser inferior a 14 dias corridos e os demais não podem ser inferiores a 5 dias corridos cada.

O colaborador pode converter 1/3 (um terço) do período de férias em abono pecuniário, ou seja, vender até 10 dias de férias.

O pedido de férias deve ser feito com no mínimo 45 dias de antecedência através do sistema de RH.

Colaboradores em período de experiência (primeiros 90 dias) não têm direito a férias.

O pagamento das férias, acrescido do terço constitucional, é feito até 2 dias antes do início do período de descanso.`,
};

export default function Home() {
  const [docs, setDocs] = useState<DocMeta[]>([]);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadDocs = useCallback(async () => {
    const res = await fetch("/api/documents");
    const data = await res.json();
    setDocs(data.docs ?? []);
  }, []);

  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function addDoc(title: string, content: string) {
    if (!content.trim()) return;
    await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    });
    setNewTitle("");
    setNewContent("");
    setShowAdd(false);
    loadDocs();
  }

  async function deleteDoc(id: string) {
    await fetch(`/api/documents?id=${id}`, { method: "DELETE" });
    loadDocs();
  }

  async function send() {
    const question = input.trim();
    if (!question || busy) return;
    if (docs.length === 0) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "Adicione ao menos um documento antes de perguntar. Clique em **+ Documento** ou em **Exemplo**.",
        },
      ]);
      return;
    }

    setInput("");
    setBusy(true);
    const history = messages
      .filter((m) => !m.streaming)
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((m) => [
      ...m,
      { role: "user", content: question },
      { role: "assistant", content: "", streaming: true },
    ]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, history }),
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error ?? "Request failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let citations: Citation[] | undefined;
      let answer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // The header (JSON + \f) arrives first; split it off once.
        if (!citations && buffer.includes("\f")) {
          const [head, ...rest] = buffer.split("\f");
          try {
            citations = JSON.parse(head).citations;
          } catch {
            citations = [];
          }
          buffer = rest.join("\f");
        }

        if (citations) {
          answer += buffer;
          buffer = "";
          const current = answer;
          setMessages((m) => {
            const copy = [...m];
            copy[copy.length - 1] = {
              role: "assistant",
              content: current,
              citations,
              streaming: true,
            };
            return copy;
          });
        }
      }

      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = {
          role: "assistant",
          content: answer,
          citations,
          streaming: false,
        };
        return copy;
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erro inesperado";
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = {
          role: "assistant",
          content: `⚠️ ${message}`,
          streaming: false,
        };
        return copy;
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="flex w-80 shrink-0 flex-col border-r border-border bg-panel">
        <div className="border-b border-border p-4">
          <h1 className="flex items-center gap-2 text-lg font-semibold">
            <span className="text-accent">◆</span> DocChat AI
          </h1>
          <p className="mt-1 text-xs text-muted">
            RAG sobre seus documentos · busca BM25 local + Claude
          </p>
        </div>

        <div className="flex gap-2 p-3">
          <button
            onClick={() => setShowAdd((s) => !s)}
            className="flex-1 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            + Documento
          </button>
          <button
            onClick={() => addDoc(SAMPLE.title, SAMPLE.content)}
            className="rounded-lg border border-border bg-panel-2 px-3 py-2 text-sm text-muted transition hover:text-text"
            title="Carregar documento de exemplo"
          >
            Exemplo
          </button>
        </div>

        {showAdd && (
          <div className="border-b border-border px-3 pb-3">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Título do documento"
              className="mb-2 w-full rounded-lg border border-border bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent"
            />
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Cole o texto aqui…"
              rows={6}
              className="mb-2 w-full resize-none rounded-lg border border-border bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent"
            />
            <button
              onClick={() => addDoc(newTitle, newContent)}
              disabled={!newContent.trim()}
              className="w-full rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-40"
            >
              Indexar documento
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-3 py-2">
          <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-muted">
            Documentos ({docs.length})
          </p>
          {docs.length === 0 && (
            <p className="px-1 text-sm text-muted">
              Nenhum documento ainda. Carregue o exemplo para testar.
            </p>
          )}
          {docs.map((d) => (
            <div
              key={d.id}
              className="group mb-1.5 rounded-lg border border-border bg-panel-2 p-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-medium leading-snug">
                  {d.title}
                </span>
                <button
                  onClick={() => deleteDoc(d.id)}
                  className="text-muted opacity-0 transition hover:text-red-400 group-hover:opacity-100"
                  title="Remover"
                >
                  ✕
                </button>
              </div>
              <p className="mt-1 font-mono text-[11px] text-muted">
                {d.chunks} chunks · {(d.chars / 1000).toFixed(1)}k chars
              </p>
            </div>
          ))}
        </div>
      </aside>

      {/* Chat */}
      <main className="flex flex-1 flex-col">
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-6 py-8">
            {messages.length === 0 ? (
              <Welcome onPick={(q) => setInput(q)} />
            ) : (
              messages.map((m, i) => <Bubble key={i} msg={m} />)
            )}
          </div>
        </div>

        <div className="border-t border-border bg-panel/60 p-4">
          <div className="mx-auto flex max-w-3xl items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Pergunte algo sobre seus documentos…"
              rows={1}
              className="max-h-40 flex-1 resize-none rounded-xl border border-border bg-panel-2 px-4 py-3 text-sm outline-none focus:border-accent"
            />
            <button
              onClick={send}
              disabled={busy || !input.trim()}
              className="rounded-xl bg-accent px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-40"
            >
              {busy ? "…" : "Enviar"}
            </button>
          </div>
          <p className="mx-auto mt-2 max-w-3xl text-center text-[11px] text-muted">
            As respostas são geradas apenas a partir dos documentos indexados,
            com citações.
          </p>
        </div>
      </main>
    </div>
  );
}

function Welcome({ onPick }: { onPick: (q: string) => void }) {
  const examples = [
    "Quantos dias de férias eu tenho direito?",
    "Posso vender parte das minhas férias?",
    "Com quanta antecedência preciso pedir férias?",
  ];
  return (
    <div className="mt-16 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-2xl text-accent">
        ◆
      </div>
      <h2 className="text-2xl font-semibold">Converse com seus documentos</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">
        Carregue o documento de exemplo na barra lateral e experimente uma das
        perguntas abaixo.
      </p>
      <div className="mt-6 flex flex-col items-center gap-2">
        {examples.map((q) => (
          <button
            key={q}
            onClick={() => onPick(q)}
            className="rounded-full border border-border bg-panel-2 px-4 py-2 text-sm text-muted transition hover:border-accent hover:text-text"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

function Bubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`mb-6 flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] ${isUser ? "" : "w-full"}`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "bg-accent text-white"
              : "border border-border bg-panel text-text"
          }`}
        >
          <Formatted text={msg.content} streaming={msg.streaming} />
        </div>
        {msg.citations && msg.citations.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {msg.citations.map((c, i) => (
              <span
                key={i}
                title={c.snippet}
                className="cursor-help rounded-md border border-border bg-panel-2 px-2 py-1 font-mono text-[11px] text-muted"
              >
                [{i + 1}] {c.docTitle}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Minimal, safe formatter: **bold**, `code`, [n] citation chips, line breaks. */
function Formatted({ text, streaming }: { text: string; streaming?: boolean }) {
  const html = escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(
      /`([^`]+?)`/g,
      '<code class="rounded bg-panel-2 px-1 py-0.5 font-mono text-[12px]">$1</code>',
    )
    .replace(/\[(\d+)\]/g, '<span class="font-mono text-accent">[$1]</span>')
    .replace(/\n/g, "<br/>");

  return (
    <span
      className={streaming && !text ? "cursor-blink" : ""}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
