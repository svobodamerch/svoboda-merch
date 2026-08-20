"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DocumentPrint, type DocumentPrintData } from "@/components/crm/DocumentPrint";

type BankAccount = { id: number; bank_name: string; account_number: string; bik: string; is_default: number };

type Doc = {
  id: number;
  doc_type: "invoice" | "act";
  number: string;
  doc_date: string;
  status: "draft" | "issued" | "paid" | "cancelled";
  total_kopecks: number;
  basis: string | null;
  comment: string | null;
  legal_entity_id: number;
  bank_account_id: number | null;
  contractor_id: number;
  order_id: number | null;
  contractor_name: string | null;
  entity_short_name: string | null;
  supplier_snapshot: string;
  buyer_snapshot: string;
};

type Item = { id: number; title: string; quantity: number; unit: string; unit_price_kopecks: number };

type ItemForm = { title: string; quantity: string; unit: string; unitPrice: string };

const statusLabel: Record<Doc["status"], string> = {
  draft: "Черновик",
  issued: "Выставлен",
  paid: "Оплачен",
  cancelled: "Отменён",
};

const field =
  "w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-[13px] text-ink outline-none focus:border-accent";

const emptyRow = (): ItemForm => ({ title: "", quantity: "1", unit: "шт", unitPrice: "" });

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [doc, setDoc] = useState<Doc | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [editing, setEditing] = useState(false);
  const [rows, setRows] = useState<ItemForm[]>([]);
  const [basis, setBasis] = useState("");
  const [comment, setComment] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => {
    fetch(`/api/crm/documents/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setDoc(d.document);
        setItems(d.items);
        setBasis(d.document.basis || "");
        setComment(d.document.comment || "");
        setBankAccountId(d.document.bank_account_id ? String(d.document.bank_account_id) : "");
        setRows(
          d.items.length
            ? d.items.map((it: Item) => ({
                title: it.title,
                quantity: String(it.quantity),
                unit: it.unit,
                unitPrice: String(it.unit_price_kopecks / 100),
              }))
            : [emptyRow()],
        );
      });
  };

  useEffect(load, [id]);

  useEffect(() => {
    if (!doc) return;
    fetch("/api/crm/legal-entities")
      .then((r) => r.json())
      .then((d) => {
        const entity = d.entities.find((e: { id: number }) => e.id === doc.legal_entity_id);
        setBankAccounts(entity?.bankAccounts || []);
      });
  }, [doc]);

  const saveEdits = async () => {
    setBusy(true);
    await fetch(`/api/crm/documents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        basis,
        comment,
        bankAccountId: bankAccountId || undefined,
        items: rows
          .filter((r) => r.title.trim())
          .map((r) => ({ title: r.title, quantity: Number(r.quantity) || 1, unit: r.unit, unitPrice: r.unitPrice })),
      }),
    });
    setBusy(false);
    setEditing(false);
    load();
  };

  const setStatus = async (status: Doc["status"]) => {
    setBusy(true);
    await fetch(`/api/crm/documents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusy(false);
    load();
  };

  const markPaid = async () => {
    setBusy(true);
    await fetch(`/api/crm/documents/${id}/pay`, { method: "POST" });
    setBusy(false);
    load();
  };

  const createAct = async () => {
    setBusy(true);
    const r = await fetch(`/api/crm/documents/${id}/act`, { method: "POST" });
    const d = await r.json();
    setBusy(false);
    if (d.document) router.push(`/admin/crm/documents/${d.document.id}`);
  };

  const removeDraft = async () => {
    setBusy(true);
    await fetch(`/api/crm/documents/${id}`, { method: "DELETE" });
    router.push("/admin/crm/documents");
  };

  if (!doc) return <p className="label text-muted">Загрузка…</p>;

  const supplier = JSON.parse(doc.supplier_snapshot);
  const buyer = JSON.parse(doc.buyer_snapshot);
  const printData: DocumentPrintData = {
    docType: doc.doc_type,
    number: doc.number,
    docDate: doc.doc_date,
    totalKopecks: doc.total_kopecks,
    basis: doc.basis,
    supplier,
    buyer,
    items: items.map((i) => ({ ...i, amount_kopecks: Math.round(i.quantity * i.unit_price_kopecks) })),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <Link href="/admin/crm/documents" className="label text-muted hover:text-ink">
            ← Документы
          </Link>
          <div className="mt-2 flex items-center gap-3">
            <p className="label-lg text-ink">
              {doc.doc_type === "act" ? "Акт" : "Счёт"} №{doc.number}
            </p>
            <span className="pill label bg-tint text-ink-soft">{statusLabel[doc.status]}</span>
          </div>
          <p className="label text-muted mt-1">
            {doc.entity_short_name} · {doc.contractor_name}
            {doc.order_id && (
              <>
                {" · "}
                <Link href={`/admin/crm/orders/${doc.order_id}`} className="text-accent">
                  сделка →
                </Link>
              </>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {doc.status === "draft" && (
            <>
              <button
                type="button"
                onClick={() => setEditing((v) => !v)}
                className="pill label bg-surface text-ink-soft hover:bg-tint"
              >
                {editing ? "Отмена" : "Редактировать"}
              </button>
              <button
                type="button"
                onClick={() => setStatus("issued")}
                disabled={busy}
                className="pill label bg-accent text-bg hover:bg-accent-soft"
              >
                Выставить
              </button>
              <button type="button" onClick={removeDraft} disabled={busy} className="label text-muted hover:text-accent">
                Удалить
              </button>
            </>
          )}
          {doc.status === "issued" && doc.doc_type === "invoice" && (
            <button
              type="button"
              onClick={markPaid}
              disabled={busy}
              className="pill label bg-accent text-bg hover:bg-accent-soft"
            >
              Отметить оплаченным
            </button>
          )}
          {doc.doc_type === "invoice" && (doc.status === "issued" || doc.status === "paid") && (
            <button
              type="button"
              onClick={createAct}
              disabled={busy}
              className="pill label bg-surface text-ink-soft hover:bg-tint"
            >
              Создать акт
            </button>
          )}
          <button
            type="button"
            onClick={() => window.print()}
            className="pill label bg-surface text-ink-soft hover:bg-tint"
          >
            Печать / PDF
          </button>
        </div>
      </div>

      {editing ? (
        <div className="space-y-4 rounded-2xl bg-surface p-6 print:hidden">
          <div className="grid gap-3 sm:grid-cols-2">
            <select className={field} value={bankAccountId} onChange={(e) => setBankAccountId(e.target.value)}>
              {bankAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.bank_name} · ...{a.account_number.slice(-6)}
                  {a.is_default ? " (основной)" : ""}
                </option>
              ))}
            </select>
            <input
              className={field}
              placeholder="Основание (например «Договор № от …»)"
              value={basis}
              onChange={(e) => setBasis(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            {rows.map((row, i) => (
              <div key={i} className="grid grid-cols-2 gap-2 rounded-xl bg-bg p-3 sm:grid-cols-[1fr_80px_70px_100px_auto]">
                <input
                  className={field}
                  placeholder="Название"
                  value={row.title}
                  onChange={(e) => setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, title: e.target.value } : r)))}
                />
                <input
                  className={field}
                  placeholder="Кол-во"
                  inputMode="decimal"
                  value={row.quantity}
                  onChange={(e) => setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, quantity: e.target.value } : r)))}
                />
                <input
                  className={field}
                  placeholder="Ед."
                  value={row.unit}
                  onChange={(e) => setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, unit: e.target.value } : r)))}
                />
                <input
                  className={field}
                  placeholder="Цена, ₽"
                  inputMode="decimal"
                  value={row.unitPrice}
                  onChange={(e) => setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, unitPrice: e.target.value } : r)))}
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
            <button type="button" onClick={() => setRows((prev) => [...prev, emptyRow()])} className="section-title">
              + позиция
            </button>
          </div>

          <textarea
            className={`${field} resize-none`}
            rows={2}
            placeholder="Комментарий (не печатается, только для себя)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />

          <button
            type="button"
            onClick={saveEdits}
            disabled={busy}
            className="pill label bg-accent text-bg hover:bg-accent-soft"
          >
            {busy ? "…" : "Сохранить"}
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-line p-6 print:border-0 print:p-0">
          <DocumentPrint data={printData} />
        </div>
      )}
    </div>
  );
}
