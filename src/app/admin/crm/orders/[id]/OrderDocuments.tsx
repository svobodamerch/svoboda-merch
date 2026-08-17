"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type LegalEntity = { id: number; short_name: string; is_default: number };
type OrderItem = { title: string; quantity: number; unit: string; unit_price_kopecks: number };
type Doc = {
  id: number;
  doc_type: "invoice" | "act";
  number: string;
  doc_date: string;
  status: "draft" | "issued" | "paid" | "cancelled";
  total_kopecks: number;
};

const statusLabel: Record<Doc["status"], string> = {
  draft: "Черновик",
  issued: "Выставлен",
  paid: "Оплачен",
  cancelled: "Отменён",
};

function money(kopecks: number): string {
  return `${(kopecks / 100).toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ₽`;
}

/** Выставление счёта прямо из сделки — позиции подтягиваются из состава заказа */
export function OrderDocuments({
  orderId,
  contractorId,
  legalEntityId,
}: {
  orderId: string;
  contractorId: number;
  legalEntityId: number | null;
}) {
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [entities, setEntities] = useState<LegalEntity[]>([]);
  const [busy, setBusy] = useState(false);

  const load = () => {
    fetch(`/api/crm/documents?orderId=${orderId}`)
      .then((r) => r.json())
      .then((d) => setDocuments(d.documents));
  };

  useEffect(() => {
    load();
    fetch("/api/crm/legal-entities")
      .then((r) => r.json())
      .then((d) => setEntities(d.entities));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const createInvoice = async () => {
    const entityId = legalEntityId || entities.find((e) => e.is_default)?.id;
    if (!entityId) return;

    setBusy(true);
    const itemsRes = await fetch(`/api/crm/orders/${orderId}/items`);
    const { items }: { items: OrderItem[] } = await itemsRes.json();

    await fetch("/api/crm/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        docType: "invoice",
        contractorId,
        legalEntityId: entityId,
        orderId: Number(orderId),
        items: items.map((i) => ({
          title: i.title,
          quantity: i.quantity,
          unit: i.unit,
          unitPrice: i.unit_price_kopecks / 100,
        })),
      }),
    });
    setBusy(false);
    load();
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="label text-accent">Счета и акты</p>
        <button
          type="button"
          onClick={createInvoice}
          disabled={busy}
          className="pill label bg-accent text-bg hover:bg-accent-soft disabled:bg-line disabled:text-muted"
        >
          {busy ? "…" : "+ выставить счёт"}
        </button>
      </div>

      <ul className="divide-y divide-line border-t border-line">
        {documents.map((d) => (
          <li key={d.id}>
            <Link href={`/admin/crm/documents/${d.id}`} className="flex items-center justify-between py-3 hover:opacity-70">
              <span className="label text-ink">
                {d.doc_type === "act" ? "Акт" : "Счёт"} №{d.number} · {new Date(d.doc_date).toLocaleDateString("ru-RU")}
              </span>
              <span className="flex shrink-0 items-center gap-3">
                <span className="label text-muted">{statusLabel[d.status]}</span>
                <span className="label text-ink">{money(d.total_kopecks)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {documents.length === 0 && <p className="label text-muted">Ничего не выставлено — состав возьмётся из позиций сделки</p>}
    </div>
  );
}
