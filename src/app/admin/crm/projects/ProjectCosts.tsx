"use client";

import { useEffect, useState, type FormEvent } from "react";

type Cost = {
  id: number;
  title: string;
  quantity: number;
  unit: string;
  amount_kopecks: number;
  contractor_name: string | null;
  comment: string | null;
  created_at: string;
};

function money(kopecks: number): string {
  return `${(kopecks / 100).toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ₽`;
}

/** Реальные покупки под проект, который ещё не стал сделкой — «в надежде продать» */
export function ProjectCosts({ projectId }: { projectId: number }) {
  const [costs, setCosts] = useState<Cost[]>([]);
  const [form, setForm] = useState({ title: "", quantity: "1", amount: "", comment: "" });
  const [busy, setBusy] = useState(false);

  const load = () => {
    fetch(`/api/crm/projects/${projectId}/costs`)
      .then((r) => r.json())
      .then((d) => setCosts(d.costs || []));
  };

  useEffect(load, [projectId]);

  const total = costs.reduce((sum, c) => sum + c.amount_kopecks, 0);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.amount.trim()) return;
    setBusy(true);
    await fetch(`/api/crm/projects/${projectId}/costs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ title: "", quantity: "1", amount: "", comment: "" });
    setBusy(false);
    load();
  };

  const remove = async (id: number) => {
    await fetch(`/api/crm/projects/${projectId}/costs/${id}`, { method: "DELETE" });
    load();
  };

  const field =
    "rounded-lg border border-line bg-bg px-2.5 py-2 text-[13px] text-ink outline-none focus:border-accent";

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="section-title">Затраты</p>
        {costs.length > 0 && <span className="label text-ink-soft">Итого: {money(total)}</span>}
      </div>

      {costs.length > 0 && (
        <ul className="divide-y divide-line border-t border-line mb-3">
          {costs.map((c) => (
            <li key={c.id} className="flex items-center justify-between py-2">
              <div>
                <span className="label text-ink">{c.title}</span>
                <span className="label text-muted">
                  {" "}
                  · {c.quantity} {c.unit}
                  {c.contractor_name ? ` · ${c.contractor_name}` : ""}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="label text-ink-soft">{money(c.amount_kopecks)}</span>
                <button type="button" onClick={() => remove(c.id)} className="label text-muted hover:text-red-700">
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={add} className="flex flex-wrap gap-2">
        <input
          className={`${field} min-w-[140px] flex-1`}
          placeholder="Что купили"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        />
        <input
          className={`${field} w-20`}
          placeholder="Кол-во"
          value={form.quantity}
          onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
        />
        <input
          className={`${field} w-28`}
          placeholder="Сумма, ₽"
          inputMode="decimal"
          value={form.amount}
          onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
        />
        <button
          type="submit"
          disabled={busy || !form.title.trim() || !form.amount.trim()}
          className="pill label bg-accent text-bg hover:bg-accent-soft disabled:bg-line disabled:text-muted"
        >
          + добавить
        </button>
      </form>
    </div>
  );
}
