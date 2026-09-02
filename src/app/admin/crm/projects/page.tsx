"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Attachments } from "@/components/crm/Attachments";
import { ProjectCosts } from "./ProjectCosts";

type ProjectStage = "idea" | "in_progress" | "proposed" | "done" | "archived";

type Project = {
  id: number;
  title: string;
  description: string | null;
  stage: ProjectStage;
  order_id: number | null;
  created_at: string;
  updated_at: string;
};

const STAGES: { key: ProjectStage; label: string }[] = [
  { key: "idea", label: "Идея" },
  { key: "in_progress", label: "В работе" },
  { key: "proposed", label: "Предложено клиенту" },
  { key: "done", label: "Готово" },
];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);

  const load = () => {
    fetch("/api/crm/projects")
      .then((r) => r.json())
      .then((d) => setProjects(d.projects || []));
  };

  useEffect(load, []);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await fetch("/api/crm/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    setTitle("");
    load();
  };

  const moveStage = async (id: number, stage: ProjectStage) => {
    setBusy(id);
    await fetch(`/api/crm/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    });
    setBusy(null);
    load();
  };

  if (!projects) return <p className="label text-muted">Загрузка…</p>;

  const archived = projects.filter((p) => p.stage === "archived");

  return (
    <div className="space-y-8">
      <div>
        <p className="label-lg text-ink">Проекты</p>
        <p className="label text-muted mt-1">
          Идеи и направления до того, как это стало сделкой с ценой и контрагентом — брифы, наброски,
          «надо подумать». Когда готово к цифрам — превращается в заказ.
        </p>
      </div>

      <form onSubmit={create} className="flex gap-2">
        <input
          className="flex-1 rounded-xl border border-line bg-bg px-4 py-2.5 text-[13px] text-ink outline-none focus:border-accent"
          placeholder="Новый проект — короткое название"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button
          type="submit"
          disabled={!title.trim()}
          className="pill label bg-accent text-bg hover:bg-accent-soft disabled:bg-line disabled:text-muted"
        >
          Добавить
        </button>
      </form>

      <div className="grid gap-4 overflow-x-auto sm:grid-cols-2 lg:grid-cols-4">
        {STAGES.map((col) => {
          const items = projects.filter((p) => p.stage === col.key);
          return (
            <div key={col.key} className="min-w-[240px]">
              <p className="section-title mb-3">
                {col.label} · {items.length}
              </p>
              <div className="space-y-2">
                {items.map((p) => (
                  <div key={p.id} className="rounded-xl bg-surface p-3">
                    <button
                      type="button"
                      onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                      className="label text-ink block text-left"
                    >
                      {p.title}
                    </button>

                    {expanded === p.id && (
                      <div className="mt-3 space-y-3">
                        {p.description && (
                          <p className="label text-ink-soft whitespace-pre-wrap">{p.description}</p>
                        )}
                        <ProjectCosts projectId={p.id} />
                        <Attachments endpoint={`/api/crm/projects/${p.id}/attachments`} />
                        <div className="flex flex-wrap gap-2 border-t border-line pt-2">
                          {STAGES.filter((s) => s.key !== p.stage).map((s) => (
                            <button
                              key={s.key}
                              type="button"
                              onClick={() => moveStage(p.id, s.key)}
                              disabled={busy === p.id}
                              className="label text-muted hover:text-ink"
                            >
                              → {s.label}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => moveStage(p.id, "archived")}
                            disabled={busy === p.id}
                            className="label text-muted hover:text-red-700"
                          >
                            → Архив
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {items.length === 0 && <p className="label text-muted">Пусто</p>}
              </div>
            </div>
          );
        })}
      </div>

      {archived.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowArchived((v) => !v)}
            className="label text-muted hover:text-ink"
          >
            {showArchived ? "Скрыть архив" : `Показать архив · ${archived.length}`}
          </button>
          {showArchived && (
            <ul className="divide-y divide-line border-t border-line mt-3">
              {archived.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-3">
                  <span className="label text-ink-soft">{p.title}</span>
                  <button
                    type="button"
                    onClick={() => moveStage(p.id, "idea")}
                    className="label text-muted hover:text-ink"
                  >
                    ← вернуть
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
