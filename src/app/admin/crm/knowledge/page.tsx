"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Contractor = { id: number; name: string };
type Order = {
  id: number;
  contractor_id: number;
  title: string;
  status: string;
  amount_kopecks: number;
  deadline: string | null;
  notes: string | null;
  created_at: string;
};

function money(kopecks: number): string {
  return `${(kopecks / 100).toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ₽`;
}

const statusLabel: Record<string, string> = {
  new: "Новый",
  in_production: "В работе",
  ready: "Готов",
  shipped: "Отправлен",
  done: "Выполнен",
  cancelled: "Отменён",
};

export default function KnowledgeBasePage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  const load = () => {
    fetch("/api/crm/orders")
      .then((r) => r.json())
      .then((d) => {
        setOrders(d.orders);
        setDrafts(Object.fromEntries(d.orders.map((o: Order) => [o.id, o.notes || ""])));
      });
    fetch("/api/crm/contractors")
      .then((r) => r.json())
      .then((d) => setContractors(d.contractors));
  };

  useEffect(load, []);

  const contractorName = (id: number) => contractors.find((c) => c.id === id)?.name || `#${id}`;

  const saveNotes = async (id: number) => {
    setSavingId(id);
    await fetch(`/api/crm/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: drafts[id] || "" }),
    });
    setSavingId(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="label-lg text-ink">База знаний</p>
        <p className="label text-muted mt-1">
          Заметки по проектам — что сработало, какие косяки, кто поставщик, какие сроки. Копится по каждой сделке.
        </p>
      </div>

      <ul className="divide-y divide-line border-t border-line">
        {orders.map((o) => (
          <li key={o.id} className="py-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <Link href={`/admin/crm/orders/${o.id}`} className="label text-ink hover:text-accent">
                {o.title}
              </Link>
              <span className="label text-muted">
                {contractorName(o.contractor_id)} · {statusLabel[o.status] || o.status}
                {o.deadline ? ` · срок ${o.deadline}` : ""} · {money(o.amount_kopecks)}
              </span>
            </div>
            <textarea
              className="mt-3 w-full rounded-xl border border-line bg-bg px-4 py-3 text-[13px] text-ink outline-none focus:border-accent"
              rows={3}
              placeholder="Что сработало, какие косяки, поставщики, сроки…"
              value={drafts[o.id] ?? ""}
              onChange={(e) => setDrafts((d) => ({ ...d, [o.id]: e.target.value }))}
              onBlur={() => {
                if (drafts[o.id] !== (o.notes || "")) saveNotes(o.id);
              }}
            />
            {savingId === o.id && <p className="label text-muted mt-1">Сохраняем…</p>}
          </li>
        ))}
      </ul>
      {orders.length === 0 && <p className="label text-muted">Сделок пока нет</p>}
    </div>
  );
}
