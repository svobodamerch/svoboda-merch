"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type BankAccount = {
  id: number;
  bank_name: string;
  bik: string;
  corr_account: string | null;
  account_number: string;
  is_default: number;
  current_balance_kopecks: number;
  balance_updated_at: string | null;
};

type LegalDocument = { id: number; title: string; status: "open" | "done"; note: string | null };

type Entity = {
  id: number;
  name: string;
  short_name: string;
  inn: string;
  kpp: string | null;
  ogrnip: string | null;
  address: string | null;
  signer_name: string | null;
  tax_regime: string;
  tax_rate: number;
};

type Payment = {
  id: number;
  direction: "in" | "out";
  amount_kopecks: number;
  comment: string | null;
  paid_at: string;
  kind: string;
  contractor_name: string | null;
  order_title: string | null;
};

type Order = { id: number; title: string; amount_kopecks: number; status: string; contractor_name: string };

type Activity = { payments: Payment[]; orders: Order[]; totalInKopecks: number; totalOutKopecks: number };

const regimeLabel: Record<string, string> = {
  usn_income: "УСН «Доходы»",
  usn_income_minus_expense: "УСН «Доходы минус расходы»",
};

const money = (k: number) => `${(k / 100).toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ₽`;

export default function LegalEntityCardPage() {
  const { id } = useParams<{ id: string }>();
  const [entity, setEntity] = useState<Entity | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [exporting, setExporting] = useState<"pdf" | "docx" | null>(null);

  useEffect(() => {
    fetch(`/api/crm/legal-entities/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setEntity(d.entity);
        setBankAccounts(d.bankAccounts || []);
        setDocuments(d.documents || []);
        setActivity(d.activity);
      });
  }, [id]);

  const download = async (kind: "pdf" | "docx") => {
    setExporting(kind);
    try {
      const res = await fetch(`/api/crm/legal-entities/${id}/card/${kind}`);
      if (!res.ok) {
        alert("Не удалось собрать файл");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Карточка — ${entity?.short_name || "организация"}.${kind}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(null);
    }
  };

  if (!entity || !activity) return <p className="label text-muted">Загрузка…</p>;

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin/crm/legal-entities" className="label text-muted hover:text-ink">
          ← Юрлица
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <p className="label-lg text-ink">{entity.short_name}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => download("pdf")}
              disabled={exporting === "pdf"}
              className="pill label dashed"
            >
              {exporting === "pdf" ? "Собираем…" : "Скачать карточку PDF"}
            </button>
            <button
              type="button"
              onClick={() => download("docx")}
              disabled={exporting === "docx"}
              className="pill label dashed"
            >
              {exporting === "docx" ? "Собираем…" : "Скачать карточку Word"}
            </button>
          </div>
        </div>
        <p className="label text-accent mt-1">
          {regimeLabel[entity.tax_regime] || entity.tax_regime} · {entity.tax_rate}%
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-surface p-6">
          <p className="section-title mb-3">Реквизиты</p>
          <dl className="space-y-1.5">
            <Row label="Полное название" value={entity.name} />
            <Row label="ИНН" value={entity.inn} />
            {entity.kpp && <Row label="КПП" value={entity.kpp} />}
            {entity.ogrnip && <Row label="ОГРНИП" value={entity.ogrnip} />}
            {entity.address && <Row label="Адрес" value={entity.address} />}
            {entity.signer_name && <Row label="Подписант" value={entity.signer_name} />}
          </dl>

          {bankAccounts.length > 0 && (
            <div className="mt-4 space-y-2 border-t border-line pt-4">
              {bankAccounts.map((a) => (
                <div key={a.id}>
                  <p className="label text-ink">
                    {a.bank_name}
                    {!!a.is_default && <span className="section-title"> · основной</span>}
                  </p>
                  <p className="label text-muted">
                    р/с {a.account_number} · БИК {a.bik}
                    {a.corr_account ? ` · к/с ${a.corr_account}` : ""}
                  </p>
                </div>
              ))}
            </div>
          )}

          {documents.length > 0 && (
            <div className="mt-4 border-t border-line pt-4">
              <p className="section-title mb-2">Документы для контрагента</p>
              <ul className="space-y-1">
                {documents.map((d) => (
                  <li key={d.id} className={`label ${d.status === "done" ? "text-muted line-through" : "text-ink"}`}>
                    {d.title}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-surface p-6">
          <p className="section-title mb-3">Движение денег через это юрлицо</p>
          <div className="flex gap-6">
            <div>
              <p className="label text-muted">Получено</p>
              <p className="label-lg text-accent">{money(activity.totalInKopecks)}</p>
            </div>
            <div>
              <p className="label text-muted">Оплачено</p>
              <p className="label-lg text-ink">{money(activity.totalOutKopecks)}</p>
            </div>
          </div>

          {activity.orders.length > 0 && (
            <div className="mt-4 border-t border-line pt-4">
              <p className="section-title mb-2">Сделки через это юрлицо · {activity.orders.length}</p>
              <ul className="space-y-1.5">
                {activity.orders.map((o) => (
                  <li key={o.id}>
                    <Link href={`/admin/crm/orders/${o.id}`} className="label text-ink hover:text-accent">
                      {o.title}
                    </Link>
                    <span className="label text-muted"> · {o.contractor_name} · {money(o.amount_kopecks)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {activity.payments.length > 0 && (
        <div>
          <p className="section-title mb-4">Платежи · {activity.payments.length}</p>
          <ul className="divide-y divide-line border-t border-line">
            {activity.payments.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <span className="label text-ink">
                    {p.contractor_name || "Без контрагента"}
                    {p.order_title ? ` · ${p.order_title}` : ""}
                  </span>
                  {p.comment && <p className="label text-muted mt-0.5">{p.comment}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="label text-muted">{new Date(p.paid_at).toLocaleDateString("ru-RU")}</span>
                  <span className={`label ${p.direction === "in" ? "text-accent" : "text-ink-soft"}`}>
                    {p.direction === "in" ? "+" : "−"}
                    {money(p.amount_kopecks)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="label text-muted">{label}</dt>
      <dd className="label text-ink-soft text-right">{value}</dd>
    </div>
  );
}
