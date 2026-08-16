"use client";

import { useEffect, useState, type FormEvent } from "react";

type Task = {
  id: number;
  title: string;
  description: string | null;
  status: "open" | "done";
  due_at: string | null;
  source: string;
  created_by: string | null;
};

const field =
  "w-full rounded-xl border border-line bg-bg px-4 py-3 text-[13px] text-ink outline-none focus:border-accent";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [form, setForm] = useState({ title: "", description: "", dueAt: "" });
  const [saving, setSaving] = useState(false);

  const load = () => {
    fetch("/api/crm/tasks")
      .then((r) => r.json())
      .then((d) => setTasks(d.tasks));
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
    setForm({ title: "", description: "", dueAt: "" });
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
                {t.source === "bot_voice" && <p className="label text-accent mt-0.5">из голосового</p>}
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
