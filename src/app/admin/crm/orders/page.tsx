"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

type Contractor = { id: number; name: string };
type Order = {
  id: number;
  contractor_id: number;
  title: string;
  status: string;
  amount_kopecks: number;
  created_at: string;
};

const statusLabel: Record<string, string> = {
  new: "Новый",
  in_production: "В работе",
  ready: "Готов",
  shipped: "Отправлен",
  done: "Выполнен",
  cancelled: "Отменён",
};

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="label-lg text-ink">Заказы</p>
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
            placeholder="Название заказа *"
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

      <ul className="divide-y divide-line border-t border-line">
        {orders.map((o) => (
          <li key={o.id}>
            <Link href={`/admin/crm/orders/${o.id}`} className="flex items-center justify-between py-4 hover:bg-surface">
              <div>
                <p className="label text-ink">{o.title}</p>
                <p className="label text-muted">
                  {contractorName(o.contractor_id)} · {statusLabel[o.status] || o.status}
                </p>
              </div>
              <span className="label text-ink shrink-0">{money(o.amount_kopecks)}</span>
            </Link>
          </li>
        ))}
      </ul>
      {orders.length === 0 && <p className="label text-muted">Заказов пока нет</p>}
    </div>
  );
}
