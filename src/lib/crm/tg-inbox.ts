import { createTask, getCrmDb } from "./db";
import { createCommitment } from "./sales";

export type TgInboxKind = "commitment_we" | "commitment_they" | "task" | "request";

export type TgInboxItem = {
  id: number;
  kind: TgInboxKind;
  title: string;
  person_name: string | null;
  person_username: string | null;
  chat_title: string | null;
  deadline: string | null;
  quote: string | null;
  amount_kopecks: number | null;
  order_id: number | null;
  tg_date: string | null;
  status: "pending" | "accepted" | "dismissed";
  created_at: string;
};

export type IngestItem = {
  atomId: number;
  kind: TgInboxKind;
  title: string;
  personName?: string;
  personUsername?: string;
  chatTitle?: string;
  deadline?: string;
  quote?: string;
  amount?: number;
  orderId?: number;
  date?: string;
};

const KINDS: TgInboxKind[] = ["commitment_we", "commitment_they", "task", "request"];

export function ingestTgInbox(items: IngestItem[]): number {
  const db = getCrmDb();
  const orderExists = db.prepare("SELECT 1 FROM orders WHERE id = ?");
  const insert = db.prepare(
    `INSERT OR IGNORE INTO tg_inbox
       (source_atom_id, kind, title, person_name, person_username, chat_title, deadline, quote, amount_kopecks, order_id, tg_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  let added = 0;
  db.transaction(() => {
    for (const i of items) {
      const title = String(i.title || "").trim().slice(0, 500);
      if (!title || !KINDS.includes(i.kind) || !Number.isFinite(i.atomId)) continue;
      const orderId = i.orderId && orderExists.get(i.orderId) ? i.orderId : null;
      const amount = Number.isFinite(i.amount) && i.amount ? Math.round(Number(i.amount) * 100) : null;
      const res = insert.run(
        i.atomId, i.kind, title,
        i.personName?.slice(0, 200) || null, i.personUsername?.slice(0, 100) || null,
        i.chatTitle?.slice(0, 200) || null, i.deadline?.slice(0, 64) || null,
        i.quote?.slice(0, 1000) || null, amount, orderId, i.date?.slice(0, 32) || null,
      );
      added += res.changes;
    }
  })();
  return added;
}

export function getTgInbox(status: string = "pending"): TgInboxItem[] {
  return getCrmDb()
    .prepare(`SELECT * FROM tg_inbox WHERE status = ? ORDER BY COALESCE(tg_date, created_at) DESC LIMIT 300`)
    .all(status) as TgInboxItem[];
}

function findContractorId(name: string | null, username: string | null): number | undefined {
  const db = getCrmDb();
  if (username) {
    const r = db
      .prepare(`SELECT id FROM contractors WHERE lower(replace(telegram, '@', '')) = lower(?) LIMIT 1`)
      .get(username.replace(/^@/, "")) as { id: number } | undefined;
    if (r) return r.id;
  }
  if (name) {
    const r = db.prepare(`SELECT id FROM contractors WHERE lower(name) = lower(?) LIMIT 1`).get(name) as
      | { id: number }
      | undefined;
    if (r) return r.id;
  }
  return undefined;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}/;

export function acceptTgInbox(id: number, actor: string): { type: string; id: number } | null {
  const db = getCrmDb();
  const row = db.prepare(`SELECT * FROM tg_inbox WHERE id = ? AND status = 'pending'`).get(id) as TgInboxItem | undefined;
  if (!row) return null;

  const contractorId = findContractorId(row.person_name, row.person_username);
  const dueIso = row.deadline && ISO_DATE.test(row.deadline) ? row.deadline.slice(0, 10) : undefined;
  const note = [
    `Из Telegram: ${row.person_name || "?"}${row.chat_title ? ` · ${row.chat_title}` : ""}`,
    row.deadline && !dueIso ? `Срок: ${row.deadline}` : "",
    row.quote ? `«${row.quote}»` : "",
  ]
    .filter(Boolean)
    .join("\n");

  let result: { type: string; id: number };
  if (row.kind === "commitment_we" || row.kind === "commitment_they") {
    const c = createCommitment(
      {
        title: row.title,
        side: row.kind === "commitment_we" ? "we" : "they",
        due_date: dueIso,
        contractor_id: contractorId,
        order_id: row.order_id || undefined,
        note,
      },
      actor,
    );
    result = { type: "commitment", id: c.id };
  } else {
    const task = createTask(
      {
        title: row.kind === "request" ? `Запрос: ${row.title}` : row.title,
        description: note,
        due_at: dueIso,
        contractor_id: contractorId,
        order_id: row.order_id || undefined,
        amount_kopecks: row.amount_kopecks ?? undefined,
        source: "telegram",
      },
      actor,
    );
    result = { type: "task", id: task.id };
  }
  db.prepare(
    `UPDATE tg_inbox SET status = 'accepted', result_type = ?, result_id = ?, handled_at = datetime('now') WHERE id = ?`,
  ).run(result.type, result.id, id);
  return result;
}

export function dismissTgInbox(id: number): void {
  getCrmDb()
    .prepare(`UPDATE tg_inbox SET status = 'dismissed', handled_at = datetime('now') WHERE id = ? AND status = 'pending'`)
    .run(id);
}
