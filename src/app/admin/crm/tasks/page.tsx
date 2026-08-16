"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

type Task = {
  id: number;
  title: string;
  description: string | null;
  status: "open" | "done";
  due_at: string | null;
  source: string;
  created_by: string | null;
  contractor_id: number | null;
  order_id: number | null;
  contractor_name: string | null;
  order_title: string | null;
};
type Contractor = { id: number; name: string };
type Order = { id: number; title: string };

const field =
  "w-full rounded-xl border border-line bg-bg px-4 py-3 text-[13px] text-ink outline-none focus:border-accent";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    dueAt: "",
    contractorId: "",
    orderId: "",
  });
  const [saving, setSaving] = useState(false);

  const load = () => {
    fetch("/api/crm/tasks")
      .then((r) => r.json())
      .then((d) => setTasks(d.tasks));
    fetch("/api/crm/contractors")
      .then((r) => r.json())
      .then((d) => setContractors(d.contractors));
    fetch("/api/crm/orders")
      .then((r) => r.json())
      .then((d) => setOrders(d.orders));
  };

  useEffect(load, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    await fetch("/api/crm/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ title: "", description: "", dueAt: "", contractorId: "", orderId: "" });
    setSaving(false);
    load();
  };

  const toggle = async (task: Task) => {
    await fetch(`/api/crm/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: task.status === "open" ? "done" : "open" }),
    });
    load();
  };

  if (!tasks) return <p className="label text-muted">Загрузка…</p>;
  const open = tasks.filter((t) => t.status === "open");
  const done = tasks.filter((t) => t.status === "done");

  const links = (t: Task) => (
    <>
      {t.contractor_id && (
        <Link href={`/admin/crm/contractors/${t.contractor_id}`} className="label text-accent hover:underline">
          {t.contractor_name}
        </Link>
      )}
      {t.order_id && (
        <Link href={`/admin/crm/orders/${t.order_id}`} className="label text-accent hover:underline">
          {t.order_title}
        </Link>
      )}
    </>
  );

  return (
    <div className="space-y-8">
      <p className="label-lg text-ink">Задачи</p>

      <form onSubmit={submit} className="grid gap-3 rounded-2xl bg-surface p-6 sm:grid-cols-2">
        <input
          className={`${field} sm:col-span-2`}
          placeholder="Что нужно сделать *"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        />
        <input
          className={field}
          type="date"
          value={form.dueAt}
          onChange={(e) => setForm((f) => ({ ...f, dueAt: e.target.value }))}
        />
        <input
          className={field}
          placeholder="Заметка"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
        <select
          className={field}
          value={form.contractorId}
          onChange={(e) => setForm((f) => ({ ...f, contractorId: e.target.value }))}
        >
          <option value="">Контрагент — необязательно</option>
          {contractors.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          className={field}
          value={form.orderId}
          onChange={(e) => setForm((f) => ({ ...f, orderId: e.target.value }))}
        >
          <option value="">Сделка — необязательно</option>
          {orders.map((o) => (
            <option key={o.id} value={o.id}>
              {o.title}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={saving || !form.title.trim()}
          className="pill label bg-accent text-bg hover:bg-accent-soft disabled:bg-line disabled:text-muted sm:col-span-2"
        >
          {saving ? "Сохраняем…" : "Добавить"}
        </button>
      </form>

      <div>
        <p className="label text-accent mb-4">Открытые ({open.length})</p>
        <ul className="divide-y divide-line border-t border-line">
          {open.map((t) => (
            <li key={t.id} className="flex items-start gap-3 py-3">
              <button
                type="button"
                onClick={() => toggle(t)}
                aria-label="Отметить выполненной"
                className="mt-0.5 h-5 w-5 shrink-0 rounded-full border border-line hover:border-accent"
              />
              <div className="flex-1">
                <p className="label text-ink">{t.title}</p>
                {t.description && <p className="label text-muted mt-0.5">{t.description}</p>}
                <div className="mt-0.5 flex flex-wrap gap-3">
                  {t.source === "bot_voice" && <span className="label text-accent">из голосового</span>}
                  {t.source === "bot_text" && <span className="label text-accent">из чата</span>}
                  {links(t)}
                </div>
              </div>
              {t.due_at && <span className="label text-muted shrink-0">{t.due_at}</span>}
            </li>
          ))}
        </ul>
        {open.length === 0 && <p className="label text-muted">Открытых задач нет</p>}
      </div>

      {done.length > 0 && (
        <div>
          <p className="label text-accent mb-4">Выполнено ({done.length})</p>
          <ul className="divide-y divide-line border-t border-line">
            {done.map((t) => (
              <li key={t.id} className="flex items-start gap-3 py-3">
                <button
                  type="button"
                  onClick={() => toggle(t)}
                  aria-label="Вернуть в открытые"
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-[10px] text-bg"
                >
                  ✓
                </button>
                <p className="label text-muted line-through">{t.title}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
