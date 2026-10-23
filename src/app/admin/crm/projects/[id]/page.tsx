"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Attachments } from "@/components/crm/Attachments";
import { ProjectCosts } from "../ProjectCosts";
import { TaskRow, type Task } from "../../tasks/TaskRow";

/**
 * Страница проекта. Главное здесь — задачи: проект вроде «запуск бренда»
 * живёт списком дел со сроками, а не деньгами, поэтому список и быстрое
 * добавление стоят первыми, затраты и файлы — ниже.
 */

type ProjectStage = "idea" | "in_progress" | "proposed" | "done" | "archived";

type Project = {
  id: number;
  title: string;
  description: string | null;
  stage: ProjectStage;
  created_at: string;
  updated_at: string;
};

type Option = { id: number; title?: string; name?: string };

const STAGES: { key: ProjectStage; label: string }[] = [
  { key: "idea", label: "Идея" },
  { key: "in_progress", label: "В работе" },
  { key: "proposed", label: "Предложено клиенту" },
  { key: "done", label: "Готово" },
  { key: "archived", label: "Архив" },
];

const field =
  "w-full rounded-xl border border-line bg-bg px-4 py-3 text-[13px] text-ink outline-none focus:border-accent";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [contractors, setContractors] = useState<Option[]>([]);
  const [orders, setOrders] = useState<Option[]>([]);
  const [form, setForm] = useState({ title: "", dueAt: "", description: "" });
  const [editingDescription, setEditingDescription] = useState(false);
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [showDone, setShowDone] = useState(false);

  const loadTasks = () => {
    fetch(`/api/crm/tasks?projectId=${id}`)
      .then((r) => r.json())
      .then((d) => setTasks(d.tasks || []));
  };

  const load = () => {
    fetch(`/api/crm/projects/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return setNotFound(true);
        setProject(d.project);
        setDescription(d.project.description || "");
      });
    loadTasks();
  };

  useEffect(() => {
    load();
    fetch("/api/crm/contractors")
      .then((r) => r.json())
      .then((d) => setContractors(d.contractors || []));
    fetch("/api/crm/orders")
      .then((r) => r.json())
      .then((d) => setOrders(d.orders || []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const addTask = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    await fetch("/api/crm/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, projectId: Number(id) }),
    });
    // Дату оставляем: задачи на один день часто идут подряд
    setForm((f) => ({ title: "", dueAt: f.dueAt, description: "" }));
    setSaving(false);
    loadTasks();
  };

  const patchProject = async (patch: { stage?: ProjectStage; description?: string }) => {
    setSaving(true);
    await fetch(`/api/crm/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setSaving(false);
    setEditingDescription(false);
    load();
  };

  if (notFound) return <p className="label text-muted">Проект не найден</p>;
  if (!project) return <p className="label text-muted">Загрузка…</p>;

  const open = tasks.filter((t) => t.status === "open");
  const done = tasks.filter((t) => t.status === "done");
  const todayMsk = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const overdue = open.filter((t) => t.due_at && t.due_at.slice(0, 10) < todayMsk).length;

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin/crm/projects" className="label text-muted hover:text-ink">
          ← Проекты
        </Link>
        <p className="label-lg text-ink mt-2">{project.title}</p>
        <p className="label text-muted mt-1">
          Задач: {open.length} открыто · {done.length} выполнено
          {overdue > 0 && <span className="text-red-700"> · просрочено {overdue}</span>}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {STAGES.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => s.key !== project.stage && patchProject({ stage: s.key })}
              disabled={saving}
              className={`rounded-md px-2 py-0.5 text-[11px] ${
                s.key === project.stage ? "bg-ink text-bg" : "bg-surface text-muted hover:text-ink"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        {editingDescription ? (
          <div className="space-y-2">
            <textarea
              className={`${field} min-h-[120px]`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="О чём проект, цель, ссылки"
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => patchProject({ description })}
                disabled={saving}
                className="pill label bg-accent text-bg hover:bg-accent-soft disabled:bg-line disabled:text-muted"
              >
                Сохранить
              </button>
              <button
                type="button"
                onClick={() => setEditingDescription(false)}
                className="label text-muted hover:text-ink"
              >
                Отмена
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setEditingDescription(true)} className="block text-left">
            {project.description ? (
              <p className="label text-ink-soft whitespace-pre-wrap">{project.description}</p>
            ) : (
              <p className="label text-muted">+ описание</p>
            )}
          </button>
        )}
      </div>

      <form onSubmit={addTask} className="grid gap-3 rounded-2xl bg-surface p-6 sm:grid-cols-[1fr_170px]">
        <input
          className={field}
          placeholder="Новая задача в проекте *"
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
          className={`${field} sm:col-span-2`}
          placeholder="Заметка"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
        <button
          type="submit"
          disabled={saving || !form.title.trim()}
          className="pill label bg-accent text-bg hover:bg-accent-soft disabled:bg-line disabled:text-muted sm:col-span-2"
        >
          {saving ? "Сохраняем…" : "Добавить задачу"}
        </button>
      </form>

      <div>
        <p className="section-title mb-4">Открытые задачи · {open.length}</p>
        <ul className="divide-y divide-line border-t border-line">
          {open.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              contractors={contractors}
              orders={orders}
              hideProject
              onChanged={loadTasks}
            />
          ))}
        </ul>
        {open.length === 0 && <p className="label text-muted">Открытых задач нет</p>}
      </div>

      {done.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowDone((v) => !v)}
            className="label text-muted hover:text-ink"
          >
            {showDone ? "Скрыть выполненные" : `Выполнено · ${done.length}`}
          </button>
          {showDone && (
            <ul className="divide-y divide-line border-t border-line mt-3">
              {done.map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  contractors={contractors}
                  orders={orders}
                  hideProject
                  onChanged={loadTasks}
                />
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="space-y-4 border-t border-line pt-6">
        <ProjectCosts projectId={project.id} />
        <Attachments endpoint={`/api/crm/projects/${project.id}/attachments`} />
      </div>
    </div>
  );
}
