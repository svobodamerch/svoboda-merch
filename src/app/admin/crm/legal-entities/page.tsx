"use client";

import { useEffect, useState } from "react";

type BankAccount = {
  id: number;
  bank_name: string;
  bik: string;
  corr_account: string | null;
  account_number: string;
  is_default: number;
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
};

const regimeLabel: Record<string, string> = {
  usn_income: "УСН «Доходы»",
  usn_income_minus_expense: "УСН «Доходы минус расходы»",
};

export default function LegalEntitiesPage() {
  const [entities, setEntities] = useState<LegalEntity[]>([]);

  useEffect(() => {
    fetch("/api/crm/legal-entities")
      .then((r) => r.json())
      .then((d) => setEntities(d.entities));
  }, []);

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
        {entities.map((e) => (
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
                      {!!a.is_default && <span className="label text-accent"> · основной</span>}
                    </p>
                    <p className="label text-muted">
                      р/с {a.account_number} · БИК {a.bik}
                      {a.corr_account ? ` · к/с ${a.corr_account}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
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
