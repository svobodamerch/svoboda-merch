"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type Order = {
  id: number;
  contractor_id: number;
  title: string;
  description: string | null;
  status: string;
  amount_kopecks: number;
  deadline: string | null;
  source: string;
};
type Payment = { id: number; direction: "in" | "out"; amount_kopecks: number; comment: string | null };
type ActivityEntry = { id: number; message: string; actor: string | null; created_at: string };

type Detail = { order: Order; payments: Payment[]; activity: ActivityEntry[] };

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

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<Detail | null>(null);

  const load = () => {
    fetch(`/api/crm/orders/${id}`)
      .then((r) => r.json())
      .then(setData);
  };

  useEffect(load, [id]);

  const setStatus = async (status: string) => {
    await fetch(`/api/crm/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  };

  if (!data) return <p className="label text-muted">Загрузка…</p>;
  const { order, payments, activity } = data;

  return (
    <div className="space-y-10">
      <div>
        <Link href="/admin/crm/orders" className="label text-muted hover:text-ink">
          ← Заказы
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <p className="label-lg text-ink">{order.title}</p>
          <span className="label text-ink">{money(order.amount_kopecks)}</span>
        </div>
        {order.description && <p className="label text-ink-soft mt-2">{order.description}</p>}
        <Link href={`/admin/crm/contractors/${order.contractor_id}`} className="label text-accent mt-2 inline-block">
          Контрагент #{order.contractor_id} →
        </Link>
      </div>

      <div>
        <p className="label text-accent mb-4">Статус</p>
        <div className="flex flex-wrap gap-2">
          {statuses.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setStatus(s.value)}
              className={`pill label ${
                order.status === s.value ? "bg-ink text-bg" : "bg-surface text-ink-soft hover:bg-tint"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="label text-accent mb-4">Платежи по заказу</p>
        <ul className="divide-y divide-line border-t border-line">
          {payments.map((p) => (
            <li key={p.id} className="flex items-center justify-between py-3">
              <span className="label text-ink">{p.comment || (p.direction === "in" ? "Оплата" : "Расход")}</span>
              <span className={`label ${p.direction === "in" ? "text-accent" : "text-ink-soft"}`}>
                {p.direction === "in" ? "+" : "−"}
                {money(p.amount_kopecks)}
              </span>
            </li>
          ))}
        </ul>
        {payments.length === 0 && <p className="label text-muted">Платежей нет</p>}
      </div>

      <div>
        <p className="label text-accent mb-4">Журнал</p>
        <ul className="divide-y divide-line border-t border-line">
          {activity.map((a) => (
            <li key={a.id} className="flex items-center justify-between py-3">
              <span className="label text-ink">{a.message}</span>
              <span className="label text-muted">{new Date(a.created_at).toLocaleString("ru-RU")}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
