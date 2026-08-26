"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Заявки с сайта. Отдельная воронка от ручного заведения сделок по счетам:
 * форма на сайте пишет сюда сама, без цены — тираж и тип продукции есть,
 * суммы нет, её проставляют после расчёта, уже в сделке.
 */

type Lead = {
  id: number;
  name: string;
  company: string | null;
  phone: string;
  telegram: string | null;
  product_type: string;
  quantity: string;
  comment: string | null;
  deadline: string | null;
  status: "new" | "in_progress" | "done" | "archived";
  source: string;
  notes: string | null;
  created_at: string;
  converted_contractor_id: number | null;
  converted_order_id: number | null;
};

const statusLabel: Record<Lead["status"], string> = {
  new: "Новая",
  in_progress: "В работе",
  done: "Готово",
  archived: "Архив",
};

const statusStyle: Record<Lead["status"], string> = {
  new: "bg-amber-100 text-amber-800",
  in_progress: "bg-accent/12 text-accent",
  done: "bg-accent/20 text-accent",
  archived: "bg-surface text-muted",
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  const load = () => {
    fetch("/api/crm/leads")
      .then((r) => r.json())
      .then((d) => setLeads(d.leads));
  };

  useEffect(load, []);

  const setStatus = async (id: number, status: Lead["status"]) => {
    setBusy(id);
    await fetch(`/api/crm/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusy(null);
    load();
  };

  const convert = async (id: number) => {
    setBusy(id);
    const r = await fetch(`/api/crm/leads/${id}/convert`, { method: "POST" });
    const d = await r.json();
    setBusy(null);
    if (d.error) {
      alert(d.error);
      return;
    }
    load();
  };

  if (!leads) return <p className="label text-muted">Загрузка…</p>;

  const isSpamLike = (l: Lead) =>
    /продвижение|seo|разбор.*сайт|яндекс.*гугл/i.test(`${l.comment || ""} ${l.product_type}`);

  // Архив уходит вниз списка, внутри групп — сначала свежие
  const statusRank: Record<Lead["status"], number> = { new: 0, in_progress: 1, done: 2, archived: 3 };
  const sortedLeads = [...leads].sort((a, b) => statusRank[a.status] - statusRank[b.status]);

  const telegramLink = (l: Lead) => {
    if (l.telegram) {
      const handle = l.telegram.trim().replace(/^@/, "").replace(/^https?:\/\/t\.me\//i, "");
      return `https://t.me/${handle}`;
    }
    const digits = l.phone.replace(/[^\d+]/g, "");
    return digits ? `https://t.me/${digits}` : null;
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="label-lg text-ink">Заявки с сайта</p>
        <p className="label text-muted mt-1">
          Форма на сайте пишет сюда напрямую, без цены — тип продукции и тираж есть, сумму считаете
          сами. «Превратить в сделку» заводит контрагента и заказ, дальше работа как с любой сделкой.
        </p>
      </div>

      <ul className="divide-y divide-line border-t border-line">
        {sortedLeads.map((l) => {
          const isOpen = expanded === l.id;
          return (
            <li key={l.id} className="py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <button type="button" onClick={() => setExpanded(isOpen ? null : l.id)} className="min-w-0 text-left">
                  <p className="label text-ink">
                    {l.name}
                    {l.company ? ` · ${l.company}` : ""}
                  </p>
                  <p className="label text-muted mt-0.5">
                    {l.product_type} · {l.quantity}
                    {isSpamLike(l) && <span className="text-amber-700"> · похоже на спам</span>}
                  </p>
                </button>
                <div className="flex shrink-0 items-center gap-2">
                  <span className={`rounded-md px-1.5 py-0.5 text-[11px] ${statusStyle[l.status]}`}>
                    {statusLabel[l.status]}
                  </span>
                  <span className="label text-muted">{new Date(l.created_at).toLocaleDateString("ru-RU")}</span>
                </div>
              </div>

              {isOpen && (
                <div className="mt-3 space-y-2 rounded-xl bg-surface p-4">
                  <p className="label text-ink-soft">
                    Тел. {l.phone}
                    {l.telegram ? ` · ${l.telegram}` : ""}
                    {l.deadline ? ` · срок: ${l.deadline}` : ""}
                  </p>
                  {l.comment && <p className="label text-ink-soft">{l.comment}</p>}

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    {telegramLink(l) && (
                      <a
                        href={telegramLink(l)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="pill label bg-tint text-ink hover:bg-line"
                      >
                        Написать в Telegram
                      </a>
                    )}
                    {l.converted_order_id ? (
                      <Link
                        href={`/admin/crm/orders/${l.converted_order_id}`}
                        className="label text-accent hover:underline"
                      >
                        Сделка заведена →
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => convert(l.id)}
                        disabled={busy === l.id}
                        className="pill label bg-accent text-bg hover:bg-accent-soft disabled:bg-line disabled:text-muted"
                      >
                        Превратить в сделку
                      </button>
                    )}

                    {(["new", "in_progress", "archived"] as const)
                      .filter((s) => s !== l.status)
                      .map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setStatus(l.id, s)}
                          disabled={busy === l.id}
                          className="label text-muted hover:text-ink"
                        >
                          → {statusLabel[s]}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {leads.length === 0 && <p className="label text-muted">Заявок пока нет</p>}
    </div>
  );
}
