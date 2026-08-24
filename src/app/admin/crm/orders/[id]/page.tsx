"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { allCatalogItems, findCatalogPrice } from "@/lib/priceCatalog";
import { OrderCosts } from "./OrderCosts";
import { OrderLegalEntity } from "./OrderLegalEntity";
import { OrderDocuments } from "./OrderDocuments";
import { ProjectEconomics } from "./ProjectEconomics";
import { QuickUpdate } from "./QuickUpdate";
import type { ProjectFinancials } from "@/lib/crm/finance";

type Order = {
  id: number;
  contractor_id: number;
  legal_entity_id: number | null;
  title: string;
  description: string | null;
  status: string;
  amount_kopecks: number;
  deadline: string | null;
  source: string;
};
type Payment = { id: number; direction: "in" | "out"; amount_kopecks: number; comment: string | null };
type ActivityEntry = { id: number; message: string; actor: string | null; created_at: string };
type OrderItem = {
  id: number;
  title: string;
  description: string | null;
  quantity: number;
  unit: string;
  unit_price_kopecks: number;
  discount_percent: number;
};

type Detail = {
  order: Order;
  payments: Payment[];
  activity: ActivityEntry[];
  financials: ProjectFinancials;
};

type ItemRow = {
  title: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  discountPercent: string;
};

const emptyRow = (): ItemRow => ({ title: "", quantity: "1", unit: "шт", unitPrice: "", discountPercent: "0" });

function rowTotal(row: ItemRow): number {
  const qty = Number(row.quantity) || 0;
  const price = parseFloat(row.unitPrice.replace(",", ".")) || 0;
  const discount = Number(row.discountPercent) || 0;
  return qty * price * (1 - discount / 100);
}

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
  "w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-[13px] text-ink outline-none focus:border-accent";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<Detail | null>(null);
  const [rows, setRows] = useState<ItemRow[]>([]);
  const [savingItems, setSavingItems] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ direction: "in", amount: "", comment: "" });
  const [savingPayment, setSavingPayment] = useState(false);

  const loadOrder = () => {
    fetch(`/api/crm/orders/${id}`)
      .then((r) => r.json())
      .then(setData);
  };

  const loadItems = () => {
    fetch(`/api/crm/orders/${id}/items`)
      .then((r) => r.json())
      .then((d: { items: OrderItem[] }) => {
        setRows(
          d.items.length
            ? d.items.map((it) => ({
                title: it.title,
                quantity: String(it.quantity),
                unit: it.unit,
                unitPrice: String(it.unit_price_kopecks / 100),
                discountPercent: String(it.discount_percent),
              }))
            : [emptyRow()],
        );
      });
  };

  useEffect(loadOrder, [id]);
  useEffect(loadItems, [id]);

  const setStatus = async (status: string) => {
    await fetch(`/api/crm/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    loadOrder();
  };

  const updateRow = (i: number, patch: Partial<ItemRow>) => {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  };

  const pickCatalogItem = (i: number, name: string) => {
    const row = rows[i];
    const price = findCatalogPrice(name, Number(row.quantity) || 1);
    updateRow(i, { title: name, unitPrice: price != null ? String(price) : row.unitPrice });
  };

  const saveItems = async () => {
    setSavingItems(true);
    const items = rows.filter((r) => r.title.trim());
    await fetch(`/api/crm/orders/${id}/items`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((r) => ({
          title: r.title,
          quantity: Number(r.quantity) || 1,
          unit: r.unit,
          unitPrice: r.unitPrice,
          discountPercent: Number(r.discountPercent) || 0,
        })),
      }),
    });
    setSavingItems(false);
    loadOrder();
    loadItems();
  };

  const total = rows.reduce((sum, r) => sum + rowTotal(r), 0);

  const submitPayment = async () => {
    if (!data || !paymentForm.amount) return;
    setSavingPayment(true);
    await fetch("/api/crm/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...paymentForm,
        contractorId: data.order.contractor_id,
        orderId: data.order.id,
      }),
    });
    setPaymentForm({ direction: "in", amount: "", comment: "" });
    setSavingPayment(false);
    loadOrder();
  };

  if (!data) return <p className="label text-muted">Загрузка…</p>;
  const { order, payments, activity } = data;

  return (
    <div className="space-y-10">
      <div>
        <Link href="/admin/crm/orders" className="label text-muted hover:text-ink">
          ← Сделки
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <p className="label-lg text-ink">{order.title}</p>
          <span className="label text-ink">{money(order.amount_kopecks)}</span>
        </div>
        {order.description && <p className="label text-ink-soft mt-2">{order.description}</p>}
        <div className="mt-2 flex flex-wrap items-center gap-4">
          <Link href={`/admin/crm/contractors/${order.contractor_id}`} className="label text-accent hover:underline">
            Контрагент #{order.contractor_id} →
          </Link>
          <Link href={`/admin/crm/orders/${order.id}/proposal`} className="label text-accent hover:underline">
            Коммерческое предложение →
          </Link>
        </div>
        <div className="mt-3">
          <QuickUpdate orderId={id} onApplied={loadOrder} />
        </div>
      </div>

      <ProjectEconomics data={data.financials} />

      <div>
        <p className="section-title mb-4">Позиции</p>

        <div className="space-y-2">
          {rows.map((row, i) => (
            <div key={i} className="grid grid-cols-2 gap-2 rounded-xl bg-surface p-3 sm:grid-cols-[1fr_80px_70px_100px_80px_auto]">
              <input
                className={field}
                list="catalog-items"
                placeholder="Название"
                value={row.title}
                onChange={(e) => updateRow(i, { title: e.target.value })}
                onBlur={(e) => {
                  if (allCatalogItems.some((c) => c.name === e.target.value)) pickCatalogItem(i, e.target.value);
                }}
              />
              <input
                className={field}
                placeholder="Кол-во"
                inputMode="numeric"
                value={row.quantity}
                onChange={(e) => updateRow(i, { quantity: e.target.value })}
              />
              <input
                className={field}
                placeholder="Ед."
                value={row.unit}
                onChange={(e) => updateRow(i, { unit: e.target.value })}
              />
              <input
                className={field}
                placeholder="Цена, ₽"
                inputMode="decimal"
                value={row.unitPrice}
                onChange={(e) => updateRow(i, { unitPrice: e.target.value })}
              />
              <input
                className={field}
                placeholder="Скидка %"
                inputMode="numeric"
                value={row.discountPercent}
                onChange={(e) => updateRow(i, { discountPercent: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setRows((prev) => prev.filter((_, idx) => idx !== i))}
                className="label text-muted hover:text-accent"
              >
                Убрать
              </button>
            </div>
          ))}
        </div>

        <datalist id="catalog-items">
          {allCatalogItems.map((c) => (
            <option key={c.name} value={c.name} />
          ))}
        </datalist>

        <div className="mt-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setRows((prev) => [...prev, emptyRow()])}
            className="section-title"
          >
            + позиция
          </button>
          <span className="label-lg text-ink">
            Итого: {total.toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ₽
          </span>
        </div>

        <button
          type="button"
          onClick={saveItems}
          disabled={savingItems}
          className="pill label mt-4 bg-accent text-bg hover:bg-accent-soft disabled:bg-line disabled:text-muted"
        >
          {savingItems ? "Сохраняем…" : "Сохранить позиции"}
        </button>
      </div>

      <OrderLegalEntity orderId={String(id)} legalEntityId={order.legal_entity_id} onChanged={loadOrder} />

      <OrderDocuments orderId={String(id)} contractorId={order.contractor_id} legalEntityId={order.legal_entity_id} />

      <OrderCosts orderId={String(id)} onChanged={loadOrder} />

      <div>
        <p className="section-title mb-4">Статус</p>
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
        <p className="section-title mb-4">Платежи по заказу</p>

        <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl bg-surface p-3 sm:grid-cols-[120px_1fr_1fr_auto]">
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
            placeholder="Сумма, ₽"
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
            type="button"
            onClick={submitPayment}
            disabled={savingPayment || !paymentForm.amount}
            className="pill label bg-accent text-bg hover:bg-accent-soft disabled:bg-line disabled:text-muted"
          >
            {savingPayment ? "…" : "Записать"}
          </button>
        </div>

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
        <p className="section-title mb-4">Журнал</p>
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
