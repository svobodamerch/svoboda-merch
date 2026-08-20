"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ContractorPicker } from "@/components/crm/ContractorPicker";

type Contractor = { id: number; name: string; company: string | null };
type Order = { id: number; title: string };
type Category = { id: number; name: string; kind: "fixed" | "variable" };

type ReviewCost = {
  id: number;
  order_id: number;
  order_title: string | null;
  title: string;
  contractor_id: number | null;
  review_note: string | null;
  amount_kopecks: number;
  supplier_invoice: string | null;
};

type OrphanPayment = {
  id: number;
  contractor_name: string | null;
  direction: "in" | "out";
  amount_kopecks: number;
  comment: string | null;
  paid_at: string;
};

type MtTransaction = {
  id: string;
  occurred_at: string;
  type: "income" | "expense";
  amount_kopecks: number;
  comment: string;
  category: string;
};

type DuplicateSide = {
  id: number;
  source: string;
  comment: string | null;
  paidAt: string;
  orderTitle: string | null;
};

type DuplicatePair = {
  a: DuplicateSide;
  b: DuplicateSide;
  amountKopecks: number;
  direction: string;
  differentOrders: boolean;
};

function money(kopecks: number): string {
  return `${(kopecks / 100).toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ₽`;
}

const field =
  "rounded-xl border border-line bg-bg px-3 py-2.5 text-[13px] text-ink outline-none focus:border-accent";

export default function ReviewQueuePage() {
  const [costs, setCosts] = useState<ReviewCost[]>([]);
  const [payments, setPayments] = useState<OrphanPayment[]>([]);
  const [mtTransactions, setMtTransactions] = useState<MtTransaction[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicatePair[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [mtCategoryDrafts, setMtCategoryDrafts] = useState<Record<string, string>>({});
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [payDrafts, setPayDrafts] = useState<Record<number, string>>({});
  const [mtContractorDrafts, setMtContractorDrafts] = useState<Record<string, string>>({});
  const [mtOrderDrafts, setMtOrderDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<number | null>(null);
  const [mtBusy, setMtBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** Молчаливый отказ выглядит как «кнопка не работает» — показываем причину */
  const send = async (url: string, init?: RequestInit) => {
    setError(null);
    try {
      const r = await fetch(url, init);
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setError(d.error || `Сервер ответил ${r.status}. Попробуйте ещё раз`);
        return false;
      }
      return true;
    } catch {
      setError("Нет связи с сервером — возможно, идёт обновление. Повторите через минуту");
      return false;
    }
  };

  const load = () => {
    fetch("/api/crm/review")
      .then((r) => r.json())
      .then((d) => {
        setCosts(d.costs);
        setPayments(d.orphanPayments || []);
        setMtTransactions(d.moneyTreker || []);
        setDuplicates(d.duplicates || []);
        setDrafts(
          Object.fromEntries(d.costs.map((c: ReviewCost) => [c.id, c.contractor_id ? String(c.contractor_id) : ""])),
        );
      });
    fetch("/api/crm/contractors")
      .then((r) => r.json())
      .then((d) => setContractors(d.contractors));
    fetch("/api/crm/orders")
      .then((r) => r.json())
      .then((d) => setOrders(d.orders));
    fetch("/api/crm/expense-categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []));
  };

  useEffect(load, []);

  const resolveCost = async (id: number, extra: Record<string, unknown> = {}) => {
    setBusy(id);
    await fetch(`/api/crm/order-costs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ needsReview: false, ...extra }),
    });
    setBusy(null);
    load();
  };

  const assignPayment = async (paymentId: number) => {
    const orderId = payDrafts[paymentId];
    if (!orderId) return;
    setBusy(paymentId);
    await fetch(`/api/crm/payments/${paymentId}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: Number(orderId) }),
    });
    setBusy(null);
    load();
  };

  const linkMt = async (id: string) => {
    setMtBusy(id);
    const ok = await send(`/api/crm/review/money-treker/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contractorId: mtContractorDrafts[id] || undefined,
        orderId: mtOrderDrafts[id] || undefined,
        categoryId: mtCategoryDrafts[id] || undefined,
      }),
    });
    setMtBusy(null);
    if (ok) load();
  };

  const dismissMt = async (id: string) => {
    setMtBusy(id);
    await fetch(`/api/crm/review/money-treker/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dismiss: true }),
    });
    setMtBusy(null);
    load();
  };

  const nothingToDo =
    costs.length === 0 && payments.length === 0 && mtTransactions.length === 0 && duplicates.length === 0;

  const resolveDuplicate = async (body: Record<string, unknown>) => {
    const ok = await send("/api/crm/review/duplicates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (ok) load();
  };

  return (
    <div className="space-y-10">
      <div>
        <p className="label-lg text-ink">Разбор</p>
        <p className="label text-muted mt-1">
          Всё, что внесено приблизительно или ещё не разнесено по сделкам. Дошли руки — поправьте и уберите отсюда.
        </p>
      </div>

      {error && (
        <p className="label rounded-xl bg-red-50 px-4 py-3 text-red-700">{error}</p>
      )}

      {duplicates.length > 0 && (
        <div>
          <p className="label text-accent mb-1">Возможные дубли · {duplicates.length}</p>
          <p className="label text-muted mb-4">
            Одна сумма в одну сторону с разницей до трёх дней. Обычно это одна операция, внесённая
            и руками, и через трекер — пока дубль висит, прибыль и касса считаются неверно.
          </p>
          <ul className="divide-y divide-line border-t border-line">
            {duplicates.map((d) => (
              <li key={`${d.a.id}-${d.b.id}`} className="py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="label text-ink">
                    {d.direction === "in" ? "+" : "−"}
                    {money(d.amountKopecks)}
                  </span>
                  {d.differentOrders && (
                    <span className="label text-muted">разные сделки — скорее всего не дубль</span>
                  )}
                </div>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {[d.a, d.b].map((p) => (
                    <div key={p.id} className="rounded-xl bg-surface p-3">
                      <p className="label text-ink-soft">{p.comment || "без комментария"}</p>
                      <p className="label text-muted mt-1">
                        {p.orderTitle ? `${p.orderTitle} · ` : ""}
                        {p.source === "money_treker" ? "из трекера" : "вручную"} ·{" "}
                        {new Date(p.paidAt.replace(" ", "T")).toLocaleDateString("ru-RU")}
                      </p>
                      <button
                        type="button"
                        onClick={() => resolveDuplicate({ action: "delete", paymentId: p.id })}
                        className="label text-accent mt-2 hover:underline"
                      >
                        Удалить этот
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    resolveDuplicate({ action: "dismiss", paymentA: d.a.id, paymentB: d.b.id })
                  }
                  className="label text-muted mt-2 hover:text-ink"
                >
                  Это разные операции
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {payments.length > 0 && (
        <div>
          <p className="label text-accent mb-1">Платежи без сделки · {payments.length}</p>
          <p className="label text-muted mb-4">
            Эти деньги прошли по счёту, но не попадают в прибыль ни одного проекта, пока не привязаны.
          </p>
          <ul className="divide-y divide-line border-t border-line">
            {payments.map((p) => (
              <li key={p.id} className="py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="label text-ink">{p.contractor_name || "Без контрагента"}</span>
                  <span className={`label ${p.direction === "in" ? "text-accent" : "text-ink-soft"}`}>
                    {p.direction === "in" ? "+" : "−"}
                    {money(p.amount_kopecks)}
                  </span>
                </div>
                <p className="label text-muted mt-1">
                  {new Date(p.paid_at).toLocaleDateString("ru-RU")}
                  {p.comment ? ` · ${p.comment}` : ""}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <select
                    className={field}
                    value={payDrafts[p.id] ?? ""}
                    onChange={(e) => setPayDrafts((d) => ({ ...d, [p.id]: e.target.value }))}
                  >
                    <option value="">К какой сделке…</option>
                    {orders.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.title}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => assignPayment(p.id)}
                    disabled={busy === p.id || !payDrafts[p.id]}
                    className="pill label bg-accent text-bg hover:bg-accent-soft disabled:bg-line disabled:text-muted"
                  >
                    Привязать
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {mtTransactions.length > 0 && (
        <div>
          <p className="label text-accent mb-1">Из Money Treker · {mtTransactions.length}</p>
          <p className="label text-muted mb-4">
            Бизнес-операции из трекера, ещё не разнесённые по сделкам. Свяжите с контрагентом и сделкой — станет
            платежом в CRM, или отклоните, если это не по делу.
          </p>
          <ul className="divide-y divide-line border-t border-line">
            {mtTransactions.map((t) => (
              <li key={t.id} className="py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="label text-ink">{t.comment || t.category}</span>
                  <span className={`label ${t.type === "income" ? "text-accent" : "text-ink-soft"}`}>
                    {t.type === "income" ? "+" : "−"}
                    {money(t.amount_kopecks)}
                  </span>
                </div>
                <p className="label text-muted mt-1">
                  {new Date(t.occurred_at).toLocaleDateString("ru-RU")} · {t.category}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <div className="w-56">
                    <ContractorPicker
                      contractors={contractors}
                      value={mtContractorDrafts[t.id] ?? ""}
                      onChange={(id) => setMtContractorDrafts((d) => ({ ...d, [t.id]: id }))}
                      placeholder="Контрагент (необязательно)"
                    />
                  </div>
                  <select
                    className={field}
                    value={mtOrderDrafts[t.id] ?? ""}
                    onChange={(e) => setMtOrderDrafts((d) => ({ ...d, [t.id]: e.target.value }))}
                  >
                    <option value="">К какой сделке (необязательно)…</option>
                    {orders.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.title}
                      </option>
                    ))}
                  </select>
                  <select
                    className={field}
                    value={mtCategoryDrafts[t.id] ?? ""}
                    onChange={(e) => setMtCategoryDrafts((d) => ({ ...d, [t.id]: e.target.value }))}
                  >
                    <option value="">или статья накладных…</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.kind === "fixed" ? "◆" : "◇"} {c.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => linkMt(t.id)}
                    disabled={mtBusy === t.id}
                    className="pill label bg-accent text-bg hover:bg-accent-soft disabled:bg-line disabled:text-muted"
                  >
                    Разнести
                  </button>
                  <button
                    type="button"
                    onClick={() => dismissMt(t.id)}
                    disabled={mtBusy === t.id}
                    className="label text-muted hover:text-accent"
                  >
                    Не по делу — скрыть
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {costs.length > 0 && (
        <div>
          <p className="label text-accent mb-4">Затраты на уточнение · {costs.length}</p>
          <ul className="divide-y divide-line border-t border-line">
            {costs.map((c) => (
              <li key={c.id} className="py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <Link href={`/admin/crm/orders/${c.order_id}`} className="label text-ink hover:text-accent">
                      {c.title}
                    </Link>
                    <span className="label text-muted"> · {c.order_title}</span>
                  </div>
                  <span className="label text-ink-soft">{money(c.amount_kopecks)}</span>
                </div>
                {c.review_note && <p className="label text-accent mt-1">{c.review_note}</p>}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <div className="w-56">
                    <ContractorPicker
                      contractors={contractors}
                      value={drafts[c.id] ?? ""}
                      onChange={(id) => setDrafts((d) => ({ ...d, [c.id]: id }))}
                      placeholder="Уточнить поставщика"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      resolveCost(c.id, drafts[c.id] ? { contractorId: Number(drafts[c.id]) } : {})
                    }
                    disabled={busy === c.id}
                    className="pill label bg-accent text-bg hover:bg-accent-soft disabled:bg-line disabled:text-muted"
                  >
                    Сохранить и снять с разбора
                  </button>
                  <button
                    type="button"
                    onClick={() => resolveCost(c.id)}
                    disabled={busy === c.id}
                    className="label text-muted hover:text-accent"
                  >
                    Просто снять флаг
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {nothingToDo && <p className="label text-muted">Разбирать нечего — всё внесено и разнесено</p>}
    </div>
  );
}
