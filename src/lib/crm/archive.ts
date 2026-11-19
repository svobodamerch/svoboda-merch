import { mkdir, writeFile, readFile, unlink } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { getCrmDb, logActivity } from "./db";
import { UPLOAD_ROOT } from "./attachments";
import { ARCHIVE_KINDS, type ArchiveKind } from "./archive-types";

export { ARCHIVE_KINDS, type ArchiveKind };

/**
 * Архив документов: одна таблица для всего, что не выставлено самой CRM.
 * В выдачу списка подмешиваются и старые файлы заказов/проектов
 * (order_attachments, project_attachments) — их не переносим, чтобы не
 * ломать карточки заказов, но искать удобно в одном месте.
 */

export type ArchiveDoc = {
  id: number;
  kind: ArchiveKind;
  title: string;
  doc_number: string | null;
  doc_date: string | null;
  amount_kopecks: number | null;
  direction: "in" | "out" | null;
  status: string | null;
  contractor_id: number | null;
  order_id: number | null;
  project_id: number | null;
  task_id: number | null;
  legal_entity_id: number | null;
  summary: string | null;
  content_text: string | null;
  tags: string | null;
  source: string;
  filename: string | null;
  original_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  sha256: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ArchiveListItem = {
  /** archive:12, order-file:5, project-file:3 — источники в одной ленте */
  key: string;
  origin: "archive" | "order_file" | "project_file";
  id: number;
  kind: ArchiveKind;
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

export type ArchiveFilters = {
  q?: string;
  kind?: string;
  contractorId?: number;
  orderId?: number;
  projectId?: number;
  legalEntityId?: number;
  from?: string;
  to?: string;
  limit?: number;
};

const KIND_SET = new Set(ARCHIVE_KINDS.map((k) => k.key));
export const normalizeKind = (k: unknown): ArchiveKind =>
  typeof k === "string" && KIND_SET.has(k as ArchiveKind) ? (k as ArchiveKind) : "other";

// ---------- файлы на диске ----------

/** data/uploads/archive/2026-11/<uuid>.pdf — в БД хранится путь от корня uploads */
export async function storeArchiveFile(originalName: string, buffer: Buffer): Promise<{ filename: string; sha256: string }> {
  const month = new Date().toISOString().slice(0, 7);
  const rel = path.join("archive", month);
  await mkdir(path.join(UPLOAD_ROOT, rel), { recursive: true });
  const ext = path.extname(originalName).slice(0, 10).toLowerCase();
  const filename = path.join(rel, `${crypto.randomUUID()}${ext}`);
  await writeFile(path.join(UPLOAD_ROOT, filename), buffer);
  const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");
  return { filename, sha256 };
}

function safePath(filename: string): string {
  const full = path.resolve(UPLOAD_ROOT, filename);
  if (!full.startsWith(path.resolve(UPLOAD_ROOT) + path.sep)) throw new Error("bad path");
  return full;
}

export const readArchiveFile = (filename: string) => readFile(safePath(filename));
export const removeArchiveFile = (filename: string) => unlink(safePath(filename)).catch(() => {});

export function sha256Of(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

// ---------- записи ----------

export type ArchiveInput = {
  kind?: ArchiveKind;
  title: string;
  doc_number?: string | null;
  doc_date?: string | null;
  amount_kopecks?: number | null;
  direction?: "in" | "out" | null;
  status?: string | null;
  contractor_id?: number | null;
  order_id?: number | null;
  project_id?: number | null;
  task_id?: number | null;
  legal_entity_id?: number | null;
  summary?: string | null;
  content_text?: string | null;
  tags?: string | null;
  source?: string;
  filename?: string | null;
  original_name?: string | null;
  mime_type?: string | null;
  size_bytes?: number | null;
  sha256?: string | null;
};

export function findArchiveBySha(sha256: string): ArchiveDoc | undefined {
  return getCrmDb().prepare(`SELECT * FROM archive_documents WHERE sha256 = ?`).get(sha256) as ArchiveDoc | undefined;
}

export function getArchiveDoc(id: number): ArchiveDoc | undefined {
  return getCrmDb().prepare(`SELECT * FROM archive_documents WHERE id = ?`).get(id) as ArchiveDoc | undefined;
}

export function createArchiveDoc(input: ArchiveInput, actor?: string): ArchiveDoc {
  const db = getCrmDb();
  const doc = db
    .prepare(
      `INSERT INTO archive_documents
        (kind, title, doc_number, doc_date, amount_kopecks, direction, status,
         contractor_id, order_id, project_id, task_id, legal_entity_id, summary, content_text, tags, source,
         filename, original_name, mime_type, size_bytes, sha256, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING *`,
    )
    .get(
      input.kind || "other",
      input.title,
      input.doc_number ?? null,
      input.doc_date ?? null,
      input.amount_kopecks ?? null,
      input.direction ?? null,
      input.status ?? null,
      input.contractor_id ?? null,
      input.order_id ?? null,
      input.project_id ?? null,
      input.task_id ?? null,
      input.legal_entity_id ?? null,
      input.summary ?? null,
      input.content_text ?? null,
      input.tags ?? null,
      input.source || "manual",
      input.filename ?? null,
      input.original_name ?? null,
      input.mime_type ?? null,
      input.size_bytes ?? null,
      input.sha256 ?? null,
      actor || null,
    ) as ArchiveDoc;

  const msg = `В архив добавлен документ «${doc.title}»`;
  if (doc.contractor_id) logActivity("contractor", doc.contractor_id, "archive_added", msg, actor);
  if (doc.order_id) logActivity("order", doc.order_id, "archive_added", msg, actor);
  if (doc.project_id) logActivity("project", doc.project_id, "archive_added", msg, actor);
  return doc;
}

const EDITABLE: (keyof ArchiveInput)[] = [
  "kind", "title", "doc_number", "doc_date", "amount_kopecks", "direction", "status",
  "contractor_id", "order_id", "project_id", "legal_entity_id", "summary", "content_text", "tags",
];

export function updateArchiveDoc(id: number, patch: Partial<ArchiveInput>): ArchiveDoc | undefined {
  const db = getCrmDb();
  const sets: string[] = [];
  const values: unknown[] = [];
  for (const key of EDITABLE) {
    if (key in patch) {
      sets.push(`${key} = ?`);
      values.push((patch as Record<string, unknown>)[key] ?? null);
    }
  }
  if (sets.length) {
    db.prepare(`UPDATE archive_documents SET ${sets.join(", ")}, updated_at = datetime('now') WHERE id = ?`).run(
      ...values,
      id,
    );
  }
  return getArchiveDoc(id);
}

export function deleteArchiveDoc(id: number): void {
  getCrmDb().prepare(`DELETE FROM archive_documents WHERE id = ?`).run(id);
}

// ---------- список и поиск ----------

/**
 * Поиск — в JS, а не через LIKE: SQLite сравнивает без учёта регистра
 * только латиницу, «договор» и «Договор» для него разные строки.
 * Документов сотни, не миллионы — фильтр по памяти не заметен.
 */
export function listArchive(f: ArchiveFilters = {}): ArchiveListItem[] {
  const db = getCrmDb();

  const archive = db
    .prepare(
      `SELECT a.*, c.name AS contractor_name, v.short_name AS legal_entity_name, o.title AS order_title, p.title AS project_title
       FROM archive_documents a
       LEFT JOIN contractors c ON c.id = a.contractor_id
       LEFT JOIN legal_entities v ON v.id = a.legal_entity_id
       LEFT JOIN orders o ON o.id = a.order_id
       LEFT JOIN projects p ON p.id = a.project_id`,
    )
    .all() as (ArchiveDoc & {
    contractor_name: string | null; legal_entity_name: string | null; order_title: string | null; project_title: string | null;
  })[];

  const orderFiles = db
    .prepare(
      `SELECT f.*, o.title AS order_title, o.contractor_id, c.name AS contractor_name
       FROM order_attachments f
       JOIN orders o ON o.id = f.order_id
       LEFT JOIN contractors c ON c.id = o.contractor_id`,
    )
    .all() as {
    id: number; order_id: number; original_name: string; mime_type: string; size_bytes: number;
    created_at: string; created_by: string | null; order_title: string; contractor_id: number | null; contractor_name: string | null;
  }[];

  const projectFiles = db
    .prepare(
      `SELECT f.*, p.title AS project_title
       FROM project_attachments f
       JOIN projects p ON p.id = f.project_id`,
    )
    .all() as {
    id: number; project_id: number; original_name: string; mime_type: string; size_bytes: number;
    created_at: string; created_by: string | null; project_title: string;
  }[];

  const items: (ArchiveListItem & { _haystack: string })[] = [];

  for (const a of archive) {
    items.push({
      key: `archive:${a.id}`,
      origin: "archive",
      id: a.id,
      kind: normalizeKind(a.kind),
      title: a.title,
      doc_number: a.doc_number,
      doc_date: a.doc_date,
      amount_kopecks: a.amount_kopecks,
      direction: a.direction,
      status: a.status,
      contractor_id: a.contractor_id,
      contractor_name: a.contractor_name,
      legal_entity_id: a.legal_entity_id,
      legal_entity_name: a.legal_entity_name,
      order_id: a.order_id,
      order_title: a.order_title,
      project_id: a.project_id,
      project_title: a.project_title,
      summary: a.summary,
      tags: a.tags,
      source: a.source,
      original_name: a.original_name,
      mime_type: a.mime_type,
      size_bytes: a.size_bytes,
      file_url: a.filename ? `/api/crm/archive/${a.id}/file` : null,
      created_at: a.created_at,
      _haystack: [a.title, a.doc_number, a.summary, a.content_text, a.tags, a.original_name, a.contractor_name, a.legal_entity_name, a.order_title, a.project_title]
        .filter(Boolean)
        .join(" \n ")
        .toLowerCase(),
    });
  }

  for (const f of orderFiles) {
    items.push({
      key: `order-file:${f.id}`,
      origin: "order_file",
      id: f.id,
      kind: "other",
      title: f.original_name,
      doc_number: null,
      doc_date: f.created_at.slice(0, 10),
      amount_kopecks: null,
      direction: null,
      status: null,
      contractor_id: f.contractor_id,
      contractor_name: f.contractor_name,
      legal_entity_id: null,
      legal_entity_name: null,
      order_id: f.order_id,
      order_title: f.order_title,
      project_id: null,
      project_title: null,
      summary: null,
      tags: null,
      source: "order",
      original_name: f.original_name,
      mime_type: f.mime_type,
      size_bytes: f.size_bytes,
      file_url: `/api/crm/orders/${f.order_id}/attachments/${f.id}`,
      created_at: f.created_at,
      _haystack: [f.original_name, f.order_title, f.contractor_name].filter(Boolean).join(" \n ").toLowerCase(),
    });
  }

  for (const f of projectFiles) {
    items.push({
      key: `project-file:${f.id}`,
      origin: "project_file",
      id: f.id,
      kind: "other",
      title: f.original_name,
      doc_number: null,
      doc_date: f.created_at.slice(0, 10),
      amount_kopecks: null,
      direction: null,
      status: null,
      contractor_id: null,
      contractor_name: null,
      legal_entity_id: null,
      legal_entity_name: null,
      order_id: null,
      order_title: null,
      project_id: f.project_id,
      project_title: f.project_title,
      summary: null,
      tags: null,
      source: "project",
      original_name: f.original_name,
      mime_type: f.mime_type,
      size_bytes: f.size_bytes,
      file_url: `/api/crm/projects/${f.project_id}/attachments/${f.id}`,
      created_at: f.created_at,
      _haystack: [f.original_name, f.project_title].filter(Boolean).join(" \n ").toLowerCase(),
    });
  }

  const words = (f.q || "").toLowerCase().split(/\s+/).filter(Boolean);
  const result = items.filter((it) => {
    if (f.kind && it.kind !== f.kind) return false;
    if (f.contractorId && it.contractor_id !== f.contractorId) return false;
    if (f.legalEntityId && it.legal_entity_id !== f.legalEntityId) return false;
    if (f.orderId && it.order_id !== f.orderId) return false;
    if (f.projectId && it.project_id !== f.projectId) return false;
    const date = it.doc_date || it.created_at.slice(0, 10);
    if (f.from && date < f.from) return false;
    if (f.to && date > f.to) return false;
    return words.every((w) => it._haystack.includes(w));
  });

  result.sort((a, b) => (b.doc_date || b.created_at).localeCompare(a.doc_date || a.created_at) || b.created_at.localeCompare(a.created_at));

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return result.slice(0, f.limit || 500).map(({ _haystack, ...rest }) => rest);
}

// ---------- подбор привязки (для ассистента) ----------

export type LookupResult = {
  contractors: { id: number; name: string; company: string | null; inn: string | null }[];
  orders: { id: number; title: string; status: string; contractor_id: number; contractor_name: string | null; amount_kopecks: number }[];
  projects: { id: number; title: string; stage: string }[];
};

/** Кандидаты по имени, компании, ИНН — чтобы ассистент не заводил дублей контрагентов */
export function lookupEntities(q: string): LookupResult {
  const db = getCrmDb();
  const needle = q.trim().toLowerCase();
  if (!needle) return { contractors: [], orders: [], projects: [] };
  const words = needle.split(/\s+/);
  const match = (...parts: (string | null)[]) => {
    const hay = parts.filter(Boolean).join(" ").toLowerCase();
    return words.every((w) => hay.includes(w));
  };

  const contractors = (db.prepare(`SELECT id, name, company, inn FROM contractors`).all() as LookupResult["contractors"])
    .filter((c) => match(c.name, c.company, c.inn))
    .slice(0, 20);

  const orders = (
    db
      .prepare(
        `SELECT o.id, o.title, o.status, o.contractor_id, o.amount_kopecks, c.name AS contractor_name
         FROM orders o LEFT JOIN contractors c ON c.id = o.contractor_id`,
      )
      .all() as LookupResult["orders"]
  )
    .filter((o) => match(o.title, o.contractor_name))
    .slice(0, 20);

  const projects = (db.prepare(`SELECT id, title, stage FROM projects`).all() as LookupResult["projects"])
    .filter((p) => match(p.title))
    .slice(0, 20);

  return { contractors, orders, projects };
}
