import Database from "better-sqlite3";
import path from "path";

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "data", "leads.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;
  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  initSchema(db);
  ensureTelegramColumn(db);
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      company TEXT,
      phone TEXT NOT NULL,
      product_type TEXT NOT NULL,
      quantity TEXT NOT NULL,
      comment TEXT,
      deadline TEXT,
      status TEXT NOT NULL DEFAULT 'new',
      source TEXT NOT NULL DEFAULT 'website',
      notes TEXT,
      email_sent INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
    CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at);
  `);
}

export type LeadStatus = "new" | "in_progress" | "done" | "archived";

export type Lead = {
  id: number;
  name: string;
  company: string | null;
  phone: string;
  telegram: string | null;
  product_type: string;
  quantity: string;
  comment: string | null;
  deadline: string | null;
  status: LeadStatus;
  source: string;
  notes: string | null;
  email_sent: number;
  created_at: string;
  updated_at: string;
  converted_contractor_id: number | null;
  converted_order_id: number | null;
};

export type LeadInput = {
  name: string;
  company?: string;
  phone: string;
  /** Контакт в Telegram: @ник или ссылка */
  telegram?: string;
  productType: string;
  quantity: string;
  comment?: string;
  deadline?: string;
  /** Откуда пришла заявка: website, birka */
  source?: string;
};

/**
 * Миграция: контакт в Telegram у заявителя.
 * ALTER TABLE падает, если колонка уже есть, — сверяемся со схемой.
 */
function ensureTelegramColumn(db: ReturnType<typeof getDb>) {
  const cols = (db.prepare("PRAGMA table_info(leads)").all() as { name: string }[]).map(
    (c) => c.name,
  );
  if (!cols.includes("telegram")) {
    db.exec("ALTER TABLE leads ADD COLUMN telegram TEXT");
  }
  // Заявка, ставшая сделкой, должна на неё ссылаться — иначе связь
  // с историей обращения теряется в момент, когда лид заводится в CRM руками
  if (!cols.includes("converted_contractor_id")) {
    db.exec("ALTER TABLE leads ADD COLUMN converted_contractor_id INTEGER");
  }
  if (!cols.includes("converted_order_id")) {
    db.exec("ALTER TABLE leads ADD COLUMN converted_order_id INTEGER");
  }
}

export function createLead(input: LeadInput): Lead {
  const db = getDb();
  ensureTelegramColumn(db);

  const stmt = db.prepare(`
    INSERT INTO leads (name, company, phone, telegram, product_type, quantity, comment, deadline, status, source)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new', ?)
    RETURNING *
  `);
  return stmt.get(
    input.name,
    input.company || null,
    input.phone,
    input.telegram || null,
    input.productType,
    input.quantity,
    input.comment || null,
    input.deadline || null,
    input.source || "website",
  ) as Lead;
}

export function getLeads(status?: LeadStatus): Lead[] {
  const db = getDb();
  if (status) {
    const stmt = db.prepare(`SELECT * FROM leads WHERE status = ? ORDER BY created_at DESC`);
    return stmt.all(status) as Lead[];
  }
  const stmt = db.prepare(`SELECT * FROM leads ORDER BY created_at DESC`);
  return stmt.all() as Lead[];
}

export function getLeadById(id: number): Lead | undefined {
  const db = getDb();
  const stmt = db.prepare(`SELECT * FROM leads WHERE id = ?`);
  return stmt.get(id) as Lead | undefined;
}

export function updateLeadStatus(id: number, status: LeadStatus): void {
  const db = getDb();
  const stmt = db.prepare(`
    UPDATE leads SET status = ?, updated_at = datetime('now') WHERE id = ?
  `);
  stmt.run(status, id);
}

export function updateLeadNotes(id: number, notes: string): void {
  const db = getDb();
  const stmt = db.prepare(`
    UPDATE leads SET notes = ?, updated_at = datetime('now') WHERE id = ?
  `);
  stmt.run(notes, id);
}

/** Заявка стала контрагентом и сделкой — запоминаем связь, чтобы не завести дважды */
export function linkLeadConversion(id: number, contractorId: number, orderId: number): void {
  const db = getDb();
  db.prepare(
    `UPDATE leads SET converted_contractor_id = ?, converted_order_id = ?, status = 'done', updated_at = datetime('now') WHERE id = ?`,
  ).run(contractorId, orderId, id);
}

export function markEmailSent(id: number): void {
  const db = getDb();
  const stmt = db.prepare(`
    UPDATE leads SET email_sent = 1, updated_at = datetime('now') WHERE id = ?
  `);
  stmt.run(id);
}

export function getLeadStats(): Record<LeadStatus | "total", number> {
  const db = getDb();
  const rows = db.prepare(`
    SELECT status, COUNT(*) as count FROM leads GROUP BY status
  `).all() as { status: LeadStatus; count: number }[];

  const stats = { new: 0, in_progress: 0, done: 0, archived: 0, total: 0 } as Record<LeadStatus | "total", number>;
  for (const row of rows) {
    stats[row.status] = row.count;
    stats.total += row.count;
  }
  return stats;
}
