"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ContractorBalance } from "@/lib/crm/reconciliation";
import type { OwnerDashboard } from "@/lib/crm/dashboard";
import { OwnerOverview } from "./OwnerOverview";

type DebtEntry = ContractorBalance;
type ActivityEntry = {
  id: number;
  entity_type: "order" | "contractor";
  entity_id: number;
  event: string;
  message: string;
  actor: string | null;
  created_at: string;
};
type ActiveDeals = {
  count: number;
  amountKopecks: number;
  byStatus: { status: string; count: number; amountKopecks: number }[];
};
type TaskEntry = {
  id: number;
  title: string;
  due_at: string | null;
  contractor_name: string | null;
  order_id: number | null;
  order_title: string | null;
};

type Dashboard = {
  owner: OwnerDashboard;
  monthRevenueKopecks: number;
  monthCostKopecks: number;
  activeDeals: ActiveDeals;
  debts: { owedToUs: DebtEntry[]; weOwe: DebtEntry[] };
  tasks: TaskEntry[];
  activity: ActivityEntry[];
};

function isOverdue(dueAt: string): boolean {
  // due_at — либо чистая дата, либо UTC-момент; сравниваем по дню в московском времени
  const todayMsk = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const dueDay = dueAt.length <= 10 ? dueAt : new Date(new Date(dueAt.replace(" ", "T") + "Z").getTime() + 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return dueDay < todayMsk;
}

const statusLabel: Record<string, string> = {
  new: "Новые",
  in_production: "В работе",
  ready: "Готовы",
  shipped: "Отправлены",
};

function money(kopecks: number): string {
  return `${(kopecks / 100).toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ₽`;
}

export default function CrmDashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [doneIds, setDoneIds] = useState<Set<number>>(new Set());

  const load = () => {
    fetch("/api/crm/dashboard")
      .then((r) => r.json())
      .then(setData);
  };

  useEffect(load, []);

  const completeTask = async (id: number) => {
    setDoneIds((prev) => new Set(prev).add(id));
    await fetch(`/api/crm/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "done" }),
    });
    load();
  };

  if (!data) return <p className="label text-muted">Загрузка…</p>;

  const monthNet = data.monthRevenueKopecks - data.monthCostKopecks;
  const tasks = data.tasks.filter((t) => !doneIds.has(t.id));

  return (
    <div className="space-y-10">
      <OwnerOverview data={data.owner} />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-tint p-7">
          <p className="label text-accent mb-2">Оплачено нам в этом месяце</p>
          <p className="display text-ink" style={{ fontSize: "2rem" }}>
            {money(data.monthRevenueKopecks)}
          </p>
        </div>
        <div className="rounded-2xl bg-surface p-7">
          <p className="label text-muted mb-2">Затраты в этом месяце</p>
          <p className="display text-ink" style={{ fontSize: "2rem" }}>
            {money(data.monthCostKopecks)}
          </p>
        </div>
        <div className="rounded-2xl bg-surface p-7">
          <p className="label text-muted mb-2">Разница</p>
          <p className={`display ${monthNet >= 0 ? "text-accent" : "text-ink"}`} style={{ fontSize: "2rem" }}>
            {monthNet >= 0 ? "+" : ""}
            {money(monthNet)}
          </p>
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-baseline justify-between">
          <p className="label text-accent">Задачи на сегодня{tasks.some((t) => t.due_at && isOverdue(t.due_at)) ? " и просроченные" : ""}</p>
          <Link href="/admin/crm/tasks" className="label text-muted hover:text-accent">
            Все задачи →
          </Link>
        </div>
        {tasks.length === 0 ? (
          <p className="label text-muted">На сегодня ничего не просрочено и не назначено</p>
        ) : (
          <ul className="divide-y divide-line border-t border-line">
            {tasks.map((t) => {
              const overdue = !!t.due_at && isOverdue(t.due_at);
              return (
                <li key={t.id} className="flex items-center gap-3 py-3">
                  <button
                    type="button"
                    onClick={() => completeTask(t.id)}
                    className="h-5 w-5 shrink-0 rounded-md border border-line hover:border-accent hover:bg-tint"
                    title="Отметить выполненной"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="label text-ink truncate">{t.title}</p>
                    <p className="label text-muted">
                      {t.contractor_name}
                      {t.order_id && t.order_title ? ` · ${t.order_title}` : ""}
                    </p>
                  </div>
                  {t.due_at && (
                    <span className={`label shrink-0 ${overdue ? "text-accent" : "text-muted"}`}>
                      {overdue ? "Просрочено · " : ""}
                      {new Date(t.due_at.replace(" ", "T") + (t.due_at.length > 10 ? "Z" : "")).toLocaleDateString("ru-RU")}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div>
        <div className="mb-4 flex items-baseline justify-between">
          <p className="label text-accent">Сделки в работе</p>
          <Link href="/admin/crm/orders" className="label text-muted hover:text-accent">
            Все сделки →
          </Link>
        </div>
        <div className="rounded-2xl bg-surface p-6">
          <div className="flex items-baseline gap-3">
            <span className="display text-ink" style={{ fontSize: "1.8rem" }}>
              {data.activeDeals.count}
            </span>
            <span className="label text-muted">
              на сумму <span className="text-ink">{money(data.activeDeals.amountKopecks)}</span>
            </span>
          </div>
          {data.activeDeals.byStatus.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {data.activeDeals.byStatus.map((s) => (
                <span key={s.status} className="pill label bg-tint text-ink-soft">
                  {statusLabel[s.status] || s.status}: {s.count} · {money(s.amountKopecks)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <p className="label text-accent mb-4">Должны нам</p>
          {data.debts.owedToUs.length === 0 ? (
            <p className="label text-muted">Никто не должен</p>
          ) : (
            <ul className="space-y-2">
              {data.debts.owedToUs.map((d) => (
                <li key={d.contractorId}>
                  <Link
                    href={`/admin/crm/contractors/${d.contractorId}`}
                    className="flex items-center justify-between rounded-xl bg-surface px-4 py-3 hover:bg-tint"
                  >
                    <span className="label text-ink">{d.name}</span>
                    <span className="label text-accent">{money(d.outstandingKopecks)}</span>
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
                <li key={d.contractorId}>
                  <Link
                    href={`/admin/crm/contractors/${d.contractorId}`}
                    className="flex items-center justify-between rounded-xl bg-surface px-4 py-3 hover:bg-tint"
                  >
                    <span className="label text-ink">{d.name}</span>
                    <span className="label text-ink-soft">{money(d.outstandingKopecks)}</span>
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
                    {a.entity_type === "order" ? "Сделка" : "Контрагент"} #{a.entity_id}
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
