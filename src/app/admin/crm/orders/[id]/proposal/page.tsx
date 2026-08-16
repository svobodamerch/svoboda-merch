"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ProposalDocument, type ProposalDocumentData } from "@/components/proposal/ProposalDocument";
import type { OrderItem, ProposalTemplate } from "@/lib/crm/db";

type Order = { id: number; title: string; description: string | null; amount_kopecks: number };
type Proposal = {
  id: number;
  token: string;
  template: ProposalTemplate;
  status: string;
  intro: string | null;
  solution: string | null;
  terms: string | null;
  valid_until: string | null;
};
type ProposalEvent = { id: number; event: string; created_at: string };

const field =
  "w-full rounded-xl border border-line bg-bg px-4 py-3 text-[13px] text-ink outline-none focus:border-accent";

const statusLabel: Record<string, string> = {
  draft: "Черновик",
  sent: "Отправлено",
  viewed: "Просмотрено",
  accepted: "Принято",
  needs_revision: "Нужна правка",
};

export default function ProposalBuilderPage() {
  const { id: orderId } = useParams<{ id: string }>();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [events, setEvents] = useState<ProposalEvent[]>([]);
  const [form, setForm] = useState({ template: "classic" as ProposalTemplate, intro: "", solution: "", terms: "", validUntil: "" });
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadFull = async (proposalId: number) => {
    const res = await fetch(`/api/crm/proposals/${proposalId}`);
    const d = await res.json();
    setProposal(d.proposal);
    setOrder(d.order);
    setItems(d.items);
    setEvents(d.events);
    setForm({
      template: d.proposal.template,
      intro: d.proposal.intro || "",
      solution: d.proposal.solution || "",
      terms: d.proposal.terms || "",
      validUntil: d.proposal.valid_until || "",
    });
  };

  useEffect(() => {
    (async () => {
      const existing = await fetch(`/api/crm/orders/${orderId}/proposal`).then((r) => r.json());
      if (existing.proposal) {
        await loadFull(existing.proposal.id);
        return;
      }
      const created = await fetch(`/api/crm/orders/${orderId}/proposal`, { method: "POST" }).then((r) => r.json());
      await loadFull(created.proposal.id);
    })();
  }, [orderId]);

  const save = async () => {
    if (!proposal) return;
    setSaving(true);
    await fetch(`/api/crm/proposals/${proposal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    await loadFull(proposal.id);
    setSaving(false);
  };

  const link = proposal && typeof window !== "undefined" ? `${window.location.origin}/kp/${proposal.token}` : "";

  const sendEmail = async () => {
    if (!proposal) return;
    setSending(true);
    const res = await fetch(`/api/crm/proposals/${proposal.id}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel: "email" }),
    });
    const d = await res.json();
    setSending(false);
    if (!res.ok) {
      alert(d.error || "Не удалось отправить");
      return;
    }
    await loadFull(proposal.id);
  };

  const copyLink = async () => {
    if (!proposal) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    await fetch(`/api/crm/proposals/${proposal.id}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel: "link" }),
    });
    await loadFull(proposal.id);
  };

  if (!proposal || !order) return <p className="label text-muted">Загрузка…</p>;

  const previewData: ProposalDocumentData = {
    template: form.template,
    status: proposal.status,
    intro: form.intro || null,
    solution: form.solution || null,
    terms: form.terms || null,
    validUntil: form.validUntil || null,
    orderTitle: order.title,
    orderDescription: order.description,
    contractorName: "Клиент",
    contractorCompany: null,
    items,
    totalKopecks: order.amount_kopecks,
  };

  return (
    <div className="space-y-8">
      <div>
        <Link href={`/admin/crm/orders/${orderId}`} className="label text-muted hover:text-ink">
          ← Заказ
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <p className="label-lg text-ink">Коммерческое предложение</p>
          <span className="label text-accent">{statusLabel[proposal.status] || proposal.status}</span>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-4">
          <select
            className={field}
            value={form.template}
            onChange={(e) => setForm((f) => ({ ...f, template: e.target.value as ProposalTemplate }))}
          >
            <option value="classic">Классическое КП</option>
            <option value="short">Короткая смета</option>
          </select>

          <textarea
            className={`${field} resize-none`}
            rows={3}
            placeholder="Что понял по задаче"
            value={form.intro}
            onChange={(e) => setForm((f) => ({ ...f, intro: e.target.value }))}
          />
          <textarea
            className={`${field} resize-none`}
            rows={3}
            placeholder="Что предлагаем"
            value={form.solution}
            onChange={(e) => setForm((f) => ({ ...f, solution: e.target.value }))}
          />
          <textarea
            className={`${field} resize-none`}
            rows={4}
            placeholder="Условия оплаты и сроки"
            value={form.terms}
            onChange={(e) => setForm((f) => ({ ...f, terms: e.target.value }))}
          />
          <input
            className={field}
            placeholder="Действительно до (дд.мм.гггг)"
            value={form.validUntil}
            onChange={(e) => setForm((f) => ({ ...f, validUntil: e.target.value }))}
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="pill label bg-accent text-bg hover:bg-accent-soft disabled:bg-line disabled:text-muted"
            >
              {saving ? "Сохраняем…" : "Сохранить"}
            </button>
            <button type="button" onClick={sendEmail} disabled={sending} className="pill label dashed">
              {sending ? "Отправляем…" : "Отправить на email"}
            </button>
            <button type="button" onClick={copyLink} className="pill label dashed">
              {copied ? "Скопировано" : "Скопировать ссылку"}
            </button>
          </div>

          {events.length > 0 && (
            <div>
              <p className="label text-accent mb-2 mt-6">История</p>
              <ul className="space-y-1">
                {events.map((e) => (
                  <li key={e.id} className="label text-muted">
                    {e.event} · {new Date(e.created_at).toLocaleString("ru-RU")}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-surface">
          <div className="scale-[0.85] origin-top">
            <ProposalDocument data={previewData} />
          </div>
        </div>
      </div>
    </div>
  );
}
