import Database from "better-sqlite3";
import path from "path";

/**
 * CRM живёт в той же SQLite-базе, что и заявки (leads) — файл уже общий
 * для сайта (DB_PATH) и бота (LEADS_DB на проде указывает туда же).
 */
const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "data", "leads.db");

let db: Database.Database | null = null;

export function getCrmDb(): Database.Database {
  if (db) return db;
  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  initSchema(db);
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS crm_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS contractors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL DEFAULT 'client',
      name TEXT NOT NULL,
      company TEXT,
      inn TEXT,
      phone TEXT,
      telegram TEXT,
      email TEXT,
      address TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_contractors_name ON contractors(name);
    CREATE INDEX IF NOT EXISTS idx_contractors_phone ON contractors(phone);

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contractor_id INTEGER NOT NULL REFERENCES contractors(id),
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'new',
      amount_kopecks INTEGER NOT NULL DEFAULT 0,
      deadline TEXT,
      source TEXT NOT NULL DEFAULT 'manual',
      created_by TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_orders_contractor ON orders(contractor_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contractor_id INTEGER NOT NULL REFERENCES contractors(id),
      order_id INTEGER REFERENCES orders(id),
      direction TEXT NOT NULL,
      amount_kopecks INTEGER NOT NULL,
      method TEXT NOT NULL DEFAULT 'transfer',
      comment TEXT,
      paid_at TEXT NOT NULL DEFAULT (datetime('now')),
      source TEXT NOT NULL DEFAULT 'manual',
      created_by TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_payments_contractor ON payments(contractor_id);
    CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);

    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      entity_id INTEGER NOT NULL,
      event TEXT NOT NULL,
      message TEXT NOT NULL,
      actor TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_activity_entity ON activity_log(entity_type, entity_id);
  `);
}

export type ContractorType = "client" | "supplier" | "both";
export type OrderStatus =
  | "new"
  | "in_production"
  | "ready"
  | "shipped"
  | "done"
  | "cancelled";
export type PaymentDirection = "in" | "out";
export type PaymentMethod = "cash" | "card" | "transfer" | "other";

export type Contractor = {
  id: number;
  type: ContractorType;
  name: string;
  company: string | null;
  inn: string | null;
  phone: string | null;
  telegram: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Order = {
  id: number;
  contractor_id: number;
  title: string;
  description: string | null;
  status: OrderStatus;
  amount_kopecks: number;
  deadline: string | null;
  source: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Payment = {
  id: number;
  contractor_id: number;
  order_id: number | null;
  direction: PaymentDirection;
  amount_kopecks: number;
  method: PaymentMethod;
  comment: string | null;
  paid_at: string;
  source: string;
  created_by: string | null;
  created_at: string;
};

export type ActivityEntry = {
  id: number;
  entity_type: "order" | "contractor";
  entity_id: number;
  event: string;
  message: string;
  actor: string | null;
  created_at: string;
};

export function logActivity(
  entityType: ActivityEntry["entity_type"],
  entityId: number,
  event: string,
  message: string,
  actor?: string,
): void {
  const db = getCrmDb();
  db.prepare(
    `INSERT INTO activity_log (entity_type, entity_id, event, message, actor) VALUES (?, ?, ?, ?, ?)`,
  ).run(entityType, entityId, event, message, actor || null);
}

export function getActivity(entityType: ActivityEntry["entity_type"], entityId: number): ActivityEntry[] {
  const db = getCrmDb();
  return db
    .prepare(
      `SELECT * FROM activity_log WHERE entity_type = ? AND entity_id = ? ORDER BY created_at DESC`,
    )
    .all(entityType, entityId) as ActivityEntry[];
}

export function getRecentActivity(limit = 20): ActivityEntry[] {
  const db = getCrmDb();
  return db
    .prepare(`SELECT * FROM activity_log ORDER BY created_at DESC LIMIT ?`)
    .all(limit) as ActivityEntry[];
}

// ---------- Контрагенты ----------

export type ContractorInput = {
  type?: ContractorType;
  name: string;
  company?: string;
  inn?: string;
  phone?: string;
  telegram?: string;
  email?: string;
  address?: string;
  notes?: string;
};

export function createContractor(input: ContractorInput, actor?: string): Contractor {
  const db = getCrmDb();
  const contractor = db
    .prepare(
      `INSERT INTO contractors (type, name, company, inn, phone, telegram, email, address, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING *`,
    )
    .get(
      input.type || "client",
      input.name,
      input.company || null,
      input.inn || null,
      input.phone || null,
      input.telegram || null,
      input.email || null,
      input.address || null,
      input.notes || null,
    ) as Contractor;

  logActivity("contractor", contractor.id, "created", `Добавлен контрагент «${contractor.name}»`, actor);
  return contractor;
}

export function getContractors(type?: ContractorType): Contractor[] {
  const db = getCrmDb();
  if (type) {
    return db
      .prepare(`SELECT * FROM contractors WHERE type = ? ORDER BY name`)
      .all(type) as Contractor[];
  }
  return db.prepare(`SELECT * FROM contractors ORDER BY name`).all() as Contractor[];
}

export function getContractorById(id: number): Contractor | undefined {
  const db = getCrmDb();
  return db.prepare(`SELECT * FROM contractors WHERE id = ?`).get(id) as Contractor | undefined;
}

/** Поиск по имени/телефону/компании — используется и сайтом, и ботом */
export function findContractors(query: string): Contractor[] {
  const db = getCrmDb();
  const like = `%${query}%`;
  return db
    .prepare(
      `SELECT * FROM contractors WHERE name LIKE ? OR phone LIKE ? OR company LIKE ? ORDER BY name LIMIT 20`,
    )
    .all(like, like, like) as Contractor[];
}

export function updateContractor(id: number, input: Partial<ContractorInput>): void {
  const db = getCrmDb();
  const current = getContractorById(id);
  if (!current) return;

  db.prepare(
    `UPDATE contractors SET
      type = ?, name = ?, company = ?, inn = ?, phone = ?, telegram = ?, email = ?, address = ?, notes = ?,
      updated_at = datetime('now')
     WHERE id = ?`,
  ).run(
    input.type ?? current.type,
    input.name ?? current.name,
    input.company ?? current.company,
    input.inn ?? current.inn,
    input.phone ?? current.phone,
    input.telegram ?? current.telegram,
    input.email ?? current.email,
    input.address ?? current.address,
    input.notes ?? current.notes,
    id,
  );
}

/** Баланс: сколько контрагент нам должен (положительное) или мы ему (отрицательное), в копейках */
export function getContractorBalance(id: number): number {
  const db = getCrmDb();
  const ordersTotal = (
    db.prepare(`SELECT COALESCE(SUM(amount_kopecks), 0) as sum FROM orders WHERE contractor_id = ?`).get(id) as {
      sum: number;
    }
  ).sum;
  const paymentsIn = (
    db
      .prepare(
        `SELECT COALESCE(SUM(amount_kopecks), 0) as sum FROM payments WHERE contractor_id = ? AND direction = 'in'`,
      )
      .get(id) as { sum: number }
  ).sum;
  const paymentsOut = (
    db
      .prepare(
        `SELECT COALESCE(SUM(amount_kopecks), 0) as sum FROM payments WHERE contractor_id = ? AND direction = 'out'`,
      )
      .get(id) as { sum: number }
  ).sum;
  return ordersTotal - paymentsIn - paymentsOut;
}

// ---------- Заказы ----------

export type OrderInput = {
  contractor_id: number;
  title: string;
  description?: string;
  amount_kopecks: number;
  deadline?: string;
  source?: string;
};

export function createOrder(input: OrderInput, actor?: string): Order {
  const db = getCrmDb();
  const order = db
    .prepare(
      `INSERT INTO orders (contractor_id, title, description, amount_kopecks, deadline, source, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       RETURNING *`,
    )
    .get(
      input.contractor_id,
      input.title,
      input.description || null,
      input.amount_kopecks,
      input.deadline || null,
      input.source || "manual",
      actor || null,
    ) as Order;

  logActivity("order", order.id, "created", `Создан заказ «${order.title}»`, actor);
  return order;
}

export function getOrders(status?: OrderStatus): Order[] {
  const db = getCrmDb();
  if (status) {
    return db
      .prepare(`SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC`)
      .all(status) as Order[];
  }
  return db.prepare(`SELECT * FROM orders ORDER BY created_at DESC`).all() as Order[];
}

export function getOrdersByContractor(contractorId: number): Order[] {
  const db = getCrmDb();
  return db
    .prepare(`SELECT * FROM orders WHERE contractor_id = ? ORDER BY created_at DESC`)
    .all(contractorId) as Order[];
}

export function getOrderById(id: number): Order | undefined {
  const db = getCrmDb();
  return db.prepare(`SELECT * FROM orders WHERE id = ?`).get(id) as Order | undefined;
}

export function updateOrderStatus(id: number, status: OrderStatus, actor?: string): void {
  const db = getCrmDb();
  db.prepare(`UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(status, id);
  logActivity("order", id, "status_changed", `Статус изменён на «${status}»`, actor);
}

// ---------- Платежи ----------

export type PaymentInput = {
  contractor_id: number;
  order_id?: number;
  direction: PaymentDirection;
  amount_kopecks: number;
  method?: PaymentMethod;
  comment?: string;
  source?: string;
};

export function createPayment(input: PaymentInput, actor?: string): Payment {
  const db = getCrmDb();
  const payment = db
    .prepare(
      `INSERT INTO payments (contractor_id, order_id, direction, amount_kopecks, method, comment, source, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING *`,
    )
    .get(
      input.contractor_id,
      input.order_id || null,
      input.direction,
      input.amount_kopecks,
      input.method || "transfer",
      input.comment || null,
      input.source || "manual",
      actor || null,
    ) as Payment;

  const verb = input.direction === "in" ? "Получена оплата" : "Оплачено";
  const message = `${verb} ${(payment.amount_kopecks / 100).toLocaleString("ru-RU")} ₽`;
  if (payment.order_id) {
    logActivity("order", payment.order_id, "payment_recorded", message, actor);
  }
  logActivity("contractor", payment.contractor_id, "payment_recorded", message, actor);

  return payment;
}

export function getPayments(): Payment[] {
  const db = getCrmDb();
  return db.prepare(`SELECT * FROM payments ORDER BY paid_at DESC`).all() as Payment[];
}

export function getPaymentsByContractor(contractorId: number): Payment[] {
  const db = getCrmDb();
  return db
    .prepare(`SELECT * FROM payments WHERE contractor_id = ? ORDER BY paid_at DESC`)
    .all(contractorId) as Payment[];
}

export function getPaymentsByOrder(orderId: number): Payment[] {
  const db = getCrmDb();
  return db
    .prepare(`SELECT * FROM payments WHERE order_id = ? ORDER BY paid_at DESC`)
    .all(orderId) as Payment[];
}

// ---------- Дашборд ----------

export function getMonthRevenueKopecks(): number {
  const db = getCrmDb();
  const row = db
    .prepare(
      `SELECT COALESCE(SUM(amount_kopecks), 0) as sum FROM payments
       WHERE direction = 'in' AND strftime('%Y-%m', paid_at) = strftime('%Y-%m', 'now')`,
    )
    .get() as { sum: number };
  return row.sum;
}

export type DebtEntry = { contractor: Contractor; balance_kopecks: number };

/** Кто должен нам (balance > 0) и кому должны мы (balance < 0) */
export function getDebts(): { owedToUs: DebtEntry[]; weOwe: DebtEntry[] } {
  const contractors = getContractors();
  const owedToUs: DebtEntry[] = [];
  const weOwe: DebtEntry[] = [];

  for (const contractor of contractors) {
    const balance = getContractorBalance(contractor.id);
    if (balance > 0) owedToUs.push({ contractor, balance_kopecks: balance });
    else if (balance < 0) weOwe.push({ contractor, balance_kopecks: balance });
  }

  owedToUs.sort((a, b) => b.balance_kopecks - a.balance_kopecks);
  weOwe.sort((a, b) => a.balance_kopecks - b.balance_kopecks);
  return { owedToUs, weOwe };
}

// ---------- Пользователи CRM ----------

export type CrmUser = {
  id: number;
  username: string;
  password_hash: string;
  name: string;
  created_at: string;
};

export function getUserByUsername(username: string): CrmUser | undefined {
  const db = getCrmDb();
  return db.prepare(`SELECT * FROM crm_users WHERE username = ?`).get(username) as CrmUser | undefined;
}

export function getUserById(id: number): CrmUser | undefined {
  const db = getCrmDb();
  return db.prepare(`SELECT * FROM crm_users WHERE id = ?`).get(id) as CrmUser | undefined;
}

export function createUser(username: string, passwordHash: string, name: string): CrmUser {
  const db = getCrmDb();
  return db
    .prepare(`INSERT INTO crm_users (username, password_hash, name) VALUES (?, ?, ?) RETURNING *`)
    .get(username, passwordHash, name) as CrmUser;
}
