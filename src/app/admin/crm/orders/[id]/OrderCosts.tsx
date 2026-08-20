"use client";

import { useEffect, useState } from "react";
import { ContractorPicker } from "@/components/crm/ContractorPicker";

type Contractor = { id: number; name: string; company?: string | null };
type OrderItem = { id: number; title: string };

export type Cost = {
  id: number;
  order_item_id: number | null;
  kind: "material" | "work" | "logistics" | "other";
  title: string;
  contractor_id: number | null;
  contractor_name: string | null;
  item_title: string | null;
  quantity: number;
  unit: string;
  unit_cost_kopecks: number;
  amount_kopecks: number;
  supplier_invoice: string | null;
  status: "planned" | "confirmed" | "paid";
  payment_id: number | null;
  needs_review: number;
  review_note: string | null;
};

const kindLabel: Record<Cost["kind"], string> = {
  material: "Материалы",
  work: "Работа подряда",
  logistics: "Логистика",
  other: "Прочее",
};

const statusLabel: Record<Cost["status"], string> = {
  planned: "План",
  confirmed: "Счёт получен",
  paid: "Оплачено",
};

function money(kopecks: number): string {
  return `${(kopecks / 100).toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ₽`;
}

const field =
  "w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-[13px] text-ink outline-none focus:border-accent";

const emptyForm = {
  title: "",
  kind: "material",
  contractorId: "",
  orderItemId: "",
  quantity: "1",
  unitCost: "",
  amount: "",
  supplierInvoice: "",
  status: "confirmed",
  needsReview: false,
  reviewNote: "",
};

export function OrderCosts({ orderId, onChanged }: { orderId: string; onChanged: () => void }) {
  const [costs, setCosts] = useState<Cost[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = () => {
    fetch(`/api/crm/orders/${orderId}/costs`)
      .then((r) => r.json())
      .then((d) => {
        setCosts(d.costs);
      });
  };

  useEffect(() => {
    load();
    fetch("/api/crm/contractors")
      .then((r) => r.json())
      .then((d) => setContractors(d.contractors));
    fetch(`/api/crm/orders/${orderId}/items`)
      .then((r) => r.json())
      .then((d) => setItems(d.items));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const submit = async () => {
    if (!form.title.trim()) return;
    setBusy(true);
    await fetch(`/api/crm/orders/${orderId}/costs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm(emptyForm);
    setShowForm(false);
    setBusy(false);
    load();
    onChanged();
  };

  const pay = async (costId: number) => {
    setBusy(true);
    await fetch(`/api/crm/order-costs/${costId}/pay`, { method: "POST" });
    setBusy(false);
    load();
    onChanged();
  };

  const remove = async (costId: number) => {
    setBusy(true);
    await fetch(`/api/crm/order-costs/${costId}`, { method: "DELETE" });
    setBusy(false);
    load();
    onChanged();
  };

  // Сумма считается из количества и цены, пока не введена явная сумма
  const computed =
    form.amount ||
    ((Number(form.quantity) || 0) * (parseFloat(form.unitCost.replace(",", ".")) || 0)).toFixed(2);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="section-title">Затраты</p>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="pill label bg-accent text-bg hover:bg-accent-soft"
        >
          {showForm ? "Отмена" : "+ затрата"}
        </button>
      </div>

      {/* Сводка по деньгам живёт в «Экономике проекта» выше — здесь только сами затраты,
          иначе одни и те же цифры считаются в двух местах и однажды разойдутся */}

      {showForm && (
        <div className="mb-4 grid gap-2 rounded-xl bg-surface p-3 sm:grid-cols-2">
          <input
            className={field}
            placeholder="За что затрата *"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <select
            className={field}
            value={form.kind}
            onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value }))}
          >
            {Object.entries(kindLabel).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <ContractorPicker
            contractors={contractors}
            value={form.contractorId}
            onChange={(id) => setForm((f) => ({ ...f, contractorId: id }))}
          />
          <select
            className={field}
            value={form.orderItemId}
            onChange={(e) => setForm((f) => ({ ...f, orderItemId: e.target.value }))}
          >
            <option value="">К какой позиции — общая</option>
            {items.map((it) => (
              <option key={it.id} value={it.id}>
                {it.title}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-3 gap-2">
            <input
              className={field}
              placeholder="Кол-во"
              inputMode="decimal"
              value={form.quantity}
              onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
            />
            <input
              className={field}
              placeholder="Цена за ед."
              inputMode="decimal"
              value={form.unitCost}
              onChange={(e) => setForm((f) => ({ ...f, unitCost: e.target.value }))}
            />
            <input
              className={field}
              placeholder="или сумма"
              inputMode="decimal"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              className={field}
              placeholder="№ счёта поставщика"
              value={form.supplierInvoice}
              onChange={(e) => setForm((f) => ({ ...f, supplierInvoice: e.target.value }))}
            />
            <select
              className={field}
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            >
              <option value="planned">План</option>
              <option value="confirmed">Счёт получен</option>
              <option value="paid">Уже оплачено</option>
            </select>
          </div>
          <label className="label flex items-center gap-2 text-ink-soft sm:col-span-2">
            <input
              type="checkbox"
              checked={form.needsReview}
              onChange={(e) => setForm((f) => ({ ...f, needsReview: e.target.checked }))}
            />
            Не уверен — отметить на разбор
          </label>
          {form.needsReview && (
            <input
              className={`${field} sm:col-span-2`}
              placeholder="Что именно неясно (необязательно)"
              value={form.reviewNote}
              onChange={(e) => setForm((f) => ({ ...f, reviewNote: e.target.value }))}
            />
          )}
          <div className="flex items-center justify-between sm:col-span-2">
            <span className="label text-muted">Итого: {computed} ₽</span>
            <button
              type="button"
              onClick={submit}
              disabled={busy || !form.title.trim()}
              className="pill label bg-accent text-bg hover:bg-accent-soft disabled:bg-line disabled:text-muted"
            >
              {busy ? "…" : "Добавить"}
            </button>
          </div>
        </div>
      )}

      <ul className="divide-y divide-line border-t border-line">
        {costs.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
            <div className="min-w-0">
              <p className="label text-ink flex items-center gap-2">
                {c.title}
                {c.supplier_invoice ? ` · счёт ${c.supplier_invoice}` : ""}
                {!!c.needs_review && (
                  <span className="rounded-full bg-tint px-2 py-0.5 text-[11px] text-accent">на разбор</span>
                )}
              </p>
              <p className="label text-muted">
                {kindLabel[c.kind]}
                {c.contractor_name ? ` · ${c.contractor_name}` : ""}
                {c.item_title ? ` · ${c.item_title}` : ""}
                {c.quantity !== 1 ? ` · ${c.quantity} ${c.unit}` : ""}
                {c.needs_review && c.review_note ? ` · ${c.review_note}` : ""}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span
                className={`label ${
                  c.status === "paid" ? "text-muted" : c.status === "planned" ? "text-muted" : "text-accent"
                }`}
              >
                {statusLabel[c.status]}
              </span>
              <span className="label text-ink-soft">−{money(c.amount_kopecks)}</span>
              {c.status !== "paid" && (
                <button
                  type="button"
                  onClick={() => pay(c.id)}
                  disabled={busy}
                  className="label text-accent hover:underline"
                >
                  Отметить оплаченной
                </button>
              )}
              <button
                type="button"
                onClick={() => remove(c.id)}
                disabled={busy}
                className="label text-muted hover:text-accent"
              >
                Убрать
              </button>
            </div>
          </li>
        ))}
      </ul>
      {costs.length === 0 && (
        <p className="label text-muted">
          Затрат пока нет — добавьте счета поставщиков, чтобы увидеть прибыль проекта
        </p>
      )}
    </div>
  );
}
