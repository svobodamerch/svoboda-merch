"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

type Contractor = {
  id: number;
  type: string;
  name: string;
  company: string | null;
  phone: string | null;
  telegram: string | null;
  email: string | null;
  notes: string | null;
};
type Order = { id: number; title: string; status: string; amount_kopecks: number; created_at: string };
type Payment = {
  id: number;
  direction: "in" | "out";
  amount_kopecks: number;
  comment: string | null;
  paid_at: string;
};
type ActivityEntry = { id: number; message: string; actor: string | null; created_at: string };

type Detail = {
  contractor: Contractor;
  balanceKopecks: number;
  orders: Order[];
  payments: Payment[];
  activity: ActivityEntry[];
};

function money(kopecks: number): string {
  return `${(kopecks / 100).toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ₽`;
}

const field =
  "w-full rounded-xl border border-line bg-bg px-4 py-3 text-[13px] text-ink outline-none focus:border-accent";

export default function ContractorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<Detail | null>(null);
  const [orderForm, setOrderForm] = useState({ title: "", amount: "", description: "" });
  const [paymentForm, setPaymentForm] = useState({ direction: "in", amount: "", comment: "" });
  const [saving, setSaving] = useState(false);

  const load = () => {
    fetch(`/api/crm/contractors/${id}`)
      .then((r) => r.json())
      .then(setData);
  };

  useEffect(load, [id]);

  const submitOrder = async (e: FormEvent) => {
    e.preventDefault();
    if (!orderForm.title.trim()) return;
    setSaving(true);
    await fetch("/api/crm/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...orderForm, contractorId: Number(id) }),
    });
    setOrderForm({ title: "", amount: "", description: "" });
    setSaving(false);
    load();
  };

  const submitPayment = async (e: FormEvent) => {
    e.preventDefault();
    if (!paymentForm.amount) return;
    setSaving(true);
    await fetch("/api/crm/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...paymentForm, contractorId: Number(id) }),
    });
    setPaymentForm({ direction: "in", amount: "", comment: "" });
    setSaving(false);
    load();
  };

  if (!data) return <p className="label text-muted">Загрузка…</p>;
  const { contractor, balanceKopecks, orders, payments, activity } = data;

  return (
    <div className="space-y-10">
      <div>
        <Link href="/admin/crm/contractors" className="label text-muted hover:text-ink">
          ← Контрагенты
        </Link>
        <p className="label-lg text-ink mt-2">{contractor.name}</p>
        <p className="label text-muted">
          {[contractor.company, contractor.phone, contractor.telegram, contractor.email]
            .filter(Boolean)
            .join(" · ") || "Нет контактов"}
        </p>
        <p className={`label mt-3 ${balanceKopecks > 0 ? "text-accent" : "text-ink-soft"}`}>
          {balanceKopecks > 0
            ? `Должен нам: ${money(balanceKopecks)}`
            : balanceKopecks < 0
              ? `Должны ему: ${money(-balanceKopecks)}`
              : "Баланс закрыт"}
        </p>
      </div>

      <div className="grid gap-8 sm:grid-cols-2">
        <div>
          <p className="label text-accent mb-4">Заказы</p>
          <form onSubmit={submitOrder} className="mb-4 space-y-2 rounded-2xl bg-surface p-5">
            <input
              className={field}
              placeholder="Название заказа *"
              value={orderForm.title}
              onChange={(e) => setOrderForm((f) => ({ ...f, title: e.target.value }))}
            />
            <input
              className={field}
              placeholder="Сумма, ₽"
              inputMode="decimal"
              value={orderForm.amount}
              onChange={(e) => setOrderForm((f) => ({ ...f, amount: e.target.value }))}
            />
            <textarea
              className={`${field} resize-none`}
              rows={2}
              placeholder="Описание"
              value={orderForm.description}
              onChange={(e) => setOrderForm((f) => ({ ...f, description: e.target.value }))}
            />
            <button
              type="submit"
              disabled={saving || !orderForm.title.trim()}
              className="pill label bg-accent text-bg hover:bg-accent-soft disabled:bg-line disabled:text-muted"
            >
              Добавить заказ
            </button>
          </form>

          <ul className="divide-y divide-line border-t border-line">
            {orders.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/admin/crm/orders/${o.id}`}
                  className="flex items-center justify-between py-3 hover:bg-surface"
                >
                  <span className="label text-ink">{o.title}</span>
                  <span className="label text-muted">{money(o.amount_kopecks)}</span>
                </Link>
              </li>
            ))}
          </ul>
          {orders.length === 0 && <p className="label text-muted">Заказов нет</p>}
        </div>

        <div>
          <p className="label text-accent mb-4">Платежи</p>
          <form onSubmit={submitPayment} className="mb-4 space-y-2 rounded-2xl bg-surface p-5">
            <select
              className={field}
              value={paymentForm.direction}
              onChange={(e) => setPaymentForm((f) => ({ ...f, direction: e.target.value }))}
            >
              <option value="in">Нам заплатили</option>
              <option value="out">Мы заплатили</option>
            </select>
            <input
              className={field}
              placeholder="Сумма, ₽ *"
              inputMode="decimal"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm((f) => ({ ...f, amount: e.target.value }))}
            />
            <input
              className={field}
              placeholder="Комментарий"
              value={paymentForm.comment}
              onChange={(e) => setPaymentForm((f) => ({ ...f, comment: e.target.value }))}
            />
            <button
              type="submit"
              disabled={saving || !paymentForm.amount}
              className="pill label bg-accent text-bg hover:bg-accent-soft disabled:bg-line disabled:text-muted"
            >
              Записать платёж
            </button>
          </form>

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
        {activity.length === 0 && <p className="label text-muted">Пока пусто</p>}
      </div>
    </div>
  );
}
