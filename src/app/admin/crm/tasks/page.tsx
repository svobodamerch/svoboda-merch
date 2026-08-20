"use client";

import { useEffect, useState, type FormEvent } from "react";
import { TaskRow, type Task } from "./TaskRow";

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
    amount: "",
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
    setForm({ title: "", description: "", dueAt: "", contractorId: "", orderId: "", amount: "" });
    setSaving(false);
    load();
  };

  if (!tasks) return <p className="label text-muted">Загрузка…</p>;
  const open = tasks.filter((t) => t.status === "open");
  const done = tasks.filter((t) => t.status === "done");

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
        <input
          className={field}
          placeholder="Сумма, ₽ — необязательно"
          inputMode="decimal"
          value={form.amount}
          onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
        />
        <button
          type="submit"
          disabled={saving || !form.title.trim()}
          className="pill label bg-accent text-bg hover:bg-accent-soft disabled:bg-line disabled:text-muted sm:col-span-2"
        >
          {saving ? "Сохраняем…" : "Добавить"}
        </button>
      </form>

      <div>
        <p className="label text-accent mb-4">Открытые · {open.length}</p>
        <ul className="divide-y divide-line border-t border-line">
          {open.map((t) => (
            <TaskRow key={t.id} task={t} contractors={contractors} orders={orders} onChanged={load} />
          ))}
        </ul>
        {open.length === 0 && <p className="label text-muted">Открытых задач нет</p>}
      </div>

      {done.length > 0 && (
        <div>
          <p className="label text-accent mb-4">Выполнено · {done.length}</p>
          <ul className="divide-y divide-line border-t border-line">
            {done.slice(0, 30).map((t) => (
              <TaskRow key={t.id} task={t} contractors={contractors} orders={orders} onChanged={load} />
            ))}
          </ul>
        </div>
      )}

    </div>
  );
}
