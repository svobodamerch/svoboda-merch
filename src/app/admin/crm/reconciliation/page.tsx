"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ContractorBalance } from "@/lib/crm/reconciliation";

type Data = {
  exceptions: ContractorBalance[];
  open: ContractorBalance[];
  settled: ContractorBalance[];
};

function money(kopecks: number): string {
  return `${(kopecks / 100).toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ₽`;
}

function Row({ b }: { b: ContractorBalance }) {
  const isSupplier = b.role === "supplier";
  const outstanding = b.outstandingKopecks;

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-4">
      <div className="min-w-[220px]">
        <Link href={`/admin/crm/contractors/${b.contractorId}`} className="label text-ink hover:text-accent">
          {b.name}
        </Link>
        <p className="label text-muted mt-0.5">
          {isSupplier ? "подрядчик" : "клиент"}
          {b.openingKopecks !== 0 && ` · начальный остаток ${money(b.openingKopecks)}`}
          {" · начислено "}
          {money(b.accruedKopecks)}
          {" · оплачено "}
          {money(b.paidKopecks)}
        </p>
      </div>
      <span className={`label shrink-0 ${outstanding < 0 ? "text-amber-700" : "text-ink"}`}>
        {outstanding === 0
          ? "закрыт"
          : outstanding < 0
            ? `переплата ${money(-outstanding)}`
            : `${isSupplier ? "мы должны" : "должен нам"} ${money(outstanding)}`}
      </span>
    </li>
  );
}

export default function ReconciliationPage() {
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    fetch("/api/crm/reconciliation")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) return <p className="label text-muted">Загрузка…</p>;

  return (
    <div className="space-y-10">
      <div>
        <p className="label-lg text-ink">Сверка</p>
        <p className="label text-muted mt-2">
          Долг нигде не хранится — он всегда считается как начальный остаток плюс начисления
          минус платежи. Если заплачено больше, чем начислено, причина обычно одна из двух:
          начисление не заведено, либо это долг с прошлого периода.
        </p>
      </div>

      <div>
        <p className="section-title mb-4">Расхождения ({data.exceptions.length})</p>
        {data.exceptions.length === 0 ? (
          <p className="label text-muted">Расхождений нет</p>
        ) : (
          <ul className="divide-y divide-line border-t border-line">
            {data.exceptions.map((b) => (
              <Row key={b.contractorId} b={b} />
            ))}
          </ul>
        )}
      </div>

      <div>
        <p className="section-title mb-4">Открытые балансы ({data.open.length})</p>
        {data.open.length === 0 ? (
          <p className="label text-muted">Все балансы закрыты</p>
        ) : (
          <ul className="divide-y divide-line border-t border-line">
            {data.open.map((b) => (
              <Row key={b.contractorId} b={b} />
            ))}
          </ul>
        )}
      </div>

      <div>
        <p className="section-title mb-4">Закрытые ({data.settled.length})</p>
        <ul className="divide-y divide-line border-t border-line">
          {data.settled.map((b) => (
            <Row key={b.contractorId} b={b} />
          ))}
        </ul>
      </div>
    </div>
  );
}
