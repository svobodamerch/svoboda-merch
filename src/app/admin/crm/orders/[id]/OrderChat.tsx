"use client";

import { useCallback, useEffect, useState } from "react";

type Msg = { id: number; at: string | null; from: string; text: string };
type Atom = { id: number; type: string; summary: string; amount: number | null; deadline: string | null; status: string | null };
type LinkedChat = { chatId: number; title: string; messages: Msg[]; atoms: Atom[] };
type Found = { chatId: number; title: string; lastMessageAt: string | null };

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "");

export function OrderChat({ orderId }: { orderId: string }) {
  const base = `/api/crm/orders/${orderId}/chat`;
  const [chats, setChats] = useState<LinkedChat[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [found, setFound] = useState<Found[]>([]);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch(base);
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return setError(d.error || "Переписка недоступна");
    setError(null);
    setChats(d.chats || []);
  }, [base]);
  useEffect(() => {
    load();
  }, [load]);

  const search = async () => {
    const r = await fetch(`${base}/search?q=${encodeURIComponent(q)}`);
    const d = await r.json().catch(() => ({}));
    setFound(d.chats || []);
  };
  const link = async (chatId: number) => {
    await fetch(base, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chatId }) });
    setFound([]);
    setQ("");
    load();
  };
  const unlink = async (chatId: number) => {
    if (!confirm("Отвязать чат от сделки? Сама переписка не удаляется.")) return;
    await fetch(`${base}?chatId=${chatId}`, { method: "DELETE" });
    load();
  };
  const analyze = async () => {
    setBusy(true);
    setAnalysis(null);
    const r = await fetch(`${base}/analyze`, { method: "POST" });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    setAnalysis(r.ok ? d.analysis : d.error || "Не удалось разобрать");
  };

  return (
    <div className="rounded-2xl bg-surface p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="section-title">Переписка в Telegram</p>
        {chats.length > 0 && (
          <button type="button" onClick={analyze} disabled={busy} className="pill label bg-accent text-bg hover:bg-accent-soft disabled:bg-line disabled:text-muted">
            {busy ? "Разбираю…" : "Что висит по сделке"}
          </button>
        )}
      </div>

      {error && <p className="label text-red-700">{error}</p>}
      {analysis && <div className="label mb-4 whitespace-pre-wrap rounded-xl bg-bg p-4 text-ink">{analysis}</div>}

      {chats.map((c) => (
        <div key={c.chatId} className="mb-4">
          <div className="flex items-center justify-between">
            <p className="label-lg text-ink">{c.title}</p>
            <button type="button" onClick={() => unlink(c.chatId)} className="label text-muted hover:text-red-700">
              Отвязать
            </button>
          </div>
          {c.atoms.filter((a) => a.status === "open" || !a.status).length > 0 && (
            <ul className="mt-2 space-y-1">
              {c.atoms.filter((a) => a.status === "open" || !a.status).slice(0, 8).map((a) => (
                <li key={a.id} className="label text-ink-soft">
                  • {a.summary}
                  {a.amount ? ` — ${a.amount.toLocaleString("ru-RU")} ₽` : ""}
                  {a.deadline ? ` · срок ${a.deadline}` : ""}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-2 max-h-72 space-y-1 overflow-y-auto rounded-xl bg-bg p-3">
            {c.messages.map((m) => (
              <p key={m.id} className="label text-ink">
                <span className="text-muted">{fmt(m.at)} {m.from}: </span>
                {m.text}
              </p>
            ))}
          </div>
        </div>
      ))}

      <div className="flex gap-2">
        <input
          className="min-w-0 flex-1 rounded-lg border border-line bg-bg px-3 py-2 text-[13px] text-ink outline-none focus:border-accent"
          placeholder={chats.length ? "Привязать ещё чат: имя или название" : "Найти чат клиента: имя или название"}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
        />
        <button type="button" onClick={search} className="pill label bg-surface text-ink-soft hover:bg-tint">
          Найти
        </button>
      </div>
      {found.length > 0 && (
        <ul className="mt-2 space-y-1">
          {found.map((f) => (
            <li key={f.chatId}>
              <button type="button" onClick={() => link(f.chatId)} className="label text-accent hover:underline">
                Привязать: {f.title} {f.lastMessageAt ? `(последнее ${fmt(f.lastMessageAt)})` : ""}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
