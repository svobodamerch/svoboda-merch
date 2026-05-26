import Database from "better-sqlite3";
import path from "path";

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "data", "leads.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;
  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  initSchema(db);
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
};

export type LeadInput = {
  name: string;
  company?: string;
  phone: string;
  productType: string;
  quantity: string;
  comment?: string;
  deadline?: string;
};

export function createLead(input: LeadInput): Lead {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO leads (name, company, phone, product_type, quantity, comment, deadline, status, source)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'new', 'website')
    RETURNING *
  `);
  return stmt.get(
    input.name,
    input.company || null,
    input.phone,
    input.productType,
    input.quantity,
    input.comment || null,
    input.deadline || null,
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
