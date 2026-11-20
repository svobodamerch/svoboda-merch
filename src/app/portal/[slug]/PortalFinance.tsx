"use client";

import { useEffect, useState } from "react";

type Entry = {
  id: number;
  entry_date: string;
  category: "business" | "personal";
  direction: "in" | "out";
  amount_kopecks: number | null;
  title: string;
  basis: "confirmed_in_chat" | "needs_check";
  response: "agreed" | "disputed" | null;
  group: "income" | "tax" | "fee" | "expense" | "payout";
  runningKopecks: number | null;
};
type Finance = {
  accountName: string;
  note: string | null;
  taxPercent: number;
  feePercent: number;
  incomeKopecks: number;
  expenseKopecks: number;
  taxKopecks: number;
  feeKopecks: number;
  payoutKopecks: number;
  balanceKopecks: number;
  bank: { balanceKopecks: number; date: string | null; yuraShareKopecks: number } | null;
  confirmedBalanceKopecks: number;
  needsCheckCount: number;
  lastEntryDate: string | null;
  personal: { inKopecks: number; outKopecks: number; balanceKopecks: number } | null;
  expected: { doc_number: string | null; title: string; doc_date: string | null; amount_kopecks: number; tags: string | null; client_name: string | null }[];
  expectedKopecks: number;
  expectedNetKopecks: number;
  pending: { entry_date: string; direction: string; amount_kopecks: number | null; title: string }[];
  entries: Entry[];
};

const money = (k: number) => {
  const frac = k % 100 !== 0 ? 2 : 0;
  return `${(k / 100).toLocaleString("ru-RU", { minimumFractionDigits: frac, maximumFractionDigits: frac })} ₽`;
};
const day = (d: string | null) => (d ? new Date(d.slice(0, 10) + "T00:00:00").toLocaleDateString("ru-RU") : "");
const pct = (v: number) => String(v).replace(".", ",");

const groupLabel: Record<Entry["group"], string> = {
  income: "Приход",
  tax: "Налог",
  fee: "Комиссия",
  expense: "Расход",
  payout: "Андрею",
};

export function PortalFinance({ slug, password }: { slug: string; password: string }) {
  const [f, setF] = useState<Finance | null | undefined>(undefined);
  const [filter, setFilter] = useState<"all" | Entry["group"]>("all");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetch(`/api/portal/${slug}/finance`, { headers: { "x-portal-password": password } })
      .then((r) => r.json())
      .then((d) => setF(d.finance ?? null))
      .catch(() => setF(null));
  }, [slug, password]);

  if (f === undefined) return <p className="label text-muted">Загрузка сводки…</p>;
  if (f === null) return null;

  const rows = f.entries.filter((e) => filter === "all" || e.group === filter);
  const visible = showAll ? rows : rows.slice(0, 15);

  return (
    <div className="space-y-5">
      <p className="label text-accent">Деньги на счёте ИП</p>

      <div className="rounded-2xl bg-tint p-6">
        <p className="label text-accent mb-1">
          {f.balanceKopecks >= 0 ? "Деньги Андрея у Юры" : "Андрей должен Юре"}
        </p>
        <p className="display text-ink" style={{ fontSize: "2.1rem" }}>
          {money(Math.abs(f.balanceKopecks))}
        </p>
        <p className="label text-muted mt-2">
          Приходы от клиентов минус оплаты подрядчикам, налог, комиссия Юры и то, что Юра уже отдал Андрею
          {f.lastEntryDate && <> · по данным на {day(f.lastEntryDate)}</>}
        </p>
        {f.confirmedBalanceKopecks !== f.balanceKopecks && (
          <p className="label text-muted mt-1">
            Только по подтверждённым строкам: {money(f.confirmedBalanceKopecks)}
          </p>
        )}
      </div>

      {f.bank && (
        <div className="rounded-2xl bg-surface p-4">
          <div className="flex items-baseline justify-between gap-2">
            <p className="label text-ink">На расчётном счёте{f.bank.date && <> на {day(f.bank.date)}</>}</p>
            <p className="label text-ink">{money(f.bank.balanceKopecks)}</p>
          </div>
          <ul className="mt-2 space-y-1">
            <li className="flex justify-between gap-3">
              <span className="label text-muted">{f.balanceKopecks >= 0 ? "из них деньги Андрея" : "долг Андрея Юре"}</span>
              <span className="label text-ink-soft">{f.balanceKopecks >= 0 ? "" : "−"}{money(Math.abs(f.balanceKopecks))}</span>
            </li>
            <li className="flex justify-between gap-3">
              <span className="label text-muted">доля Юры (комиссия, его личные деньги)</span>
              <span className="label text-ink-soft">{money(f.bank.yuraShareKopecks)}</span>
            </li>
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Tile label="Приход от клиентов" value={money(f.incomeKopecks)} />
        <Tile label="Оплачено подрядчикам" value={money(f.expenseKopecks)} />
        <Tile label={`Налог ${pct(f.taxPercent)}%`} value={money(f.taxKopecks)} />
        <Tile label={`Комиссия Юры ${pct(f.feePercent)}% — заработано`} value={money(f.feeKopecks)} accent />
        <Tile label="Юра отдал Андрею" value={money(f.payoutKopecks)} />
      </div>

      {f.needsCheckCount > 0 && (
        <p className="label text-muted">
          Строк с пометкой «нужно сверить»: {f.needsCheckCount}. Они входят в остаток, но пока не подтверждены
          перепиской или выпиской.
        </p>
      )}

      {f.expected.length > 0 && (
        <div className="rounded-2xl bg-surface p-4">
          <div className="flex items-baseline justify-between gap-2">
            <p className="label text-ink">Ожидаемые поступления</p>
            <p className="label text-ink">{money(f.expectedKopecks)}</p>
          </div>
          <p className="label text-muted mt-1">
            Выставленные счета, оплаты по которым ещё нет. После налога и комиссии ({pct(f.taxPercent + f.feePercent)}%)
            останется {money(f.expectedNetKopecks)}.
          </p>
          <ul className="mt-3 divide-y divide-line">
            {f.expected.map((d) => (
              <li key={d.doc_number || d.title} className="flex items-start justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="label text-ink-soft">{d.title}</p>
                  <p className="label text-muted">
                    {day(d.doc_date)}
                    {d.client_name && !/остапович/i.test(d.client_name) && <> · {d.client_name}</>}
                  </p>
                </div>
                <span className="label text-ink shrink-0">{money(d.amount_kopecks)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {f.pending.length > 0 && (
        <div className="rounded-2xl bg-surface p-4">
          <p className="label text-ink">На проверке</p>
          <p className="label text-muted mt-1">Найдено в переписке, ещё не внесено в расчёт.</p>
          <ul className="mt-2 divide-y divide-line">
            {f.pending.map((p, i) => (
              <li key={i} className="flex items-start justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="label text-ink-soft">{p.title}</p>
                  <p className="label text-muted">{day(p.entry_date)}</p>
                </div>
                <span className="label text-muted shrink-0">
                  {p.amount_kopecks != null ? `${p.direction === "in" ? "+" : "−"}${money(p.amount_kopecks)}` : "сумма ?"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {f.personal && (
        <div className="rounded-2xl bg-surface p-4">
          <p className="label text-ink">Личные операции Юры (в расчёт с Андреем не входят)</p>
          <p className="label text-muted mt-1">
            Пришло {money(f.personal.inKopecks)} · ушло {money(f.personal.outKopecks)} · остаток {money(f.personal.balanceKopecks)}
          </p>
        </div>
      )}

      <div>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {(["all", "income", "expense", "payout", "tax", "fee"] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setFilter(g)}
              className={`label rounded-lg px-2.5 py-1 ${filter === g ? "bg-ink text-bg" : "bg-surface text-muted hover:text-ink"}`}
            >
              {g === "all" ? "Все операции" : groupLabel[g]}
            </button>
          ))}
        </div>
        <p className="label text-muted mb-2">Под суммой — сколько денег Андрея у Юры после этой операции.</p>
        <ul className="divide-y divide-line border-t border-line">
          {visible.map((e) => (
            <li key={e.id} className="flex items-start justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="label text-ink-soft">{e.title}</p>
                <p className="label text-muted">
                  {day(e.entry_date)} · {groupLabel[e.group]}
                  {e.category === "personal" && " · личное"}
                  {e.basis === "needs_check" && e.response !== "agreed" && " · нужно сверить"}
                  {e.response === "disputed" && " · спорная, не в остатке"}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className={`label ${e.direction === "in" ? "text-accent" : "text-ink"}`}>
                  {e.amount_kopecks == null ? "—" : `${e.direction === "in" ? "+" : "−"}${money(e.amount_kopecks)}`}
                </p>
                {e.runningKopecks != null && (
                  <p className="label text-muted" title="Деньги Андрея у Юры после операции">
                    = {e.runningKopecks < 0 ? "−" : ""}{money(Math.abs(e.runningKopecks))}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
        {rows.length > 15 && (
          <button type="button" onClick={() => setShowAll(!showAll)} className="label mt-2 text-muted hover:text-ink">
            {showAll ? "Свернуть" : `Показать все (${rows.length})`}
          </button>
        )}
      </div>
    </div>
  );
}

function Tile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl bg-surface p-4">
      <p className="label text-muted">{label}</p>
      <p className={`mt-1 text-[17px] ${accent ? "text-accent" : "text-ink"}`}>{value}</p>
    </div>
  );
}
