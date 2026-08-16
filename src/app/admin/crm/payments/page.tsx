"use client";

import { useEffect, useState, type FormEvent } from "react";

type Contractor = { id: number; name: string };
type Payment = {
  id: number;
  contractor_id: number;
  order_id: number | null;
  direction: "in" | "out";
  amount_kopecks: number;
  method: string;
  comment: string | null;
  paid_at: string;
};
type MonthRow = {
  month: string;
  crmIncomeKopecks: number;
  crmExpenseKopecks: number;
  mtIncomeKopecks: number;
  mtExpenseKopecks: number;
  incomeKopecks: number;
  expenseKopecks: number;
  netKopecks: number;
};
type ExpenseCategory = { category: string; totalKopecks: number };
type Finance = { months: MonthRow[]; moneyTrekerGeneratedAt: string | null; expenseCategories: ExpenseCategory[] };

const methodLabel: Record<string, string> = {
  cash: "Наличные",
  card: "Карта",
  transfer: "Перевод",
  other: "Другое",
};

function money(kopecks: number): string {
  return `${(kopecks / 100).toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ₽`;
}

const field =
  "w-full rounded-xl border border-line bg-bg px-4 py-3 text-[13px] text-ink outline-none focus:border-accent";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [finance, setFinance] = useState<Finance | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    contractorId: "",
    direction: "in",
    amount: "",
    method: "transfer",
    comment: "",
  });
  const [saving, setSaving] = useState(false);

  const load = () => {
    fetch("/api/crm/payments")
      .then((r) => r.json())
      .then((d) => setPayments(d.payments));
    fetch("/api/crm/contractors")
      .then((r) => r.json())
      .then((d) => setContractors(d.contractors));
    fetch("/api/crm/finance")
      .then((r) => r.json())
      .then(setFinance);
  };

  useEffect(load, []);

  const contractorName = (id: number) => contractors.find((c) => c.id === id)?.name || `#${id}`;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.contractorId || !form.amount) return;
    setSaving(true);
    await fetch("/api/crm/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, contractorId: Number(form.contractorId) }),
    });
    setForm({ contractorId: "", direction: "in", amount: "", method: "transfer", comment: "" });
    setShowForm(false);
    setSaving(false);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="label-lg text-ink">Движение денег</p>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="pill label bg-accent text-bg hover:bg-accent-soft"
        >
          {showForm ? "Отмена" : "Записать платёж"}
        </button>
      </div>

      {finance && finance.months.length > 0 && (
        <div>
          <div className="mb-4 flex items-baseline justify-between">
            <p className="label text-accent">Отчёт по месяцам (CRM + Money Treker, бизнес)</p>
            {finance.moneyTrekerGeneratedAt && (
              <span className="label text-muted">
                данные Money Treker на {new Date(finance.moneyTrekerGeneratedAt).toLocaleDateString("ru-RU")}
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left">
              <thead>
                <tr className="border-b border-line">
                  <th className="label text-muted py-2 pr-4 font-normal">Месяц</th>
                  <th className="label text-muted py-2 pr-4 font-normal">Доход</th>
                  <th className="label text-muted py-2 pr-4 font-normal">Расход</th>
                  <th className="label text-muted py-2 font-normal">Итог</th>
                </tr>
              </thead>
              <tbody>
                {finance.months.map((m) => (
                  <tr key={m.month} className="border-b border-line">
                    <td className="label text-ink py-3 pr-4">{m.month}</td>
                    <td className="label text-accent py-3 pr-4">{money(m.incomeKopecks)}</td>
                    <td className="label text-ink-soft py-3 pr-4">{money(m.expenseKopecks)}</td>
                    <td className={`label py-3 ${m.netKopecks >= 0 ? "text-accent" : "text-ink-soft"}`}>
                      {m.netKopecks >= 0 ? "+" : ""}
                      {money(m.netKopecks)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {finance.expenseCategories.length > 0 && (
            <div className="mt-6">
              <p className="label text-muted mb-3">Расходы по статьям (Money Treker, за всё время)</p>
              <ul className="space-y-1.5">
                {finance.expenseCategories.slice(0, 8).map((c) => (
                  <li key={c.category} className="flex items-center justify-between">
                    <span className="label text-ink-soft">{c.category}</span>
                    <span className="label text-ink">{money(c.totalKopecks)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <form onSubmit={submit} className="grid gap-3 rounded-2xl bg-surface p-6 sm:grid-cols-2">
          <select
            className={field}
            value={form.contractorId}
            onChange={(e) => setForm((f) => ({ ...f, contractorId: e.target.value }))}
          >
            <option value="">Контрагент *</option>
            {contractors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            className={field}
            value={form.direction}
            onChange={(e) => setForm((f) => ({ ...f, direction: e.target.value }))}
          >
            <option value="in">Нам заплатили</option>
            <option value="out">Мы заплатили</option>
          </select>
          <input
            className={field}
            placeholder="Сумма, ₽ *"
            inputMode="decimal"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
          />
          <select
            className={field}
            value={form.method}
            onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))}
          >
            <option value="transfer">Перевод</option>
            <option value="cash">Наличные</option>
            <option value="card">Карта</option>
            <option value="other">Другое</option>
          </select>
          <input
            className={`${field} sm:col-span-2`}
            placeholder="Комментарий"
            value={form.comment}
            onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
          />
          <button
            type="submit"
            disabled={saving || !form.contractorId || !form.amount}
            className="pill label bg-accent text-bg hover:bg-accent-soft disabled:bg-line disabled:text-muted sm:col-span-2"
          >
            {saving ? "Сохраняем…" : "Записать"}
          </button>
        </form>
      )}

      <ul className="divide-y divide-line border-t border-line">
        {payments.map((p) => (
          <li key={p.id} className="flex items-center justify-between py-4">
            <div>
              <p className="label text-ink">
                {contractorName(p.contractor_id)}
                {p.comment ? ` · ${p.comment}` : ""}
              </p>
              <p className="label text-muted">
                {methodLabel[p.method] || p.method} · {new Date(p.paid_at).toLocaleString("ru-RU")}
              </p>
            </div>
            <span className={`label shrink-0 ${p.direction === "in" ? "text-accent" : "text-ink-soft"}`}>
              {p.direction === "in" ? "+" : "−"}
              {money(p.amount_kopecks)}
            </span>
          </li>
        ))}
      </ul>
      {payments.length === 0 && <p className="label text-muted">Платежей пока нет</p>}
    </div>
  );
}
