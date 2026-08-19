"use client";

import Link from "next/link";
import type { OwnerDashboard } from "@/lib/crm/dashboard";

/**
 * Первый экран собственника. Порядок блоков не случаен: сначала то, что
 * требует решения сегодня, потом деньги, и только потом прибыль — прибыльный
 * бизнес умирает от нехватки денег, а не от низкой маржи.
 */

function money(kopecks: number): string {
  return `${(kopecks / 100).toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ₽`;
}

const alertStyle: Record<string, string> = {
  critical: "bg-red-50 text-red-700",
  warning: "bg-amber-50 text-amber-700",
  info: "bg-surface text-ink-soft",
};

const healthDot: Record<string, string> = {
  green: "bg-accent",
  yellow: "bg-amber-500",
  red: "bg-red-500",
};

function Figure({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl bg-surface p-5">
      <p className="label text-muted mb-1">{label}</p>
      <p className="label-lg text-ink">{value}</p>
      {hint && <p className="label text-muted mt-1">{hint}</p>}
    </div>
  );
}

export function OwnerOverview({ data }: { data: OwnerDashboard }) {
  const { money: m, profit, projects, alerts } = data;

  return (
    <div className="space-y-8">
      {alerts.length > 0 && (
        <div>
          <p className="label text-accent mb-4">Внимание</p>
          <div className="space-y-2">
            {alerts.map((a, i) => {
              const body = <span className="label">{a.title}</span>;
              return a.href ? (
                <Link
                  key={i}
                  href={a.href}
                  className={`block rounded-xl px-4 py-3 hover:opacity-80 ${alertStyle[a.severity]}`}
                >
                  {body}
                </Link>
              ) : (
                <p key={i} className={`rounded-xl px-4 py-3 ${alertStyle[a.severity]}`}>
                  {body}
                </p>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <div className="mb-4 flex items-baseline justify-between">
          <p className="label text-accent">Деньги</p>
          <Link href="/admin/crm/cash" className="label text-muted hover:text-accent">
            Прогноз кассы →
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Figure
            label="Сейчас на счетах"
            value={m.balanceKnown ? money(m.currentBalanceKopecks) : "не введено"}
          />
          <Figure
            label="Минимум за 30 дней"
            value={money(m.minimumBalanceKopecks)}
            hint={m.minimumOnDate ? new Date(m.minimumOnDate).toLocaleDateString("ru-RU") : undefined}
          />
          <Figure
            label="Клиенты должны"
            value={money(m.receivableKopecks)}
            hint={`ждём ${money(m.expectedInKopecks)} за 30 дней`}
          />
          <Figure
            label="Мы должны"
            value={money(m.payableKopecks)}
            hint={`платим ${money(m.expectedOutKopecks)} за 30 дней`}
          />
        </div>
      </div>

      <div>
        <p className="label text-accent mb-4">Прибыль по активным проектам</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <Figure label="Прогноз выручки" value={money(profit.forecastRevenueKopecks)} />
          <Figure label="Прогноз прибыли" value={money(profit.forecastProfitKopecks)} />
          <Figure
            label="Маржа"
            value={profit.marginPercent !== null ? `${profit.marginPercent} %` : "—"}
          />
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-baseline justify-between">
          <p className="label text-accent">
            Проекты: {projects.green} в норме · {projects.yellow} под вопросом · {projects.red} проблемных
          </p>
          <Link href="/admin/crm/orders" className="label text-muted hover:text-accent">
            Все сделки →
          </Link>
        </div>
        {projects.list.length === 0 ? (
          <p className="label text-muted">Активных проектов нет</p>
        ) : (
          <ul className="divide-y divide-line border-t border-line">
            {projects.list.map((p) => (
              <li key={p.orderId}>
                <Link
                  href={`/admin/crm/orders/${p.orderId}`}
                  className="flex flex-wrap items-center gap-3 py-3 hover:opacity-80"
                >
                  <span className={`h-2 w-2 shrink-0 rounded-full ${healthDot[p.health]}`} />
                  <span className="label text-ink min-w-0 flex-1 truncate">{p.title}</span>
                  {p.reason && <span className="label text-muted shrink-0">{p.reason}</span>}
                  <span className="label text-ink shrink-0">
                    {money(p.forecastProfitKopecks)}
                    {p.marginPercent !== null && (
                      <span className="text-muted"> · {p.marginPercent}%</span>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
