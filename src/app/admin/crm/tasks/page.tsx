"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { TaskRow, type Task } from "./TaskRow";

type Contractor = { id: number; name: string };
type Order = { id: number; title: string };

type Commitment = {
  id: number;
  title: string;
  side: "we" | "they";
  due_date: string | null;
  contractor_name: string | null;
  order_id: number | null;
  order_title: string | null;
};

type Project = {
  id: number;
  title: string;
  stage: "idea" | "in_progress" | "proposed" | "done" | "archived";
};

const stageLabel: Record<Project["stage"], string> = {
  idea: "Идея",
  in_progress: "В работе",
  proposed: "Предложено клиенту",
  done: "Готово",
  archived: "Архив",
};

const field =
  "w-full rounded-xl border border-line bg-bg px-4 py-3 text-[13px] text-ink outline-none focus:border-accent";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
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
    fetch("/api/crm/commitments")
      .then((r) => r.json())
      .then((d) => setCommitments(d.commitments || []));
    fetch("/api/crm/projects")
      .then((r) => r.json())
      .then((d) => setProjects((d.projects || []).filter((p: Project) => p.stage !== "done" && p.stage !== "archived")));
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

      {projects.length > 0 && (
        <div>
          <p className="section-title mb-4">Проекты в работе · {projects.length}</p>
          <ul className="divide-y divide-line border-t border-line">
            {projects.map((p) => (
              <li key={p.id}>
                <Link
                  href="/admin/crm/projects"
                  className="flex items-center justify-between py-3 hover:opacity-70"
                >
                  <span className="label text-ink">{p.title}</span>
                  <span className="label text-muted">{stageLabel[p.stage]}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {commitments.length > 0 && (
        <div>
          <p className="section-title mb-4">Договорённости · {commitments.length}</p>
          <ul className="divide-y divide-line border-t border-line">
            {commitments.map((c) => (
              <li key={c.id} className="py-3">
                <div className="flex items-center justify-between">
                  <span className="label text-ink">
                    {c.side === "we" ? "Мы должны: " : "Нам должны: "}
                    {c.title}
                  </span>
                  {c.due_date && <span className="label text-muted">{c.due_date}</span>}
                </div>
                {(c.contractor_name || c.order_title) && (
                  <p className="label text-muted mt-0.5">
                    {c.order_id ? (
                      <Link href={`/admin/crm/orders/${c.order_id}`} className="hover:text-ink">
                        {c.order_title}
                      </Link>
                    ) : (
                      c.contractor_name
                    )}
                  </p>
                )}
              </li>
            ))}
          </ul>
          <Link href="/admin/crm/commitments" className="label text-muted hover:text-ink mt-2 inline-block">
            Все обещания →
          </Link>
        </div>
      )}

      <div>
        <p className="section-title mb-4">Открытые задачи · {open.length}</p>
        <ul className="divide-y divide-line border-t border-line">
          {open.map((t) => (
            <TaskRow key={t.id} task={t} contractors={contractors} orders={orders} onChanged={load} />
          ))}
        </ul>
        {open.length === 0 && <p className="label text-muted">Открытых задач нет</p>}
      </div>

      {done.length > 0 && (
        <div>
          <p className="section-title mb-4">Выполнено · {done.length}</p>
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
