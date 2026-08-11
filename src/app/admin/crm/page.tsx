"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Contractor = { id: number; name: string; company: string | null };
type DebtEntry = { contractor: Contractor; balance_kopecks: number };
type ActivityEntry = {
  id: number;
  entity_type: "order" | "contractor";
  entity_id: number;
  event: string;
  message: string;
  actor: string | null;
  created_at: string;
};

type Dashboard = {
  monthRevenueKopecks: number;
  debts: { owedToUs: DebtEntry[]; weOwe: DebtEntry[] };
  activity: ActivityEntry[];
};

function money(kopecks: number): string {
  return `${(kopecks / 100).toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ₽`;
}

export default function CrmDashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);

  useEffect(() => {
    fetch("/api/crm/dashboard")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) return <p className="label text-muted">Загрузка…</p>;

  return (
    <div className="space-y-10">
      <div className="rounded-2xl bg-tint p-7">
        <p className="label text-accent mb-2">Оплачено нам в этом месяце</p>
        <p className="display text-ink" style={{ fontSize: "2.4rem" }}>
          {money(data.monthRevenueKopecks)}
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <p className="label text-accent mb-4">Должны нам</p>
          {data.debts.owedToUs.length === 0 ? (
            <p className="label text-muted">Никто не должен</p>
          ) : (
            <ul className="space-y-2">
              {data.debts.owedToUs.map((d) => (
                <li key={d.contractor.id}>
                  <Link
                    href={`/admin/crm/contractors/${d.contractor.id}`}
                    className="flex items-center justify-between rounded-xl bg-surface px-4 py-3 hover:bg-tint"
                  >
                    <span className="label text-ink">{d.contractor.name}</span>
                    <span className="label text-accent">{money(d.balance_kopecks)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <p className="label text-accent mb-4">Должны мы</p>
          {data.debts.weOwe.length === 0 ? (
            <p className="label text-muted">Никому не должны</p>
          ) : (
            <ul className="space-y-2">
              {data.debts.weOwe.map((d) => (
                <li key={d.contractor.id}>
                  <Link
                    href={`/admin/crm/contractors/${d.contractor.id}`}
                    className="flex items-center justify-between rounded-xl bg-surface px-4 py-3 hover:bg-tint"
                  >
                    <span className="label text-ink">{d.contractor.name}</span>
                    <span className="label text-ink-soft">{money(-d.balance_kopecks)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div>
        <p className="label text-accent mb-4">Бортовой журнал</p>
        {data.activity.length === 0 ? (
          <p className="label text-muted">Пока пусто</p>
        ) : (
          <ul className="divide-y divide-line border-t border-line">
            {data.activity.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="label text-ink">{a.message}</p>
                  <p className="label text-muted">
                    {a.entity_type === "order" ? "Заказ" : "Контрагент"} #{a.entity_id}
                    {a.actor ? ` · ${a.actor}` : ""}
                  </p>
                </div>
                <span className="label text-muted shrink-0">
                  {new Date(a.created_at).toLocaleString("ru-RU")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
