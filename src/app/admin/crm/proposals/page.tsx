"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ProposalListEntry = {
  id: number;
  order_id: number;
  status: string;
  order_title: string;
  order_amount_kopecks: number;
  contractor_name: string;
  updated_at: string;
};

const statusLabel: Record<string, string> = {
  draft: "Черновик",
  sent: "Отправлено",
  viewed: "Просмотрено",
  accepted: "Принято",
  needs_revision: "Нужна правка",
};

const statusColor: Record<string, string> = {
  draft: "text-muted",
  sent: "text-ink-soft",
  viewed: "text-ink",
  accepted: "text-accent",
  needs_revision: "text-accent",
};

function money(kopecks: number): string {
  return `${(kopecks / 100).toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ₽`;
}

export default function ProposalsListPage() {
  const [proposals, setProposals] = useState<ProposalListEntry[] | null>(null);

  useEffect(() => {
    fetch("/api/crm/proposals")
      .then((r) => r.json())
      .then((d) => setProposals(d.proposals));
  }, []);

  if (!proposals) return <p className="label text-muted">Загрузка…</p>;

  return (
    <div className="space-y-6">
      <p className="label-lg text-ink">Коммерческие предложения</p>

      <ul className="divide-y divide-line border-t border-line">
        {proposals.map((p) => (
          <li key={p.id}>
            <Link
              href={`/admin/crm/orders/${p.order_id}/proposal`}
              className="flex items-center justify-between py-4 hover:bg-surface"
            >
              <div>
                <p className="label text-ink">{p.order_title}</p>
                <p className="label text-muted">
                  {p.contractor_name} · {new Date(p.updated_at).toLocaleDateString("ru-RU")}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`label ${statusColor[p.status] || "text-muted"}`}>
                  {statusLabel[p.status] || p.status}
                </span>
                <span className="label-lg text-ink shrink-0">{money(p.order_amount_kopecks)}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {proposals.length === 0 && <p className="label text-muted">Пока нет ни одного КП</p>}
    </div>
  );
}
