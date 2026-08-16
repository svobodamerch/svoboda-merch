"use client";

import { useEffect, useState, type FormEvent } from "react";

type Product = {
  id: number;
  category: "clothing" | "accessories" | "other";
  title: string;
  description: string | null;
  default_cost_kopecks: number;
  default_sell_price_kopecks: number;
  lead_time: string | null;
};

const categoryLabel: Record<Product["category"], string> = {
  clothing: "Одежда",
  accessories: "Аксессуары",
  other: "Другое",
};

function money(kopecks: number): string {
  return `${(kopecks / 100).toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ₽`;
}

const field =
  "w-full rounded-xl border border-line bg-bg px-4 py-3 text-[13px] text-ink outline-none focus:border-accent";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    category: "clothing",
    title: "",
    cost: "",
    sellPrice: "",
    leadTime: "",
  });
  const [saving, setSaving] = useState(false);

  const load = () => {
    fetch("/api/crm/products")
      .then((r) => r.json())
      .then((d) => setProducts(d.products));
  };

  useEffect(load, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    await fetch("/api/crm/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ category: "clothing", title: "", cost: "", sellPrice: "", leadTime: "" });
    setShowForm(false);
    setSaving(false);
    load();
  };

  const remove = async (id: number) => {
    await fetch(`/api/crm/products/${id}`, { method: "DELETE" });
    load();
  };

  if (!products) return <p className="label text-muted">Загрузка…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="label-lg text-ink">Товары</p>
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
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          >
            <option value="clothing">Одежда</option>
            <option value="accessories">Аксессуары</option>
            <option value="other">Другое</option>
          </select>
          <input
            className={field}
            placeholder="Название *"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <input
            className={field}
            placeholder="Себестоимость, ₽"
            inputMode="decimal"
            value={form.cost}
            onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
          />
          <input
            className={field}
            placeholder="Цена продажи, ₽"
            inputMode="decimal"
            value={form.sellPrice}
            onChange={(e) => setForm((f) => ({ ...f, sellPrice: e.target.value }))}
          />
          <input
            className={field}
            placeholder="Срок изготовления"
            value={form.leadTime}
            onChange={(e) => setForm((f) => ({ ...f, leadTime: e.target.value }))}
          />
          <button
            type="submit"
            disabled={saving || !form.title.trim()}
            className="pill label bg-accent text-bg hover:bg-accent-soft disabled:bg-line disabled:text-muted sm:col-span-2"
          >
            Сохранить
          </button>
        </form>
      )}

      <ul className="divide-y divide-line border-t border-line">
        {products.map((p) => {
          const margin = p.default_sell_price_kopecks - p.default_cost_kopecks;
          return (
            <li key={p.id} className="flex items-start justify-between gap-4 py-4">
              <div>
                <p className="label text-ink">{p.title}</p>
                <p className="label text-muted mt-1">
                  {categoryLabel[p.category]} · Себестоимость {money(p.default_cost_kopecks)} · Продажа{" "}
                  {money(p.default_sell_price_kopecks)} · Маржа {money(margin)}
                  {p.lead_time && ` · Срок: ${p.lead_time}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove(p.id)}
                className="label text-muted hover:text-accent shrink-0"
              >
                Убрать
              </button>
            </li>
          );
        })}
      </ul>
      {products.length === 0 && <p className="label text-muted">Каталог пока пуст</p>}
    </div>
  );
}
