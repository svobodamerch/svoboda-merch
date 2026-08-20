"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

type Contractor = {
  id: number;
  type: "client" | "supplier" | "both";
  name: string;
  company: string | null;
  phone: string | null;
};

const typeLabel: Record<Contractor["type"], string> = {
  client: "Клиент",
  supplier: "Поставщик",
  both: "Клиент и поставщик",
};

const field =
  "w-full rounded-xl border border-line bg-bg px-4 py-3 text-[13px] text-ink outline-none focus:border-accent";

export default function ContractorsPage() {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "client", name: "", company: "", phone: "", telegram: "" });
  // Покупатели и поставщики — разные списки: с ними разная работа и разные деньги
  const [tab, setTab] = useState<"client" | "supplier">("client");
  const [saving, setSaving] = useState(false);

  const load = () => {
    fetch("/api/crm/contractors")
      .then((r) => r.json())
      .then((d) => setContractors(d.contractors));
  };

  useEffect(load, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    await fetch("/api/crm/contractors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ type: "client", name: "", company: "", phone: "", telegram: "" });
    setShowForm(false);
    setSaving(false);
    load();
  };

  const visible = contractors.filter((c) => c.type === tab || c.type === "both");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="label-lg text-ink">Контрагенты</p>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="pill label bg-accent text-bg hover:bg-accent-soft"
        >
          {showForm ? "Отмена" : "Добавить"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="grid gap-3 rounded-2xl bg-surface p-6 sm:grid-cols-2">
          <select
            className={field}
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
          >
            <option value="client">Клиент</option>
            <option value="supplier">Поставщик</option>
            <option value="both">Клиент и поставщик</option>
          </select>
          <input
            className={field}
            placeholder="Имя / название *"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
          <input
            className={field}
            placeholder="Компания"
            value={form.company}
            onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
          />
          <input
            className={field}
            placeholder="Телефон"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
          <input
            className={field}
            placeholder="Телеграм"
            value={form.telegram}
            onChange={(e) => setForm((f) => ({ ...f, telegram: e.target.value }))}
          />
          <button
            type="submit"
            disabled={saving || !form.name.trim()}
            className="pill label bg-accent text-bg hover:bg-accent-soft disabled:bg-line disabled:text-muted sm:col-span-2"
          >
            {saving ? "Сохраняем…" : "Сохранить"}
          </button>
        </form>
      )}

      <div className="flex gap-2">
        {(["client", "supplier"] as const).map((t) => {
          const count = contractors.filter((c) => c.type === t || c.type === "both").length;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`pill label ${tab === t ? "bg-ink text-bg" : "bg-surface text-ink-soft hover:text-ink"}`}
            >
              {t === "client" ? "Покупатели" : "Поставщики"} · {count}
            </button>
          );
        })}
      </div>

      <ul className="divide-y divide-line border-t border-line">
        {visible.map((c) => (
          <li key={c.id}>
            <Link
              href={`/admin/crm/contractors/${c.id}`}
              className="flex items-center justify-between py-4 hover:bg-surface"
            >
              <div>
                <p className="label text-ink">{c.name}</p>
                <p className="label text-muted">
                  {typeLabel[c.type]}
                  {c.company ? ` · ${c.company}` : ""}
                  {c.phone ? ` · ${c.phone}` : ""}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {visible.length === 0 && (
        <p className="label text-muted">
          {tab === "client" ? "Покупателей пока нет" : "Поставщиков пока нет"}
        </p>
      )}
    </div>
  );
}
