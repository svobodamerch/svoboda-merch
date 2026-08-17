"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ContractorPicker } from "@/components/crm/ContractorPicker";

type Contractor = { id: number; name: string; company: string | null };
type Order = { id: number; title: string };

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

function money(kopecks: number): string {
  return `${(kopecks / 100).toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ₽`;
}

const field =
  "rounded-xl border border-line bg-bg px-3 py-2.5 text-[13px] text-ink outline-none focus:border-accent";

export default function ReviewQueuePage() {
  const [costs, setCosts] = useState<ReviewCost[]>([]);
  const [payments, setPayments] = useState<OrphanPayment[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [payDrafts, setPayDrafts] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<number | null>(null);

  const load = () => {
    fetch("/api/crm/review")
      .then((r) => r.json())
      .then((d) => {
        setCosts(d.costs);
        setPayments(d.orphanPayments || []);
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

  const nothingToDo = costs.length === 0 && payments.length === 0;

  return (
    <div className="space-y-10">
      <div>
        <p className="label-lg text-ink">Разбор</p>
        <p className="label text-muted mt-1">
          Всё, что внесено приблизительно или ещё не разнесено по сделкам. Дошли руки — поправьте и уберите отсюда.
        </p>
      </div>

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
