"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

type TaskFile = { id: number; title: string; original_name: string | null; mime_type: string | null; size_bytes: number | null; created_at: string };
type Task = {
  id: number;
  title: string;
  description: string | null;
  status: "open" | "done";
  due_at: string | null;
  created_at: string;
  done_at: string | null;
  files: TaskFile[];
};

/** В базе время в UTC (datetime('now')), показываем по Москве */
const when = (s: string | null) =>
  s
    ? new Date(s.includes("T") ? s : s.replace(" ", "T") + "Z").toLocaleString("ru-RU", {
        timeZone: "Europe/Moscow",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
const size = (b: number | null) =>
  b == null ? "" : b < 1024 * 1024 ? `${Math.round(b / 1024)} КБ` : `${(b / (1024 * 1024)).toFixed(1)} МБ`;

const field =
  "w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-[14px] text-ink outline-none focus:border-accent";

export function PortalTasks({ slug, password }: { slug: string; password: string }) {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [showDone, setShowDone] = useState(false);

  const api = (path: string, init: RequestInit = {}) =>
    fetch(`/api/portal/${slug}${path}`, {
      ...init,
      headers: { ...(init.headers || {}), "x-portal-password": password },
    });

  const load = async () => {
    const r = await api("/tasks");
    const d = await r.json();
    if (r.ok) setTasks(d.tasks);
    else setError(d.error || "Не удалось загрузить задачи");
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => void load(), []);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy("add");
    const r = await api("/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    setBusy(null);
    if (!r.ok) return setError((await r.json()).error || "Ошибка");
    setTitle("");
    load();
  };

  const toggle = async (t: Task) => {
    setBusy(`t${t.id}`);
    await api(`/tasks/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: t.status !== "done" }),
    });
    setBusy(null);
    load();
  };

  const upload = async (t: Task, files: FileList | null) => {
    if (!files?.length) return;
    setBusy(`f${t.id}`);
    setError("");
    for (const f of Array.from(files)) {
      const form = new FormData();
      form.append("file", f);
      const r = await api(`/tasks/${t.id}/files`, { method: "POST", body: form });
      if (!r.ok) setError((await r.json().catch(() => ({}))).error || `Не удалось загрузить ${f.name}`);
    }
    setBusy(null);
    load();
  };

  // Ссылкой <a> файл не открыть — пароль идёт заголовком, поэтому качаем через fetch
  const open = async (f: TaskFile) => {
    const r = await api(`/files/${f.id}`);
    if (!r.ok) return setError("Не удалось открыть файл");
    const url = URL.createObjectURL(await r.blob());
    const a = document.createElement("a");
    a.href = url;
    if (!(f.mime_type || "").match(/^(image\/|application\/pdf)/)) a.download = f.original_name || f.title;
    a.target = "_blank";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  if (!tasks) return <p className="label text-muted">{error || "Загрузка задач…"}</p>;

  const open_ = tasks.filter((t) => t.status !== "done");
  const done = tasks.filter((t) => t.status === "done");

  return (
    <div>
      <p className="label text-accent mb-3">Задачи</p>
      <form onSubmit={add} className="mb-4 flex gap-2">
        <input className={field} placeholder="Новая задача — например, отправить акт по ДШИ" value={title} onChange={(e) => setTitle(e.target.value)} />
        <button type="submit" disabled={!title.trim() || busy === "add"} className="shrink-0 rounded-xl bg-ink px-4 label text-bg disabled:opacity-50">
          {busy === "add" ? "…" : "Добавить"}
        </button>
      </form>
      {error && <p className="label mb-3 text-accent">{error}</p>}

      <div className="space-y-3">
        {open_.map((t) => (
          <TaskCard key={t.id} t={t} busy={busy} onToggle={toggle} onUpload={upload} onOpen={open} />
        ))}
        {open_.length === 0 && <p className="label text-muted">Открытых задач нет</p>}
      </div>

      {done.length > 0 && (
        <div className="mt-6">
          <button type="button" onClick={() => setShowDone(!showDone)} className="label text-muted hover:text-ink">
            {showDone ? "▾" : "▸"} Выполненные ({done.length})
          </button>
          {showDone && (
            <div className="mt-3 space-y-3">
              {done.map((t) => (
                <TaskCard key={t.id} t={t} busy={busy} onToggle={toggle} onUpload={upload} onOpen={open} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TaskCard({
  t,
  busy,
  onToggle,
  onUpload,
  onOpen,
}: {
  t: Task;
  busy: string | null;
  onToggle: (t: Task) => void;
  onUpload: (t: Task, files: FileList | null) => void;
  onOpen: (f: TaskFile) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isDone = t.status === "done";
  return (
    <div className={`rounded-2xl p-4 ${isDone ? "bg-tint" : "bg-surface"}`}>
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={isDone}
          disabled={busy === `t${t.id}`}
          onChange={() => onToggle(t)}
          className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-accent,#C05B3E)]"
        />
        <span className={`text-[15px] leading-snug ${isDone ? "text-muted line-through" : "text-ink"}`}>{t.title}</span>
      </label>
      {t.description && <p className="label mt-1 pl-8 text-ink-soft">{t.description}</p>}
      <p className="label mt-2 pl-8 text-muted">
        Поставлена {when(t.created_at)}
        {isDone && <span className="text-accent"> · выполнена {when(t.done_at)}</span>}
      </p>
      <div className="mt-2 space-y-1 pl-8">
        {t.files.map((f) => (
          <button key={f.id} type="button" onClick={() => onOpen(f)} className="label block text-left text-accent hover:underline">
            {f.mime_type === "application/pdf" ? "📄" : "📎"} {f.original_name} <span className="text-muted">{size(f.size_bytes)} · {when(f.created_at)}</span>
          </button>
        ))}
        <label className="label inline-block cursor-pointer text-muted hover:text-ink">
          {busy === `f${t.id}` ? "Загружаю…" : "+ прикрепить файл"}
          <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => { onUpload(t, e.target.files); if (inputRef.current) inputRef.current.value = ""; }} />
        </label>
      </div>
    </div>
  );
}
