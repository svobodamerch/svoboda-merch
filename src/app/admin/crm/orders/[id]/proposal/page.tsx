"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ProposalDocument, type ProposalDocumentData } from "@/components/proposal/ProposalDocument";
import type { OrderItem, ProposalBlock, ProposalTemplate } from "@/lib/crm/db";

type Order = { id: number; title: string; description: string | null; amount_kopecks: number };
type Proposal = {
  id: number;
  order_id: number;
  token: string;
  template: ProposalTemplate;
  status: string;
  intro: string | null;
  solution: string | null;
  terms: string | null;
  valid_until: string | null;
  blocks: string | null;
};
type ProposalEvent = { id: number; event: string; created_at: string };
type Attachment = { id: number; original_name: string; mime_type: string };

const field =
  "w-full rounded-xl border border-line bg-bg px-4 py-3 text-[13px] text-ink outline-none focus:border-accent";

const statusLabel: Record<string, string> = {
  draft: "Черновик",
  sent: "Отправлено",
  viewed: "Просмотрено",
  accepted: "Принято",
  needs_revision: "Нужна правка",
};

const blockTypeLabel: Record<ProposalBlock["type"], string> = {
  cover: "Обложка",
  text: "Текст",
  image: "Картинка",
  price_table: "Таблица цен",
  terms: "Условия",
};

const uid = () => Math.random().toString(36).slice(2, 10);

function legacyToBlocks(p: Proposal, orderTitle: string): ProposalBlock[] {
  const blocks: ProposalBlock[] = [{ id: uid(), type: "cover", title: orderTitle }];
  if (p.intro) blocks.push({ id: uid(), type: "text", heading: "Задача", body: p.intro });
  if (p.solution) blocks.push({ id: uid(), type: "text", heading: "Что предлагаем", body: p.solution });
  blocks.push({ id: uid(), type: "price_table" });
  if (p.terms) blocks.push({ id: uid(), type: "terms", body: p.terms });
  return blocks;
}

export default function ProposalBuilderPage() {
  const { id: orderId } = useParams<{ id: string }>();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [events, setEvents] = useState<ProposalEvent[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [template, setTemplate] = useState<ProposalTemplate>("classic");
  const [validUntil, setValidUntil] = useState("");
  const [blocks, setBlocks] = useState<ProposalBlock[]>([]);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState<"pdf" | "docx" | null>(null);

  const loadFull = async (proposalId: number) => {
    const res = await fetch(`/api/crm/proposals/${proposalId}`);
    const d = await res.json();
    setProposal(d.proposal);
    setOrder(d.order);
    setItems(d.items);
    setEvents(d.events);
    setTemplate(d.proposal.template);
    setValidUntil(d.proposal.valid_until || "");

    let parsedBlocks: ProposalBlock[] | null = null;
    if (d.proposal.blocks) {
      try {
        const parsed = JSON.parse(d.proposal.blocks);
        if (Array.isArray(parsed) && parsed.length > 0) parsedBlocks = parsed;
      } catch {
        parsedBlocks = null;
      }
    }
    setBlocks(parsedBlocks || legacyToBlocks(d.proposal, d.order.title));

    fetch(`/api/crm/orders/${orderId}/attachments`)
      .then((r) => r.json())
      .then((ad) => setAttachments((ad.attachments || []).filter((a: Attachment) => a.mime_type.startsWith("image/"))));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const save = async () => {
    if (!proposal) return;
    setSaving(true);
    await fetch(`/api/crm/proposals/${proposal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ template, validUntil, blocks }),
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

  const download = async (kind: "pdf" | "docx") => {
    if (!proposal) return;
    setExporting(kind);
    try {
      const res = await fetch(`/api/crm/proposals/${proposal.id}/${kind}`);
      if (!res.ok) {
        alert("Не удалось собрать файл");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `КП — ${order?.title || "предложение"}.${kind}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(null);
    }
  };

  const addBlock = (type: ProposalBlock["type"]) => {
    const base = { id: uid() };
    const block: ProposalBlock =
      type === "cover"
        ? { ...base, type, title: order?.title || "" }
        : type === "text"
          ? { ...base, type, heading: "", body: "" }
          : type === "image"
            ? { ...base, type, attachmentId: attachments[0]?.id || 0 }
            : type === "terms"
              ? { ...base, type, body: "" }
              : { ...base, type: "price_table" };
    setBlocks((b) => [...b, block]);
  };

  const updateBlock = (id: string, patch: Partial<ProposalBlock>) => {
    setBlocks((b) => b.map((block) => (block.id === id ? ({ ...block, ...patch } as ProposalBlock) : block)));
  };

  const removeBlock = (id: string) => setBlocks((b) => b.filter((block) => block.id !== id));

  const moveBlock = (id: string, dir: -1 | 1) => {
    setBlocks((b) => {
      const i = b.findIndex((x) => x.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= b.length) return b;
      const next = [...b];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  if (!proposal || !order) return <p className="label text-muted">Загрузка…</p>;

  const previewData: ProposalDocumentData = {
    template,
    status: proposal.status,
    intro: null,
    solution: null,
    terms: null,
    validUntil: validUntil || null,
    orderId: order.id,
    orderTitle: order.title,
    orderDescription: order.description,
    contractorName: "Клиент",
    contractorCompany: null,
    items,
    totalKopecks: order.amount_kopecks,
    blocks,
  };

  return (
    <div className="space-y-8">
      <div>
        <Link href={`/admin/crm/orders/${orderId}`} className="label text-muted hover:text-ink">
          ← Заказ
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <p className="label-lg text-ink">Коммерческое предложение</p>
          <span className="section-title">{statusLabel[proposal.status] || proposal.status}</span>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-4">
          <div className="flex gap-2">
            <select
              className={field}
              value={template}
              onChange={(e) => setTemplate(e.target.value as ProposalTemplate)}
            >
              <option value="classic">Классическое КП</option>
              <option value="short">Короткая смета</option>
            </select>
            <input
              className={field}
              placeholder="Действительно до (дд.мм.гггг)"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            {blocks.map((block, i) => (
              <div key={block.id} className="rounded-xl bg-surface p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="label text-accent">{blockTypeLabel[block.type]}</span>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => moveBlock(block.id, -1)} disabled={i === 0} className="label text-muted hover:text-ink disabled:opacity-30">
                      ↑
                    </button>
                    <button type="button" onClick={() => moveBlock(block.id, 1)} disabled={i === blocks.length - 1} className="label text-muted hover:text-ink disabled:opacity-30">
                      ↓
                    </button>
                    <button type="button" onClick={() => removeBlock(block.id)} className="label text-muted hover:text-red-700">
                      ✕
                    </button>
                  </div>
                </div>

                {block.type === "cover" && (
                  <div className="space-y-2">
                    <input
                      className={field}
                      placeholder="Заголовок"
                      value={block.title}
                      onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                    />
                    <input
                      className={field}
                      placeholder="Подзаголовок (необязательно)"
                      value={block.subtitle || ""}
                      onChange={(e) => updateBlock(block.id, { subtitle: e.target.value })}
                    />
                  </div>
                )}

                {block.type === "text" && (
                  <div className="space-y-2">
                    <input
                      className={field}
                      placeholder="Заголовок раздела (необязательно)"
                      value={block.heading || ""}
                      onChange={(e) => updateBlock(block.id, { heading: e.target.value })}
                    />
                    <textarea
                      className={`${field} resize-none`}
                      rows={4}
                      placeholder="Текст"
                      value={block.body}
                      onChange={(e) => updateBlock(block.id, { body: e.target.value })}
                    />
                  </div>
                )}

                {block.type === "image" && (
                  <div className="space-y-2">
                    <select
                      className={field}
                      value={block.attachmentId}
                      onChange={(e) => updateBlock(block.id, { attachmentId: Number(e.target.value) })}
                    >
                      <option value={0}>Выберите картинку…</option>
                      {attachments.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.original_name}
                        </option>
                      ))}
                    </select>
                    {attachments.length === 0 && (
                      <p className="label text-muted">
                        Нет загруженных картинок — добавьте файл в блоке «Файлы» на карточке заказа
                      </p>
                    )}
                    <input
                      className={field}
                      placeholder="Подпись (необязательно)"
                      value={block.caption || ""}
                      onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
                    />
                  </div>
                )}

                {block.type === "price_table" && (
                  <p className="label text-muted">Автоматически из позиций заказа — {items.length} шт.</p>
                )}

                {block.type === "terms" && (
                  <textarea
                    className={`${field} resize-none`}
                    rows={4}
                    placeholder="Условия оплаты и сроки"
                    value={block.body}
                    onChange={(e) => updateBlock(block.id, { body: e.target.value })}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {(Object.keys(blockTypeLabel) as ProposalBlock["type"][]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => addBlock(t)}
                className="pill label bg-surface text-ink-soft hover:bg-tint"
              >
                + {blockTypeLabel[t]}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 border-t border-line pt-4">
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
            <button type="button" onClick={() => download("pdf")} disabled={exporting === "pdf"} className="pill label dashed">
              {exporting === "pdf" ? "Собираем…" : "Скачать PDF"}
            </button>
            <button type="button" onClick={() => download("docx")} disabled={exporting === "docx"} className="pill label dashed">
              {exporting === "docx" ? "Собираем…" : "Скачать Word"}
            </button>
          </div>

          {events.length > 0 && (
            <div>
              <p className="section-title mb-2 mt-6">История</p>
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
