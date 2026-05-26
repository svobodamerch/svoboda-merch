"use client";

import { useEffect, useMemo, useState } from "react";
import { Container } from "@/components/ui/Container";

type Lead = {
  id: number;
  name: string;
  company: string | null;
  phone: string;
  product_type: string;
  quantity: string;
  comment: string | null;
  deadline: string | null;
  status: "new" | "in_progress" | "done" | "archived";
  source: string;
  notes: string | null;
  email_sent: number;
  created_at: string;
};

const statusLabels: Record<Lead["status"], string> = {
  new: "Новая",
  in_progress: "В работе",
  done: "Выполнено",
  archived: "Архив",
};

const statusColors: Record<Lead["status"], string> = {
  new: "bg-amber-100 text-amber-800 border-amber-200",
  in_progress: "bg-blue-100 text-blue-800 border-blue-200",
  done: "bg-green-100 text-green-800 border-green-200",
  archived: "bg-gray-100 text-gray-600 border-gray-200",
};

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Lead["status"] | "all">("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editNotes, setEditNotes] = useState<Record<number, string>>({});

  async function fetchLeads() {
    setLoading(true);
    try {
      const url = filter === "all" ? "/api/leads" : `/api/leads?status=${filter}`;
      const res = await fetch(url);
      const data = await res.json();
      setLeads(data.leads || []);
    } catch {
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLeads();
  }, [filter]);

  async function updateStatus(id: number, status: Lead["status"]) {
    try {
      await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      fetchLeads();
    } catch (err) {
      console.error(err);
    }
  }

  async function saveNotes(id: number) {
    try {
      await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: editNotes[id] || "" }),
      });
      fetchLeads();
    } catch (err) {
      console.error(err);
    }
  }

  const stats = useMemo(() => {
    const s = { new: 0, in_progress: 0, done: 0, archived: 0, total: leads.length };
    for (const l of leads) s[l.status]++;
    return s;
  }, [leads]);

  function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  return (
    <Container className="py-10 md:py-14">
      <h1 className="font-heading text-2xl font-medium tracking-tight text-ink md:text-3xl">
        Заявки (CRM)
      </h1>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {([
          { key: "all", label: "Все", count: stats.total },
          { key: "new", label: "Новые", count: stats.new },
          { key: "in_progress", label: "В работе", count: stats.in_progress },
          { key: "done", label: "Выполнено", count: stats.done },
          { key: "archived", label: "Архив", count: stats.archived },
        ] as { key: Lead["status"] | "all"; label: string; count: number }[]).map((s) => (
          <button
            key={s.key}
            onClick={() => setFilter(s.key)}
            className={`rounded-xl border px-4 py-3 text-left transition-colors ${
              filter === s.key
                ? "border-accent bg-accent/5"
                : "border-line bg-paper hover:bg-surface"
            }`}
          >
            <div className="text-xs text-muted">{s.label}</div>
            <div className="mt-1 font-heading text-xl font-medium text-ink">{s.count}</div>
          </button>
        ))}
      </div>

      {/* List */}
      <div className="mt-8 space-y-3">
        {loading ? (
          <div className="rounded-2xl border border-line bg-paper p-10 text-center text-muted">
            Загрузка…
          </div>
        ) : leads.length === 0 ? (
          <div className="rounded-2xl border border-line bg-paper p-10 text-center text-muted">
            Заявок пока нет
          </div>
        ) : (
          leads.map((lead) => {
            const isOpen = expandedId === lead.id;
            return (
              <div
                key={lead.id}
                className={`rounded-2xl border bg-paper transition-shadow ${
                  isOpen ? "border-accent/30 shadow-sm" : "border-line hover:border-line/80"
                }`}
              >
                <button
                  onClick={() => setExpandedId(isOpen ? null : lead.id)}
                  className="flex w-full flex-col gap-3 p-4 text-left sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-5"
                >
                  <div className="flex flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                    <span className="inline-flex w-fit rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider">
                      #{lead.id}
                    </span>
                    <span className="font-heading text-base font-medium text-ink">
                      {lead.name}
                    </span>
                    {lead.company && (
                      <span className="text-sm text-muted">— {lead.company}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusColors[lead.status]}`}
                    >
                      {statusLabels[lead.status]}
                    </span>
                    <span className="text-xs text-muted">{formatDate(lead.created_at)}</span>
                    <span className="text-xs text-muted" aria-hidden>
                      {isOpen ? "▲" : "▼"}
                    </span>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-line px-4 pb-5 pt-4 sm:px-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <div className="text-xs text-muted">Телефон</div>
                        <div className="mt-0.5 text-sm font-medium text-ink">{lead.phone}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted">Тип продукции</div>
                        <div className="mt-0.5 text-sm font-medium text-ink">{lead.product_type}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted">Тираж</div>
                        <div className="mt-0.5 text-sm font-medium text-ink">{lead.quantity}</div>
                      </div>
                      {lead.deadline && (
                        <div>
                          <div className="text-xs text-muted">Сроки</div>
                          <div className="mt-0.5 text-sm font-medium text-ink">{lead.deadline}</div>
                        </div>
                      )}
                    </div>

                    {lead.comment && (
                      <div className="mt-4">
                        <div className="text-xs text-muted">Комментарий</div>
                        <div className="mt-1 text-sm leading-relaxed text-ink">{lead.comment}</div>
                      </div>
                    )}

                    {/* Notes */}
                    <div className="mt-5">
                      <div className="text-xs text-muted">Внутренние заметки</div>
                      <textarea
                        className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                        rows={2}
                        value={editNotes[lead.id] ?? lead.notes ?? ""}
                        onChange={(e) => setEditNotes((p) => ({ ...p, [lead.id]: e.target.value }))}
                        placeholder="Заметки для себя…"
                      />
                      <button
                        onClick={() => saveNotes(lead.id)}
                        className="mt-2 inline-flex rounded-lg border border-line bg-paper px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-surface"
                      >
                        Сохранить заметку
                      </button>
                    </div>

                    {/* Actions */}
                    <div className="mt-5 flex flex-wrap gap-2">
                      {lead.status !== "new" && (
                        <button
                          onClick={() => updateStatus(lead.id, "new")}
                          className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-100"
                        >
                          В новые
                        </button>
                      )}
                      {lead.status !== "in_progress" && (
                        <button
                          onClick={() => updateStatus(lead.id, "in_progress")}
                          className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-800 transition-colors hover:bg-blue-100"
                        >
                          В работу
                        </button>
                      )}
                      {lead.status !== "done" && (
                        <button
                          onClick={() => updateStatus(lead.id, "done")}
                          className="rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-800 transition-colors hover:bg-green-100"
                        >
                          Выполнено
                        </button>
                      )}
                      {lead.status !== "archived" && (
                        <button
                          onClick={() => updateStatus(lead.id, "archived")}
                          className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100"
                        >
                          В архив
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </Container>
  );
}
