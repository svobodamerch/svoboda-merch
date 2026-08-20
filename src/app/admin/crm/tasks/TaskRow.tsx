"use client";

import Link from "next/link";
import { useState } from "react";

/**
 * Строка задачи. Правка на месте: задачу чаще всего надо чуть подвинуть или
 * дописать, и ради этого не должно быть отдельной страницы.
 */

export type Task = {
  id: number;
  title: string;
  description: string | null;
  status: "open" | "done";
  due_at: string | null;
  source: string;
  contractor_id: number | null;
  order_id: number | null;
  amount_kopecks: number | null;
  contractor_name: string | null;
  order_title: string | null;
};

type Option = { id: number; title?: string; name?: string };

function money(kopecks: number): string {
  return `${(kopecks / 100).toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ₽`;
}

/** due_at бывает датой и полным моментом — для поля даты нужен только день */
function dayPart(dueAt: string | null): string {
  return dueAt ? dueAt.slice(0, 10) : "";
}

function formatDue(dueAt: string): { text: string; overdue: boolean; today: boolean } {
  const todayMsk = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const day = dayPart(dueAt);
  const hasTime = dueAt.length > 10;
  const time = hasTime ? dueAt.slice(11, 16) : "";
  const [y, m, d] = day.split("-");
  return {
    text: `${d}.${m}${y !== todayMsk.slice(0, 4) ? "." + y : ""}${time ? ` ${time}` : ""}`,
    overdue: day < todayMsk,
    today: day === todayMsk,
  };
}

const field =
  "w-full rounded-lg border border-line bg-bg px-2.5 py-1.5 text-[13px] text-ink outline-none focus:border-accent";

export function TaskRow({
  task,
  contractors,
  orders,
  onChanged,
}: {
  task: Task;
  contractors: Option[];
  orders: Option[];
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState({
    title: task.title,
    description: task.description ?? "",
    dueAt: dayPart(task.due_at),
    contractorId: task.contractor_id ? String(task.contractor_id) : "",
    orderId: task.order_id ? String(task.order_id) : "",
  });

  const save = async () => {
    if (!draft.title.trim()) return;
    setBusy(true);
    await fetch(`/api/crm/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    setBusy(false);
    setEditing(false);
    onChanged();
  };

  const toggle = async () => {
    setBusy(true);
    await fetch(`/api/crm/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: task.status === "open" ? "done" : "open" }),
    });
    setBusy(false);
    onChanged();
  };

  const remove = async () => {
    if (!confirm("Удалить задачу?")) return;
    setBusy(true);
    await fetch(`/api/crm/tasks/${task.id}`, { method: "DELETE" });
    setBusy(false);
    onChanged();
  };

  if (editing) {
    return (
      <li className="space-y-2 py-3">
        <input
          className={field}
          value={draft.title}
          onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
          placeholder="Что нужно сделать"
        />
        <input
          className={field}
          value={draft.description}
          onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
          placeholder="Заметка"
        />
        <div className="grid gap-2 sm:grid-cols-3">
          <input
            className={field}
            type="date"
            value={draft.dueAt}
            onChange={(e) => setDraft((d) => ({ ...d, dueAt: e.target.value }))}
          />
          <select
            className={field}
            value={draft.contractorId}
            onChange={(e) => setDraft((d) => ({ ...d, contractorId: e.target.value }))}
          >
            <option value="">Без контрагента</option>
            {contractors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            className={field}
            value={draft.orderId}
            onChange={(e) => setDraft((d) => ({ ...d, orderId: e.target.value }))}
          >
            <option value="">Без сделки</option>
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.title}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={save}
            disabled={busy || !draft.title.trim()}
            className="pill label bg-accent text-bg hover:bg-accent-soft disabled:bg-line disabled:text-muted"
          >
            Сохранить
          </button>
          <button type="button" onClick={() => setEditing(false)} className="label text-muted hover:text-ink">
            Отмена
          </button>
          <button type="button" onClick={remove} className="label text-muted hover:text-red-700">
            Удалить
          </button>
        </div>
      </li>
    );
  }

  const due = task.due_at ? formatDue(task.due_at) : null;
  const isDone = task.status === "done";

  return (
    <li className="group flex items-start gap-3 py-2.5">
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        aria-label={isDone ? "Вернуть в открытые" : "Отметить выполненной"}
        className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border text-[10px] ${
          isDone ? "border-accent bg-accent text-bg" : "border-line hover:border-accent hover:bg-tint"
        }`}
      >
        {isDone ? "✓" : ""}
      </button>

      <button type="button" onClick={() => setEditing(true)} className="min-w-0 flex-1 text-left">
        <p className={`label ${isDone ? "text-muted line-through" : "text-ink"}`}>{task.title}</p>
        {task.description && !isDone && <p className="label text-muted mt-0.5">{task.description}</p>}
        {(task.contractor_name || task.order_title || task.source !== "manual") && !isDone && (
          <p className="label text-muted mt-0.5">
            {[
              task.source === "bot_voice" ? "из голосового" : task.source === "bot_text" ? "из чата" : null,
              task.contractor_name,
              task.order_title,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
      </button>

      <div className="flex shrink-0 items-center gap-2">
        {task.amount_kopecks != null && !isDone && (
          <span className="label text-muted">{money(task.amount_kopecks)}</span>
        )}
        {due && !isDone && (
          <span
            className={`rounded-md px-1.5 py-0.5 text-[11px] ${
              due.overdue
                ? "bg-red-50 text-red-700"
                : due.today
                  ? "bg-accent/12 text-accent"
                  : "bg-surface text-muted"
            }`}
          >
            {due.overdue ? "просрочено · " : ""}
            {due.text}
          </span>
        )}
        {task.order_id && (
          <Link
            href={`/admin/crm/orders/${task.order_id}`}
            className="label text-muted opacity-0 transition-opacity hover:text-accent group-hover:opacity-100"
            title="Открыть сделку"
          >
            →
          </Link>
        )}
      </div>
    </li>
  );
}
