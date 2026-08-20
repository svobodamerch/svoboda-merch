"use client";

import Link from "next/link";
import { useEffect, useState, type DragEvent, type FormEvent } from "react";
import type { OrderBadge } from "@/lib/crm/finance";

type Contractor = { id: number; name: string };
type Order = {
  id: number;
  contractor_id: number;
  title: string;
  status: string;
  amount_kopecks: number;
  created_at: string;
  badges: OrderBadge[];
};

// Значки должны читаться боковым зрением: цветом выделено только то,
// что требует действия, остальное приглушено
const badgeTone: Record<OrderBadge["tone"], string> = {
  good: "bg-accent/10 text-accent",
  warn: "bg-amber-50 text-amber-700",
  bad: "bg-red-50 text-red-700",
  muted: "bg-surface text-muted",
};

const statuses: { value: string; label: string }[] = [
  { value: "new", label: "Новый" },
  { value: "in_production", label: "В работе" },
  { value: "ready", label: "Готов" },
  { value: "shipped", label: "Отправлен" },
  { value: "done", label: "Выполнен" },
  { value: "cancelled", label: "Отменён" },
];

function money(kopecks: number): string {
  return `${(kopecks / 100).toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ₽`;
}

const field =
  "w-full rounded-xl border border-line bg-bg px-4 py-3 text-[13px] text-ink outline-none focus:border-accent";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ contractorId: "", title: "", amount: "", description: "", deadline: "" });
  const [saving, setSaving] = useState(false);
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);

  const load = () => {
    fetch("/api/crm/orders")
      .then((r) => r.json())
      .then((d) => setOrders(d.orders));
    fetch("/api/crm/contractors")
      .then((r) => r.json())
      .then((d) => setContractors(d.contractors));
  };

  useEffect(load, []);

  const contractorName = (id: number) => contractors.find((c) => c.id === id)?.name || `#${id}`;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.contractorId || !form.title.trim()) return;
    setSaving(true);
    await fetch("/api/crm/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, contractorId: Number(form.contractorId) }),
    });
    setForm({ contractorId: "", title: "", amount: "", description: "", deadline: "" });
    setShowForm(false);
    setSaving(false);
    load();
  };

  const moveOrder = async (orderId: number, status: string) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    await fetch(`/api/crm/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  };

  const onDrop = (e: DragEvent<HTMLDivElement>, status: string) => {
    e.preventDefault();
    setDragOverStatus(null);
    const orderId = Number(e.dataTransfer.getData("text/order-id"));
    if (orderId) moveOrder(orderId, status);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="label-lg text-ink">Сделки</p>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="pill label bg-accent text-bg hover:bg-accent-soft"
        >
          {showForm ? "Отмена" : "Добавить"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="grid gap-3 rounded-2xl bg-surface p-6 sm:grid-cols-2">
          <select
            className={field}
            value={form.contractorId}
            onChange={(e) => setForm((f) => ({ ...f, contractorId: e.target.value }))}
          >
            <option value="">Контрагент *</option>
            {contractors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            className={field}
            placeholder="Название сделки *"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <input
            className={field}
            placeholder="Сумма, ₽"
            inputMode="decimal"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
          />
          <input
            className={field}
            placeholder="Описание"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <div>
            <label className="label text-muted mb-1.5 block">Срок сдачи</label>
            <input
              className={field}
              type="date"
              value={form.deadline}
              onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
            />
          </div>
          <button
            type="submit"
            disabled={saving || !form.contractorId || !form.title.trim()}
            className="pill label bg-accent text-bg hover:bg-accent-soft disabled:bg-line disabled:text-muted sm:col-span-2"
          >
            {saving ? "Сохраняем…" : "Сохранить"}
          </button>
        </form>
      )}

      <div className="flex gap-4 overflow-x-auto pb-4">
        {statuses.map((s) => {
          const columnOrders = orders.filter((o) => o.status === s.value);
          return (
            <div
              key={s.value}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverStatus(s.value);
              }}
              onDragLeave={() => setDragOverStatus(null)}
              onDrop={(e) => onDrop(e, s.value)}
              className={`w-[260px] shrink-0 rounded-2xl p-3 transition-colors ${
                dragOverStatus === s.value ? "bg-tint" : "bg-surface"
              }`}
            >
              <p className="label text-muted mb-3 px-1">
                {s.label} <span className="text-muted">· {columnOrders.length}</span>
              </p>
              <div className="space-y-2">
                {columnOrders.map((o) => (
                  <div
                    key={o.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/order-id", String(o.id))}
                    className="cursor-grab rounded-xl bg-bg p-3 shadow-[0_2px_8px_-4px_rgba(34,48,79,0.3)] active:cursor-grabbing"
                  >
                    <Link href={`/admin/crm/orders/${o.id}`} className="label text-ink hover:text-accent">
                      {o.title}
                    </Link>
                    <p className="label text-muted mt-1">{contractorName(o.contractor_id)}</p>
                    <p className="label text-ink mt-1">{money(o.amount_kopecks)}</p>
                    {o.badges?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {o.badges.map((b) => (
                          <span
                            key={b.code}
                            className={`rounded-md px-1.5 py-0.5 text-[10px] leading-tight ${badgeTone[b.tone]}`}
                          >
                            {b.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {orders.length === 0 && <p className="label text-muted">Сделок пока нет</p>}
    </div>
  );
}
