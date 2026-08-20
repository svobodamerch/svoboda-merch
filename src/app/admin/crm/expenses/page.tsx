"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { ExpenseBreakdown } from "@/lib/crm/expenses";

/**
 * Разбор расходов. Деление на постоянные и переменные нужно ради одного
 * вопроса: сколько надо зарабатывать в месяц, чтобы выйти в ноль.
 */

type Category = { id: number; name: string; kind: "fixed" | "variable" };
type Data = { breakdown: ExpenseBreakdown; categories: Category[] };

function money(kopecks: number): string {
  return `${Math.round(kopecks / 100).toLocaleString("ru-RU")} ₽`;
}

function monthName(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  const names = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
  return `${names[m - 1]} ${y}`;
}

const field =
  "rounded-xl border border-line bg-bg px-3 py-2.5 text-[13px] text-ink outline-none focus:border-accent";

export default function ExpensesPage() {
  const [data, setData] = useState<Data | null>(null);
  const [months, setMonths] = useState(6);
  const [busy, setBusy] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", kind: "variable" });

  const load = useCallback(() => {
    fetch(`/api/crm/expenses?months=${months}`)
      .then((r) => r.json())
      .then(setData);
  }, [months]);

  useEffect(load, [load]);

  const addCategory = async (e: FormEvent) => {
    e.preventDefault();
    if (!newCategory.name.trim()) return;
    setBusy(true);
    await fetch("/api/crm/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCategory),
    });
    setNewCategory({ name: "", kind: "variable" });
    setBusy(false);
    load();
  };

  const switchKind = async (categoryId: number, kind: "fixed" | "variable") => {
    setBusy(true);
    await fetch("/api/crm/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId, kind }),
    });
    setBusy(false);
    load();
  };

  if (!data) return <p className="label text-muted">Загрузка…</p>;
  const b = data.breakdown;

  const maxMonth = Math.max(
    1,
    ...b.byMonth.map((m) => Math.max(m.incomeKopecks, m.fixedKopecks + m.variableKopecks + m.directKopecks)),
  );

  const lines = (list: typeof b.fixed, total: number) =>
    list.filter((l) => l.totalKopecks > 0).length === 0 ? (
      <p className="label text-muted">Пока ничего не отнесено</p>
    ) : (
      <ul className="space-y-1.5">
        {list
          .filter((l) => l.totalKopecks > 0)
          .map((l) => (
            <li key={l.categoryId} className="flex items-baseline justify-between gap-3">
              <span className="label text-ink-soft">
                {l.name}
                <span className="text-muted"> · {l.count}</span>
              </span>
              <span className="label text-ink shrink-0">
                {money(l.totalKopecks)}
                <span className="text-muted">
                  {" · "}
                  {total > 0 ? Math.round((l.totalKopecks / total) * 100) : 0}%
                </span>
              </span>
            </li>
          ))}
      </ul>
    );

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="label-lg text-ink">Расходы</p>
          <p className="label text-muted mt-1">
            Постоянные платятся, даже если заказов нет. Переменные растут вместе с оборотом.
            Прямые затраты по проектам показаны отдельно — они уже учтены в марже сделок.
          </p>
        </div>
        <div className="flex gap-2">
          {[3, 6, 12].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMonths(m)}
              className={`pill label ${months === m ? "bg-ink text-bg" : "bg-surface text-ink-soft hover:text-ink"}`}
            >
              {m} мес
            </button>
          ))}
        </div>
      </div>

      {(b.pendingFromTrekerCount > 0 || b.unsortedCount > 0) && (
        <div className="rounded-xl bg-amber-50 px-4 py-3">
          <p className="label text-amber-800">Картина неполная — часть расходов ещё не разнесена</p>
          <p className="label text-amber-700 mt-1">
            {b.pendingFromTrekerCount > 0 && (
              <>
                из трекера ждёт разбора {money(b.pendingFromTrekerKopecks)} ({b.pendingFromTrekerCount} шт)
              </>
            )}
            {b.pendingFromTrekerCount > 0 && b.unsortedCount > 0 && " · "}
            {b.unsortedCount > 0 && (
              <>
                без статьи и сделки {money(b.unsortedKopecks)} ({b.unsortedCount} шт)
              </>
            )}
            {" · "}
            <Link href="/admin/crm/review" className="text-accent hover:underline">
              разобрать →
            </Link>
          </p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-surface p-5">
          <p className="label text-muted mb-1">Постоянные в месяц</p>
          <p className="label-lg text-ink">{money(b.fixedPerMonthKopecks)}</p>
          <p className="label text-muted mt-1">столько нужно закрывать, даже без заказов</p>
        </div>
        <div className="rounded-2xl bg-surface p-5">
          <p className="label text-muted mb-1">Постоянные за период</p>
          <p className="label-lg text-ink">{money(b.fixedTotalKopecks)}</p>
        </div>
        <div className="rounded-2xl bg-surface p-5">
          <p className="label text-muted mb-1">Переменные за период</p>
          <p className="label-lg text-ink">{money(b.variableTotalKopecks)}</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-surface p-5">
          <p className="section-title mb-3">Постоянные</p>
          {lines(b.fixed, b.fixedTotalKopecks)}
        </div>
        <div className="rounded-2xl bg-surface p-5">
          <p className="section-title mb-3">Переменные</p>
          {lines(b.variable, b.variableTotalKopecks)}
        </div>
      </div>

      <div>
        <p className="section-title mb-4">По месяцам</p>
        <div className="space-y-2">
          {b.byMonth.map((m) => {
            const spend = m.fixedKopecks + m.variableKopecks + m.directKopecks;
            const net = m.incomeKopecks - spend;
            return (
              <div key={m.month} className="rounded-xl bg-surface p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="label text-ink">{monthName(m.month)}</span>
                  <span className={`label ${net >= 0 ? "text-ink" : "text-red-700"}`}>
                    {net >= 0 ? "+" : ""}
                    {money(net)}
                  </span>
                </div>
                <div className="mt-2 flex h-2 gap-0.5 overflow-hidden rounded-full bg-bg">
                  <div
                    className="bg-ink/25"
                    style={{ width: `${(m.directKopecks / maxMonth) * 100}%` }}
                    title={`Прямые ${money(m.directKopecks)}`}
                  />
                  <div
                    className="bg-amber-400"
                    style={{ width: `${(m.fixedKopecks / maxMonth) * 100}%` }}
                    title={`Постоянные ${money(m.fixedKopecks)}`}
                  />
                  <div
                    className="bg-accent/60"
                    style={{ width: `${(m.variableKopecks / maxMonth) * 100}%` }}
                    title={`Переменные ${money(m.variableKopecks)}`}
                  />
                </div>
                <p className="label text-muted mt-1.5">
                  приход {money(m.incomeKopecks)} · прямые {money(m.directKopecks)} · постоянные{" "}
                  {money(m.fixedKopecks)} · переменные {money(m.variableKopecks)}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <p className="section-title mb-4">Статьи</p>
        <ul className="divide-y divide-line border-t border-line">
          {data.categories.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
              <span className="label text-ink">{c.name}</span>
              <div className="flex gap-1">
                {(["fixed", "variable"] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => switchKind(c.id, k)}
                    disabled={busy || c.kind === k}
                    className={`rounded-md px-2 py-1 text-[11px] ${
                      c.kind === k ? "bg-ink text-bg" : "bg-surface text-muted hover:text-ink"
                    }`}
                  >
                    {k === "fixed" ? "постоянная" : "переменная"}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>

        <form onSubmit={addCategory} className="mt-4 flex flex-wrap gap-2">
          <input
            className={`${field} flex-1 min-w-[200px]`}
            placeholder="Новая статья"
            value={newCategory.name}
            onChange={(e) => setNewCategory((f) => ({ ...f, name: e.target.value }))}
          />
          <select
            className={field}
            value={newCategory.kind}
            onChange={(e) => setNewCategory((f) => ({ ...f, kind: e.target.value }))}
          >
            <option value="variable">Переменная</option>
            <option value="fixed">Постоянная</option>
          </select>
          <button
            type="submit"
            disabled={busy || !newCategory.name.trim()}
            className="pill label bg-accent text-bg hover:bg-accent-soft disabled:bg-line disabled:text-muted"
          >
            Добавить
          </button>
        </form>
      </div>
    </div>
  );
}
