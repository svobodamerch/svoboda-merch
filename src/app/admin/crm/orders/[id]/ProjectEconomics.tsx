"use client";

import type { ProjectFinancials } from "@/lib/crm/finance";

/**
 * Экономика проекта. Прогноз показывается первым: на незакрытом проекте
 * «получено минус оплачено» выглядит прекрасно ровно до момента, когда
 * приходит счёт от подрядчика, с которым уже договорились.
 */

function money(kopecks: number): string {
  return `${(kopecks / 100).toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ₽`;
}

const severityStyle: Record<string, string> = {
  critical: "bg-red-50 text-red-700",
  warning: "bg-amber-50 text-amber-700",
  info: "bg-surface text-ink-soft",
};

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className={`label ${muted ? "text-muted" : "text-ink-soft"}`}>{label}</span>
      <span className={`label ${muted ? "text-muted" : "text-ink"}`}>{value}</span>
    </div>
  );
}

export function ProjectEconomics({ data }: { data: ProjectFinancials }) {
  const { revenue, costs, warnings } = data;
  const margin = data.forecastMarginPercent;

  return (
    <div>
      <p className="label text-accent mb-4">Экономика проекта</p>

      <div className="rounded-2xl bg-surface p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <span className="label text-muted">Прогнозная прибыль</span>
          <span className="label-lg text-ink">
            {money(data.forecastProfitKopecks)}
            {margin !== null && <span className="label text-muted"> · {margin}%</span>}
          </span>
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-surface p-5">
          <p className="label text-muted mb-3">Выручка</p>
          <div className="space-y-1.5">
            <Row label="По договорённости" value={money(revenue.contractedKopecks)} />
            <Row label="Выставлено счетами" value={money(revenue.invoicedKopecks)} />
            <Row label="Получено" value={money(revenue.receivedKopecks)} />
          </div>
        </div>

        <div className="rounded-2xl bg-surface p-5">
          <p className="label text-muted mb-3">Затраты</p>
          <div className="space-y-1.5">
            <Row label="Оплачено" value={money(costs.actualKopecks)} />
            <Row label="Согласовано, не оплачено" value={money(costs.committedKopecks)} />
            <Row label="Планируется" value={money(costs.plannedKopecks)} muted />
            <Row label="Прогноз итога" value={money(costs.forecastKopecks)} />
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-surface p-5">
          <p className="label text-muted mb-1">Ждём от клиента</p>
          <p className="label text-ink">{money(data.receivableKopecks)}</p>
        </div>
        <div className="rounded-2xl bg-surface p-5">
          <p className="label text-muted mb-1">Не выставлено</p>
          <p className="label text-ink">{money(data.unbilledKopecks)}</p>
        </div>
        <div className="rounded-2xl bg-surface p-5">
          <p className="label text-muted mb-1">Должны подрядчикам</p>
          <p className="label text-ink">{money(data.payableKopecks)}</p>
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="mt-3 space-y-2">
          {warnings.map((w) => (
            <p key={w.code} className={`label rounded-xl px-4 py-3 ${severityStyle[w.severity]}`}>
              {w.message}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
