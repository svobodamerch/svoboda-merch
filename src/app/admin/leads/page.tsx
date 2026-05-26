"use client";

import { useEffect, useMemo, useState } from "react";
import { Container } from "@/components/ui/Container";

type Lead = {
  id: string;
  name: string;
  company: string;
  phone: string;
  productType: string;
  quantity: string;
  comment: string;
  deadline: string;
  status: string;
  createdAt: string;
};

const statusMap: Record<string, string> = {
  "Новая": "Новые",
  "В работе": "В работе",
  "Выполнено": "Выполнено",
  "Архив": "Архив",
};

const statusColors: Record<string, string> = {
  "Новая": "bg-amber-100 text-amber-800 border-amber-200",
  "В работе": "bg-blue-100 text-blue-800 border-blue-200",
  "Выполнено": "bg-green-100 text-green-800 border-green-200",
  "Архив": "bg-gray-100 text-gray-600 border-gray-200",
};

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function fetchLeads() {
    setLoading(true);
    try {
      const res = await fetch("/api/notion-leads");
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
  }, []);

  const filteredLeads = useMemo(() => {
    if (filter === "all") return leads;
    return leads.filter((l) => l.status === filter);
  }, [leads, filter]);

  const stats = useMemo(() => {
    const s: Record<string, number> = { all: leads.length };
    for (const l of leads) {
      s[l.status] = (s[l.status] || 0) + 1;
    }
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
          { key: "all", label: "Все", count: stats.all || 0 },
          { key: "Новая", label: "Новые", count: stats["Новая"] || 0 },
          { key: "В работе", label: "В работе", count: stats["В работе"] || 0 },
          { key: "Выполнено", label: "Выполнено", count: stats["Выполнено"] || 0 },
          { key: "Архив", label: "Архив", count: stats["Архив"] || 0 },
        ]).map((s) => (
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
          filteredLeads.map((lead) => {
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
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusColors[lead.status] || "bg-gray-100 text-gray-600 border-gray-200"}`}
                    >
                      {statusMap[lead.status] || lead.status}
                    </span>
                    <span className="text-xs text-muted">{formatDate(lead.createdAt)}</span>
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
                        <div className="mt-0.5 text-sm font-medium text-ink">{lead.productType}</div>
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
