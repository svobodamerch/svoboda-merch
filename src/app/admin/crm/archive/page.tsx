"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ContractorPicker } from "@/components/crm/ContractorPicker";
import { ARCHIVE_KINDS, ARCHIVE_KIND_LABEL } from "@/lib/crm/archive-types";

type Item = {
  key: string;
  origin: "archive" | "order_file" | "project_file";
  id: number;
  kind: string;
  title: string;
  doc_number: string | null;
  doc_date: string | null;
  amount_kopecks: number | null;
  direction: string | null;
  status: string | null;
  contractor_id: number | null;
  contractor_name: string | null;
  legal_entity_id: number | null;
  legal_entity_name: string | null;
  order_id: number | null;
  order_title: string | null;
  project_id: number | null;
  project_title: string | null;
  summary: string | null;
  tags: string | null;
  source: string;
  original_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  file_url: string | null;
  created_at: string;
};

type Contractor = { id: number; name: string; company?: string | null };
type Option = { id: number; title: string };

const field =
  "w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-[13px] text-ink outline-none focus:border-accent";

const money = (k: number) => `${(k / 100).toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ₽`;
const date = (d: string | null) => (d ? new Date(d.slice(0, 10)).toLocaleDateString("ru-RU") : "—");
const size = (b: number | null) =>
  b == null ? "" : b < 1024 * 1024 ? `${Math.round(b / 1024)} КБ` : `${(b / (1024 * 1024)).toFixed(1)} МБ`;

const sourceLabel: Record<string, string> = {
  manual: "вручную",
  claude: "Claude",
  order: "из заказа",
  project: "из проекта",
  portal: "из портала",
};

export default function ArchivePage() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("");
  const [contractorFilter, setContractorFilter] = useState("");
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [orders, setOrders] = useState<Option[]>([]);
  const [projects, setProjects] = useState<Option[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [openKey, setOpenKey] = useState<string | null>(null);

  const load = () => {
    const sp = new URLSearchParams();
    if (q.trim()) sp.set("q", q.trim());
    if (kind) sp.set("kind", kind);
    if (contractorFilter) sp.set("contractorId", contractorFilter);
    fetch(`/api/crm/archive?${sp}`)
      .then((r) => r.json())
      .then((d) => setItems(d.items || []));
  };

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, kind, contractorFilter]);

  useEffect(() => {
    fetch("/api/crm/contractors").then((r) => r.json()).then((d) => setContractors(d.contractors || []));
    fetch("/api/crm/orders").then((r) => r.json()).then((d) => setOrders(d.orders || []));
    fetch("/api/crm/projects").then((r) => r.json()).then((d) => setProjects(d.projects || []));
  }, []);

  const remove = async (it: Item) => {
    if (!confirm(`Удалить «${it.title}» из архива? Файл тоже удалится.`)) return;
    await fetch(`/api/crm/archive/${it.id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="label-lg text-ink">Архив документов</p>
          <p className="label text-muted mt-1 max-w-2xl">
            Договоры, входящие акты и УПД, сканы, макеты, реквизиты — всё в одном месте, с привязкой к
            контрагенту, заказу или проекту. Сюда же видны файлы, прикреплённые к заказам и проектам.
            Счета и акты, выставленные из CRM, — в разделе{" "}
            <Link href="/admin/crm/documents" className="underline">
              «Документы»
            </Link>
            .
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="pill label bg-accent text-bg hover:bg-accent-soft"
        >
          {showForm ? "Скрыть" : "+ добавить документ"}
        </button>
      </div>

      {showForm && (
        <UploadForm
          contractors={contractors}
          orders={orders}
          projects={projects}
          onDone={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      <div className="grid gap-2 md:grid-cols-[1fr_220px_260px]">
        <input
          className={field}
          placeholder="Поиск: название, номер, текст, контрагент…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className={field} value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="">Все типы</option>
          {ARCHIVE_KINDS.map((k) => (
            <option key={k.key} value={k.key}>
              {k.label}
            </option>
          ))}
        </select>
        <ContractorPicker
          contractors={contractors}
          value={contractorFilter}
          onChange={setContractorFilter}
          placeholder="Все контрагенты"
        />
      </div>

      {!items && <p className="label text-muted">Загрузка…</p>}
      {items && items.length === 0 && <p className="label text-muted">Ничего не найдено</p>}

      {items && items.length > 0 && (
        <div className="divide-y divide-line rounded-2xl bg-surface">
          {items.map((it) => (
            <div key={it.key} className="px-4 py-3">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="label text-muted w-24 shrink-0">{date(it.doc_date)}</span>
                <span className="label rounded-md bg-tint px-1.5 py-0.5 text-ink-soft">
                  {ARCHIVE_KIND_LABEL[it.kind] || "Прочее"}
                </span>
                <button
                  type="button"
                  onClick={() => setOpenKey(openKey === it.key ? null : it.key)}
                  className="text-left text-[14px] text-ink hover:underline"
                >
                  {it.title}
                  {it.doc_number && <span className="text-muted"> № {it.doc_number}</span>}
                </button>
                {it.amount_kopecks != null && (
                  <span className="label text-ink">
                    {it.direction === "in" ? "← " : it.direction === "out" ? "→ " : ""}
                    {money(it.amount_kopecks)}
                  </span>
                )}
                {it.status && STATUS[it.status] && (
                  <span className={`label ${it.status === "awaiting" ? "text-accent" : "text-muted"}`}>{STATUS[it.status]}</span>
                )}
                <span className="ml-auto label text-muted">{sourceLabel[it.source] || it.source}</span>
              </div>
              <div className="label mt-1 flex flex-wrap gap-x-3 text-muted md:pl-[108px]">
                {it.contractor_id && (
                  <Link href={`/admin/crm/contractors/${it.contractor_id}`} className="hover:text-ink">
                    {it.contractor_name}
                  </Link>
                )}
                {it.legal_entity_id && (
                  <Link href={`/admin/crm/legal-entities/${it.legal_entity_id}`} className="hover:text-ink">
                    от {it.legal_entity_name}
                  </Link>
                )}
                {it.order_id && (
                  <Link href={`/admin/crm/orders/${it.order_id}`} className="hover:text-ink">
                    заказ: {it.order_title}
                  </Link>
                )}
                {it.project_id && (
                  <Link href={`/admin/crm/projects/${it.project_id}`} className="hover:text-ink">
                    проект: {it.project_title}
                  </Link>
                )}
                {it.file_url && (
                  <a href={it.file_url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                    {it.mime_type === "application/pdf" ? "📄" : "📎"} {it.original_name} {size(it.size_bytes)}
                  </a>
                )}
              </div>
              {it.summary && <p className="label mt-1 text-ink-soft md:pl-[108px]">{it.summary}</p>}
              {openKey === it.key && it.origin === "archive" && (
                <EditForm
                  item={it}
                  contractors={contractors}
                  orders={orders}
                  projects={projects}
                  onSaved={() => {
                    setOpenKey(null);
                    load();
                  }}
                  onDelete={() => remove(it)}
                />
              )}
              {openKey === it.key && it.origin !== "archive" && (
                <p className="label mt-2 text-muted md:pl-[108px]">
                  Это файл из карточки {it.origin === "order_file" ? "заказа" : "проекта"} — редактируется там.
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const STATUS: Record<string, string> = { awaiting: "ждёт оплаты", paid: "оплачен", signed: "подписан", cancelled: "отменён" };

type Meta = {
  legalEntityId: string;
  status: string;
  title: string;
  kind: string;
  docNumber: string;
  docDate: string;
  amount: string;
  direction: string;
  contractorId: string;
  orderId: string;
  projectId: string;
  summary: string;
  tags: string;
};

const emptyMeta: Meta = {
  legalEntityId: "",
  status: "",
  title: "",
  kind: "other",
  docNumber: "",
  docDate: "",
  amount: "",
  direction: "",
  contractorId: "",
  orderId: "",
  projectId: "",
  summary: "",
  tags: "",
};

type Entity = { id: number; short_name: string };
let entitiesCache: Entity[] | null = null;
function useEntities(): Entity[] {
  const [list, setList] = useState<Entity[]>(entitiesCache || []);
  useEffect(() => {
    if (entitiesCache) return;
    fetch("/api/crm/legal-entities")
      .then((r) => r.json())
      .then((d) => {
        entitiesCache = d.legalEntities || d.entities || [];
        setList(entitiesCache!);
      });
  }, []);
  return list;
}

function MetaFields({
  meta,
  set,
  contractors,
  orders,
  projects,
}: {
  meta: Meta;
  set: (patch: Partial<Meta>) => void;
  contractors: Contractor[];
  orders: Option[];
  projects: Option[];
}) {
  const entities = useEntities();
  return (
    <div className="grid gap-2 md:grid-cols-2">
      <input className={field} placeholder="Название (по умолчанию — имя файла)" value={meta.title} onChange={(e) => set({ title: e.target.value })} />
      <select className={field} value={meta.kind} onChange={(e) => set({ kind: e.target.value })}>
        {ARCHIVE_KINDS.map((k) => (
          <option key={k.key} value={k.key}>
            {k.label}
          </option>
        ))}
      </select>
      <input className={field} placeholder="Номер документа" value={meta.docNumber} onChange={(e) => set({ docNumber: e.target.value })} />
      <input className={field} type="date" value={meta.docDate} onChange={(e) => set({ docDate: e.target.value })} />
      <input className={field} placeholder="Сумма, ₽" inputMode="decimal" value={meta.amount} onChange={(e) => set({ amount: e.target.value })} />
      <select className={field} value={meta.direction} onChange={(e) => set({ direction: e.target.value })}>
        <option value="">Направление — не важно</option>
        <option value="in">Входящий (нам)</option>
        <option value="out">Исходящий (от нас)</option>
      </select>
      <ContractorPicker contractors={contractors} value={meta.contractorId} onChange={(v) => set({ contractorId: v })} placeholder="Контрагент — не указан" />
      <select className={field} value={meta.legalEntityId} onChange={(e) => set({ legalEntityId: e.target.value })}>
        <option value="">Наше юрлицо — не указано</option>
        {entities.map((e) => (
          <option key={e.id} value={e.id}>
            {e.short_name}
          </option>
        ))}
      </select>
      <select className={field} value={meta.orderId} onChange={(e) => set({ orderId: e.target.value })}>
        <option value="">Заказ — не указан</option>
        {orders.map((o) => (
          <option key={o.id} value={o.id}>
            {o.title}
          </option>
        ))}
      </select>
      <select className={field} value={meta.projectId} onChange={(e) => set({ projectId: e.target.value })}>
        <option value="">Проект — не указан</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.title}
          </option>
        ))}
      </select>
      <select className={field} value={meta.status} onChange={(e) => set({ status: e.target.value })}>
        <option value="">Статус — не важен</option>
        {Object.entries(STATUS).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>
      <input className={field} placeholder="Теги через запятую" value={meta.tags} onChange={(e) => set({ tags: e.target.value })} />
      <textarea
        className={`${field} md:col-span-2`}
        rows={2}
        placeholder="Кратко: о чём документ, сроки, условия"
        value={meta.summary}
        onChange={(e) => set({ summary: e.target.value })}
      />
    </div>
  );
}

function UploadForm({
  contractors,
  orders,
  projects,
  onDone,
}: {
  contractors: Contractor[];
  orders: Option[];
  projects: Option[];
  onDone: () => void;
}) {
  const [meta, setMeta] = useState<Meta>(emptyMeta);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const files = Array.from(fileRef.current?.files || []);
    if (!files.length && !meta.title.trim()) {
      setError("Выберите файл или укажите название");
      return;
    }
    setBusy(true);
    setError(null);
    const send = async (file?: File) => {
      const form = new FormData();
      if (file) form.append("file", file);
      for (const [k, v] of Object.entries(meta)) if (v) form.append(k, v);
      // несколько файлов — у каждого своё имя вместо общего названия
      if (file && files.length > 1) form.delete("title");
      const r = await fetch("/api/crm/archive", { method: "POST", body: form });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.error || `Не удалось сохранить ${file?.name || ""}`);
      }
    };
    try {
      if (files.length) for (const f of files) await send(f);
      else await send();
      setMeta(emptyMeta);
      if (fileRef.current) fileRef.current.value = "";
      onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl bg-surface p-4">
      <input ref={fileRef} type="file" multiple className="label block text-ink-soft" />
      <MetaFields meta={meta} set={(p) => setMeta({ ...meta, ...p })} contractors={contractors} orders={orders} projects={projects} />
      {error && <p className="label rounded-xl bg-red-50 px-4 py-3 text-red-700">{error}</p>}
      <button type="submit" disabled={busy} className="pill label bg-accent text-bg hover:bg-accent-soft disabled:bg-line">
        {busy ? "Сохраняю…" : "Сохранить в архив"}
      </button>
    </form>
  );
}

function EditForm({
  item,
  contractors,
  orders,
  projects,
  onSaved,
  onDelete,
}: {
  item: Item;
  contractors: Contractor[];
  orders: Option[];
  projects: Option[];
  onSaved: () => void;
  onDelete: () => void;
}) {
  const [meta, setMeta] = useState<Meta>({
    legalEntityId: item.legal_entity_id ? String(item.legal_entity_id) : "",
    status: item.status || "",
    title: item.title,
    kind: item.kind,
    docNumber: item.doc_number || "",
    docDate: item.doc_date?.slice(0, 10) || "",
    amount: item.amount_kopecks != null ? String(item.amount_kopecks / 100) : "",
    direction: item.direction || "",
    contractorId: item.contractor_id ? String(item.contractor_id) : "",
    orderId: item.order_id ? String(item.order_id) : "",
    projectId: item.project_id ? String(item.project_id) : "",
    summary: item.summary || "",
    tags: item.tags || "",
  });
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    await fetch(`/api/crm/archive/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(meta),
    });
    setBusy(false);
    onSaved();
  };

  return (
    <div className="mt-3 space-y-3 rounded-xl bg-bg p-3 md:ml-[108px]">
      <MetaFields meta={meta} set={(p) => setMeta({ ...meta, ...p })} contractors={contractors} orders={orders} projects={projects} />
      <div className="flex gap-2">
        <button type="button" onClick={save} disabled={busy} className="pill label bg-accent text-bg hover:bg-accent-soft">
          {busy ? "…" : "Сохранить"}
        </button>
        <button type="button" onClick={onDelete} className="pill label text-muted hover:text-red-700">
          Удалить
        </button>
      </div>
    </div>
  );
}
