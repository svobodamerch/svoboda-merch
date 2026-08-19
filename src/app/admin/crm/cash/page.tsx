"use client";

import { useEffect, useState, type FormEvent } from "react";
import { cashKindLabel, confidenceLabel, type CashEvent, type CashForecast, type CashKind } from "@/lib/crm/cash-types";

type Account = {
  id: number;
  bank_name: string;
  account_number: string;
  current_balance_kopecks: number;
  balance_updated_at: string | null;
};

type Data = { forecast: CashForecast; expected: CashEvent[]; accounts: Account[] };

function money(kopecks: number): string {
  return `${(kopecks / 100).toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ₽`;
}

const field =
  "w-full rounded-xl border border-line bg-bg px-4 py-3 text-[13px] text-ink outline-none focus:border-accent";

export default function CashPage() {
  const [data, setData] = useState<Data | null>(null);
  const [saving, setSaving] = useState(false);
  const [balances, setBalances] = useState<Record<number, string>>({});
  const [form, setForm] = useState({
    direction: "in",
    kind: "" as CashKind | "",
    amount: "",
    expectedAt: "",
    confidence: "medium",
    comment: "",
  });

  const load = () => {
    fetch("/api/crm/cash")
      .then((r) => r.json())
      .then(setData);
  };

  useEffect(load, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.amount || !form.expectedAt) return;
    setSaving(true);
    await fetch("/api/crm/cash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ direction: "in", kind: "", amount: "", expectedAt: "", confidence: "medium", comment: "" });
    setSaving(false);
    load();
  };

  const saveBalance = async (accountId: number) => {
    const value = balances[accountId];
    if (value === undefined) return;
    setSaving(true);
    await fetch("/api/crm/cash/balance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId, balance: value }),
    });
    setSaving(false);
    load();
  };

  if (!data) return <p className="label text-muted">Загрузка…</p>;
  const { forecast, expected, accounts } = data;

  return (
    <div className="space-y-10">
      <div>
        <p className="label-lg text-ink">Прогноз кассы</p>
        <p className="label text-muted mt-2">
          Главное здесь — не итог периода, а минимальный остаток внутри него: прибыльный проект
          спокойно создаёт кассовый разрыв, если подрядчику платить раньше, чем платит клиент.
        </p>
      </div>

      {!forecast.balanceKnown && (
        <p className="label rounded-xl bg-amber-50 px-4 py-3 text-amber-700">
          Остатки на счетах не введены — пока это прогноз движения денег, а не остатка.
        </p>
      )}

      <div>
        <p className="label text-accent mb-4">Остатки на счетах</p>
        <div className="space-y-2">
          {accounts.map((a) => (
            <div key={a.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-surface p-4">
              <div className="min-w-[200px] flex-1">
                <p className="label text-ink">{a.bank_name}</p>
                <p className="label text-muted">
                  …{a.account_number.slice(-4)}
                  {a.balance_updated_at
                    ? ` · обновлён ${new Date(a.balance_updated_at).toLocaleDateString("ru-RU")}`
                    : " · не заполнен"}
                </p>
              </div>
              <input
                className={`${field} max-w-[180px]`}
                placeholder={money(a.current_balance_kopecks)}
                inputMode="decimal"
                value={balances[a.id] ?? ""}
                onChange={(e) => setBalances((b) => ({ ...b, [a.id]: e.target.value }))}
              />
              <button
                type="button"
                onClick={() => saveBalance(a.id)}
                disabled={saving || balances[a.id] === undefined}
                className="pill label bg-accent text-bg hover:bg-accent-soft disabled:bg-line disabled:text-muted"
              >
                Сохранить
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="label text-accent mb-4">Горизонты</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {forecast.horizons.map((h) => (
            <div key={h.days} className="rounded-2xl bg-surface p-5">
              <p className="label text-muted mb-3">{h.days} дней</p>
              <div className="space-y-1.5">
                <div className="flex justify-between gap-3">
                  <span className="label text-muted">Придёт</span>
                  <span className="label text-ink">{money(h.expectedInKopecks)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="label text-muted">— уверенно</span>
                  <span className="label text-ink-soft">{money(h.highConfidenceInKopecks)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="label text-muted">Уйдёт</span>
                  <span className="label text-ink">{money(h.expectedOutKopecks)}</span>
                </div>
                <div className="flex justify-between gap-3 border-t border-line pt-1.5">
                  <span className="label text-muted">Остаток на конец</span>
                  <span className="label text-ink">{money(h.projectedBalanceKopecks)}</span>
                </div>
              </div>
              <div
                className={`mt-3 rounded-xl px-3 py-2.5 ${
                  h.minimumBalanceKopecks < 0 ? "bg-red-50 text-red-700" : "bg-bg text-ink"
                }`}
              >
                <p className="label">Минимум {money(h.minimumBalanceKopecks)}</p>
                {h.minimumOnDate && (
                  <p className="label text-muted mt-0.5">
                    {new Date(h.minimumOnDate).toLocaleDateString("ru-RU")}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="label text-accent mb-4">Добавить ожидание</p>
        <form onSubmit={submit} className="grid gap-2 rounded-xl bg-surface p-4 sm:grid-cols-2">
          <select
            className={field}
            value={form.direction}
            onChange={(e) => setForm((f) => ({ ...f, direction: e.target.value }))}
          >
            <option value="in">Нам заплатят</option>
            <option value="out">Мы заплатим</option>
          </select>
          <select
            className={field}
            value={form.kind}
            onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value as CashKind }))}
          >
            <option value="">Смысл не указан</option>
            {(Object.keys(cashKindLabel) as CashKind[])
              .filter((k) => k !== "other")
              .map((k) => (
                <option key={k} value={k}>
                  {cashKindLabel[k]}
                </option>
              ))}
          </select>
          <input
            className={field}
            placeholder="Сумма *"
            inputMode="decimal"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
          />
          <input
            className={field}
            type="date"
            value={form.expectedAt}
            onChange={(e) => setForm((f) => ({ ...f, expectedAt: e.target.value }))}
          />
          <select
            className={field}
            value={form.confidence}
            onChange={(e) => setForm((f) => ({ ...f, confidence: e.target.value }))}
          >
            <option value="high">Уверенность высокая — договор и дата согласованы</option>
            <option value="medium">Средняя — подтвердили устно</option>
            <option value="low">Низкая — просто ожидаем</option>
          </select>
          <input
            className={field}
            placeholder="Комментарий"
            value={form.comment}
            onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
          />
          <button
            type="submit"
            disabled={saving}
            className="pill label bg-accent text-bg hover:bg-accent-soft disabled:bg-line disabled:text-muted sm:col-span-2"
          >
            {saving ? "…" : "Добавить"}
          </button>
        </form>
      </div>

      <div>
        <p className="label text-accent mb-4">Ожидаемые события</p>
        {expected.length === 0 ? (
          <p className="label text-muted">Пока ничего не запланировано</p>
        ) : (
          <ul className="divide-y divide-line border-t border-line">
            {expected.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-4 py-4">
                <div>
                  <p className="label text-ink">
                    {cashKindLabel[e.kind]}
                    {e.orderTitle ? ` · ${e.orderTitle}` : ""}
                    {e.comment ? ` · ${e.comment}` : ""}
                  </p>
                  <p className="label text-muted">
                    {new Date(e.date).toLocaleDateString("ru-RU")} · уверенность{" "}
                    {e.confidence ? confidenceLabel[e.confidence].toLowerCase() : "—"}
                  </p>
                </div>
                <span className={`label shrink-0 ${e.direction === "in" ? "text-accent" : "text-ink-soft"}`}>
                  {e.direction === "in" ? "+" : "−"}
                  {money(e.amountKopecks)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
