"use client";

import { useEffect, useState, type FormEvent } from "react";

type BankAccount = {
  id: number;
  bank_name: string;
  bik: string;
  corr_account: string | null;
  account_number: string;
  is_default: number;
};

type LegalDocument = {
  id: number;
  legal_entity_id: number;
  title: string;
  status: "open" | "done";
  note: string | null;
};

type LegalEntity = {
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
  bankAccounts: BankAccount[];
  documents: LegalDocument[];
};

const regimeLabel: Record<string, string> = {
  usn_income: "УСН «Доходы»",
  usn_income_minus_expense: "УСН «Доходы минус расходы»",
};

const field =
  "w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-[13px] text-ink outline-none focus:border-accent";

export default function LegalEntitiesPage() {
  const [entities, setEntities] = useState<LegalEntity[]>([]);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState(false);

  const load = () => {
    fetch("/api/crm/legal-entities")
      .then((r) => r.json())
      .then((d) => setEntities(d.entities));
  };

  useEffect(load, []);

  const toggle = async (docId: number, status: "open" | "done") => {
    setBusy(true);
    await fetch(`/api/crm/legal-entities/documents/${docId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusy(false);
    load();
  };

  const remove = async (docId: number) => {
    setBusy(true);
    await fetch(`/api/crm/legal-entities/documents/${docId}`, { method: "DELETE" });
    setBusy(false);
    load();
  };

  const addDoc = async (e: FormEvent, entityId: number) => {
    e.preventDefault();
    const title = (drafts[entityId] || "").trim();
    if (!title) return;
    setBusy(true);
    await fetch("/api/crm/legal-entities/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ legalEntityId: entityId, title }),
    });
    setDrafts((d) => ({ ...d, [entityId]: "" }));
    setBusy(false);
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="label-lg text-ink">Юрлица</p>
        <p className="label text-muted mt-1">
          Реквизиты, налоговый режим и расчётные счета. Каждая сделка привязана к одному из них — это определяет,
          какая ставка налога с неё считается и какие реквизиты попадут в счёт.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {entities.map((e) => {
          const openDocs = e.documents.filter((d) => d.status === "open");
          const doneDocs = e.documents.filter((d) => d.status === "done");
          return (
            <div key={e.id} className="rounded-2xl bg-surface p-6">
              <p className="label-lg text-ink">{e.short_name}</p>
              <p className="label text-accent mt-1">{regimeLabel[e.tax_regime] || e.tax_regime} · {e.tax_rate}%</p>

              <dl className="mt-4 space-y-1.5">
                <Row label="Полное название" value={e.name} />
                <Row label="ИНН" value={e.inn} />
                {e.kpp && <Row label="КПП" value={e.kpp} />}
                {e.ogrnip && <Row label="ОГРНИП" value={e.ogrnip} />}
                {e.address && <Row label="Адрес" value={e.address} />}
                {e.signer_name && <Row label="Подписант" value={e.signer_name} />}
              </dl>

              {e.bankAccounts.length > 0 && (
                <div className="mt-4 space-y-2 border-t border-line pt-4">
                  {e.bankAccounts.map((a) => (
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

              <div className="mt-4 border-t border-line pt-4">
                <p className="section-title mb-2">
                  Документы для контрагента
                  {openDocs.length > 0 && <span className="text-muted"> · собрать {openDocs.length}</span>}
                </p>

                {e.documents.length === 0 ? (
                  <p className="label text-muted">Список пуст</p>
                ) : (
                  <ul className="space-y-1.5">
                    {[...openDocs, ...doneDocs].map((d) => (
                      <li key={d.id} className="flex items-start gap-2">
                        <button
                          type="button"
                          onClick={() => toggle(d.id, d.status === "open" ? "done" : "open")}
                          disabled={busy}
                          className={`mt-0.5 h-[18px] w-[18px] shrink-0 rounded-md border text-[10px] ${
                            d.status === "done"
                              ? "border-accent bg-accent text-bg"
                              : "border-line hover:border-accent hover:bg-tint"
                          }`}
                        >
                          {d.status === "done" ? "✓" : ""}
                        </button>
                        <span className={`label flex-1 ${d.status === "done" ? "text-muted line-through" : "text-ink"}`}>
                          {d.title}
                          {d.note && <span className="text-muted"> · {d.note}</span>}
                        </span>
                        <button
                          type="button"
                          onClick={() => remove(d.id)}
                          disabled={busy}
                          className="label text-muted hover:text-ink"
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <form onSubmit={(ev) => addDoc(ev, e.id)} className="mt-2 flex gap-2">
                  <input
                    className={field}
                    placeholder="Добавить пункт"
                    value={drafts[e.id] || ""}
                    onChange={(ev) => setDrafts((d) => ({ ...d, [e.id]: ev.target.value }))}
                  />
                  <button
                    type="submit"
                    disabled={busy || !(drafts[e.id] || "").trim()}
                    className="pill label bg-accent text-bg hover:bg-accent-soft disabled:bg-line disabled:text-muted shrink-0"
                  >
                    +
                  </button>
                </form>
              </div>
            </div>
          );
        })}
      </div>
      {entities.length === 0 && <p className="label text-muted">Юрлица ещё не заведены</p>}
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
