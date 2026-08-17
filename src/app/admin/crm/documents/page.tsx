"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Doc = {
  id: number;
  doc_type: "invoice" | "act";
  number: string;
  doc_date: string;
  status: "draft" | "issued" | "paid" | "cancelled";
  total_kopecks: number;
  contractor_name: string | null;
  entity_short_name: string | null;
};

const statusLabel: Record<Doc["status"], string> = {
  draft: "Черновик",
  issued: "Выставлен",
  paid: "Оплачен",
  cancelled: "Отменён",
};

const statusTone: Record<Doc["status"], string> = {
  draft: "text-muted",
  issued: "text-ink",
  paid: "text-accent",
  cancelled: "text-muted",
};

function money(kopecks: number): string {
  return `${(kopecks / 100).toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ₽`;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [filter, setFilter] = useState<"all" | "invoice" | "act">("all");

  useEffect(() => {
    fetch("/api/crm/documents")
      .then((r) => r.json())
      .then((d) => setDocuments(d.documents));
  }, []);

  const filtered = filter === "all" ? documents : documents.filter((d) => d.doc_type === filter);

  return (
    <div className="space-y-6">
      <div>
        <p className="label-lg text-ink">Документы</p>
        <p className="label text-muted mt-1">Счета и акты по всем сделкам. Выставляются прямо из карточки сделки.</p>
      </div>

      <div className="flex gap-2">
        {(["all", "invoice", "act"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`pill label ${filter === f ? "bg-ink text-bg" : "bg-surface text-ink-soft hover:bg-tint"}`}
          >
            {f === "all" ? "Все" : f === "invoice" ? "Счета" : "Акты"}
          </button>
        ))}
      </div>

      <ul className="divide-y divide-line border-t border-line">
        {filtered.map((d) => (
          <li key={d.id}>
            <Link
              href={`/admin/crm/documents/${d.id}`}
              className="flex items-center justify-between py-4 hover:opacity-70"
            >
              <div>
                <p className="label text-ink">
                  {d.doc_type === "act" ? "Акт" : "Счёт"} №{d.number} · {d.contractor_name}
                </p>
                <p className="label text-muted mt-1">
                  {d.entity_short_name} · {new Date(d.doc_date).toLocaleDateString("ru-RU")}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className={`label ${statusTone[d.status]}`}>{statusLabel[d.status]}</span>
                <span className="label text-ink">{money(d.total_kopecks)}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {filtered.length === 0 && <p className="label text-muted">Документов пока нет</p>}
    </div>
  );
}
