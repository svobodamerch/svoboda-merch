"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ContractorPicker } from "@/components/crm/ContractorPicker";

type Contractor = { id: number; name: string; company: string | null };

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

function money(kopecks: number): string {
  return `${(kopecks / 100).toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ₽`;
}

export default function ReviewQueuePage() {
  const [costs, setCosts] = useState<ReviewCost[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<number | null>(null);

  const load = () => {
    fetch("/api/crm/review")
      .then((r) => r.json())
      .then((d) => {
        setCosts(d.costs);
        setDrafts(Object.fromEntries(d.costs.map((c: ReviewCost) => [c.id, c.contractor_id ? String(c.contractor_id) : ""])));
      });
    fetch("/api/crm/contractors")
      .then((r) => r.json())
      .then((d) => setContractors(d.contractors));
  };

  useEffect(load, []);

  const resolve = async (id: number, extra: Record<string, unknown> = {}) => {
    setBusy(id);
    await fetch(`/api/crm/order-costs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ needsReview: false, ...extra }),
    });
    setBusy(null);
    load();
  };

  const applyContractor = (id: number) => {
    const contractorId = drafts[id];
    resolve(id, contractorId ? { contractorId: Number(contractorId) } : {});
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="label-lg text-ink">Разбор</p>
        <p className="label text-muted mt-1">
          Всё, что внесено приблизительно — не ясен поставщик, не сходится количество и т.п. Дошли руки —
          поправьте и снимите с разбора.
        </p>
      </div>

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
                onClick={() => applyContractor(c.id)}
                disabled={busy === c.id}
                className="pill label bg-accent text-bg hover:bg-accent-soft disabled:bg-line disabled:text-muted"
              >
                Сохранить и снять с разбора
              </button>
              <button
                type="button"
                onClick={() => resolve(c.id)}
                disabled={busy === c.id}
                className="label text-muted hover:text-accent"
              >
                Просто снять флаг
              </button>
            </div>
          </li>
        ))}
      </ul>
      {costs.length === 0 && <p className="label text-muted">Разбирать нечего — всё внесено уверенно</p>}
    </div>
  );
}
