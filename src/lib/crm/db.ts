import Database from "better-sqlite3";
import path from "path";
import { randomBytes } from "crypto";

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
  ensureTaskLinkColumns(db);
  return db;
}

/** tasks появилась раньше contractor_id/order_id/reminded_at — добавляем на уже существующих базах */
function ensureTaskLinkColumns(db: Database.Database) {
  const cols = (db.prepare("PRAGMA table_info(tasks)").all() as { name: string }[]).map((c) => c.name);
  if (!cols.includes("contractor_id")) db.exec("ALTER TABLE tasks ADD COLUMN contractor_id INTEGER REFERENCES contractors(id)");
  if (!cols.includes("order_id")) db.exec("ALTER TABLE tasks ADD COLUMN order_id INTEGER REFERENCES orders(id)");
  if (!cols.includes("reminded_at")) db.exec("ALTER TABLE tasks ADD COLUMN reminded_at TEXT");
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

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id),
      position INTEGER NOT NULL DEFAULT 0,
      title TEXT NOT NULL,
      description TEXT,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit TEXT NOT NULL DEFAULT 'шт',
      unit_price_kopecks INTEGER NOT NULL DEFAULT 0,
      discount_percent REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

    CREATE TABLE IF NOT EXISTS proposals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id),
      token TEXT NOT NULL UNIQUE,
      template TEXT NOT NULL DEFAULT 'classic',
      status TEXT NOT NULL DEFAULT 'draft',
      intro TEXT,
      solution TEXT,
      terms TEXT,
      valid_until TEXT,
      created_by TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      sent_at TEXT,
      viewed_at TEXT,
      accepted_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_proposals_token ON proposals(token);
    CREATE INDEX IF NOT EXISTS idx_proposals_order ON proposals(order_id);

    CREATE TABLE IF NOT EXISTS proposal_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      proposal_id INTEGER NOT NULL REFERENCES proposals(id),
      event TEXT NOT NULL,
      meta TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_proposal_events_proposal ON proposal_events(proposal_id);

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'open',
      due_at TEXT,
      entity_type TEXT,
      entity_id INTEGER,
      contractor_id INTEGER REFERENCES contractors(id),
      order_id INTEGER REFERENCES orders(id),
      reminded_at TEXT,
      source TEXT NOT NULL DEFAULT 'manual',
      created_by TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      done_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(due_at);

    CREATE TABLE IF NOT EXISTS contractor_services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contractor_id INTEGER NOT NULL REFERENCES contractors(id),
      title TEXT NOT NULL,
      description TEXT,
      cost_kopecks INTEGER NOT NULL DEFAULT 0,
      sell_price_kopecks INTEGER,
      lead_time TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_contractor_services_contractor ON contractor_services(contractor_id);
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

// ---------- Работы контрагента (справочник цен) ----------

export type ContractorService = {
  id: number;
  contractor_id: number;
  title: string;
  description: string | null;
  cost_kopecks: number;
  sell_price_kopecks: number | null;
  lead_time: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ContractorServiceInput = {
  title: string;
  description?: string;
  cost_kopecks: number;
  sell_price_kopecks?: number;
  lead_time?: string;
  notes?: string;
};

export function getContractorServices(contractorId: number): ContractorService[] {
  const db = getCrmDb();
  return db
    .prepare(`SELECT * FROM contractor_services WHERE contractor_id = ? ORDER BY title`)
    .all(contractorId) as ContractorService[];
}

export function createContractorService(
  contractorId: number,
  input: ContractorServiceInput,
  actor?: string,
): ContractorService {
  const db = getCrmDb();
  const service = db
    .prepare(
      `INSERT INTO contractor_services (contractor_id, title, description, cost_kopecks, sell_price_kopecks, lead_time, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       RETURNING *`,
    )
    .get(
      contractorId,
      input.title,
      input.description || null,
      input.cost_kopecks,
      input.sell_price_kopecks ?? null,
      input.lead_time || null,
      input.notes || null,
    ) as ContractorService;

  logActivity("contractor", contractorId, "service_added", `Добавлена работа «${service.title}»`, actor);
  return service;
}

export function updateContractorService(
  id: number,
  input: Partial<ContractorServiceInput>,
): ContractorService | undefined {
  const db = getCrmDb();
  const current = db.prepare(`SELECT * FROM contractor_services WHERE id = ?`).get(id) as
    | ContractorService
    | undefined;
  if (!current) return undefined;

  db.prepare(
    `UPDATE contractor_services SET
      title = ?, description = ?, cost_kopecks = ?, sell_price_kopecks = ?, lead_time = ?, notes = ?,
      updated_at = datetime('now')
     WHERE id = ?`,
  ).run(
    input.title ?? current.title,
    input.description ?? current.description,
    input.cost_kopecks ?? current.cost_kopecks,
    input.sell_price_kopecks ?? current.sell_price_kopecks,
    input.lead_time ?? current.lead_time,
    input.notes ?? current.notes,
    id,
  );
  return db.prepare(`SELECT * FROM contractor_services WHERE id = ?`).get(id) as ContractorService;
}

export function deleteContractorService(id: number): void {
  const db = getCrmDb();
  db.prepare(`DELETE FROM contractor_services WHERE id = ?`).run(id);
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

// ---------- Позиции заказа ----------

export type OrderItem = {
  id: number;
  order_id: number;
  position: number;
  title: string;
  description: string | null;
  quantity: number;
  unit: string;
  unit_price_kopecks: number;
  discount_percent: number;
  created_at: string;
};

export type OrderItemInput = {
  title: string;
  description?: string;
  quantity: number;
  unit?: string;
  unit_price_kopecks: number;
  discount_percent?: number;
};

export function getOrderItems(orderId: number): OrderItem[] {
  const db = getCrmDb();
  return db
    .prepare(`SELECT * FROM order_items WHERE order_id = ? ORDER BY position, id`)
    .all(orderId) as OrderItem[];
}

export function lineTotalKopecks(item: Pick<OrderItem, "quantity" | "unit_price_kopecks" | "discount_percent">): number {
  const gross = item.quantity * item.unit_price_kopecks;
  return Math.round(gross * (1 - item.discount_percent / 100));
}

/**
 * Полностью заменяет состав заказа и пересчитывает его сумму — заказ
 * остаётся единым источником правды для баланса контрагента, позиции
 * лишь его расшифровка.
 */
export function replaceOrderItems(orderId: number, items: OrderItemInput[], actor?: string): OrderItem[] {
  const db = getCrmDb();
  const tx = db.transaction((rows: OrderItemInput[]) => {
    db.prepare(`DELETE FROM order_items WHERE order_id = ?`).run(orderId);

    const insert = db.prepare(
      `INSERT INTO order_items (order_id, position, title, description, quantity, unit, unit_price_kopecks, discount_percent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    rows.forEach((row, i) => {
      insert.run(
        orderId,
        i,
        row.title,
        row.description || null,
        row.quantity,
        row.unit || "шт",
        row.unit_price_kopecks,
        row.discount_percent || 0,
      );
    });

    const total = rows.reduce((sum, row) => sum + lineTotalKopecks({ ...row, discount_percent: row.discount_percent || 0 }), 0);
    db.prepare(`UPDATE orders SET amount_kopecks = ?, updated_at = datetime('now') WHERE id = ?`).run(total, orderId);
  });
  tx(items);

  logActivity("order", orderId, "items_updated", `Состав заказа обновлён — ${items.length} поз.`, actor);
  return getOrderItems(orderId);
}

// ---------- КП (proposals) ----------

export type ProposalTemplate = "classic" | "short";
export type ProposalStatus = "draft" | "sent" | "viewed" | "accepted" | "needs_revision";

export type Proposal = {
  id: number;
  order_id: number;
  token: string;
  template: ProposalTemplate;
  status: ProposalStatus;
  intro: string | null;
  solution: string | null;
  terms: string | null;
  valid_until: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
  viewed_at: string | null;
  accepted_at: string | null;
};

export type ProposalInput = {
  template?: ProposalTemplate;
  intro?: string;
  solution?: string;
  terms?: string;
  valid_until?: string;
};

function generateToken(): string {
  return randomBytes(12).toString("base64url");
}

export function getProposalByOrderId(orderId: number): Proposal | undefined {
  const db = getCrmDb();
  return db.prepare(`SELECT * FROM proposals WHERE order_id = ?`).get(orderId) as Proposal | undefined;
}

export function getProposalByToken(token: string): Proposal | undefined {
  const db = getCrmDb();
  return db.prepare(`SELECT * FROM proposals WHERE token = ?`).get(token) as Proposal | undefined;
}

export function getProposalById(id: number): Proposal | undefined {
  const db = getCrmDb();
  return db.prepare(`SELECT * FROM proposals WHERE id = ?`).get(id) as Proposal | undefined;
}

export type ProposalListEntry = Proposal & {
  order_title: string;
  order_amount_kopecks: number;
  contractor_name: string;
};

export function getProposals(): ProposalListEntry[] {
  const db = getCrmDb();
  return db
    .prepare(
      `SELECT p.*, o.title as order_title, o.amount_kopecks as order_amount_kopecks, c.name as contractor_name
       FROM proposals p
       JOIN orders o ON o.id = p.order_id
       JOIN contractors c ON c.id = o.contractor_id
       ORDER BY p.updated_at DESC`,
    )
    .all() as ProposalListEntry[];
}

/** Один активный КП на заказ — если уже есть, возвращает его как есть */
export function createProposal(orderId: number, input: ProposalInput, actor?: string): Proposal {
  const existing = getProposalByOrderId(orderId);
  if (existing) return existing;

  const db = getCrmDb();
  const proposal = db
    .prepare(
      `INSERT INTO proposals (order_id, token, template, intro, solution, terms, valid_until, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING *`,
    )
    .get(
      orderId,
      generateToken(),
      input.template || "classic",
      input.intro || null,
      input.solution || null,
      input.terms || null,
      input.valid_until || null,
      actor || null,
    ) as Proposal;

  logActivity("order", orderId, "proposal_created", "Создано коммерческое предложение", actor);
  return proposal;
}

export function updateProposal(id: number, input: ProposalInput): Proposal | undefined {
  const db = getCrmDb();
  const current = getProposalById(id);
  if (!current) return undefined;

  db.prepare(
    `UPDATE proposals SET template = ?, intro = ?, solution = ?, terms = ?, valid_until = ?, updated_at = datetime('now')
     WHERE id = ?`,
  ).run(
    input.template ?? current.template,
    input.intro ?? current.intro,
    input.solution ?? current.solution,
    input.terms ?? current.terms,
    input.valid_until ?? current.valid_until,
    id,
  );
  return getProposalById(id);
}

export function logProposalEvent(proposalId: number, event: string, meta?: string): void {
  const db = getCrmDb();
  db.prepare(`INSERT INTO proposal_events (proposal_id, event, meta) VALUES (?, ?, ?)`).run(
    proposalId,
    event,
    meta || null,
  );
}

export function getProposalEvents(proposalId: number): { id: number; event: string; meta: string | null; created_at: string }[] {
  const db = getCrmDb();
  return db
    .prepare(`SELECT * FROM proposal_events WHERE proposal_id = ? ORDER BY created_at DESC`)
    .all(proposalId) as { id: number; event: string; meta: string | null; created_at: string }[];
}

export function markProposalSent(id: number, channel: string, actor?: string): void {
  const db = getCrmDb();
  const proposal = getProposalById(id);
  if (!proposal) return;
  db.prepare(`UPDATE proposals SET status = 'sent', sent_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`).run(id);
  logProposalEvent(id, `sent_${channel}`);
  logActivity("order", proposal.order_id, "proposal_sent", `КП отправлено (${channel})`, actor);
}

/** Отмечает первый просмотр — повторные заходы статус не откатывают */
export function markProposalViewed(id: number): void {
  const db = getCrmDb();
  const proposal = getProposalById(id);
  if (!proposal || proposal.viewed_at) return;
  db.prepare(
    `UPDATE proposals SET status = CASE WHEN status = 'sent' THEN 'viewed' ELSE status END,
       viewed_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
  ).run(id);
  logProposalEvent(id, "viewed");
  logActivity("order", proposal.order_id, "proposal_viewed", "Клиент открыл КП");
}

export function markProposalAccepted(id: number): Proposal | undefined {
  const db = getCrmDb();
  const proposal = getProposalById(id);
  if (!proposal) return undefined;
  db.prepare(
    `UPDATE proposals SET status = 'accepted', accepted_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
  ).run(id);
  logProposalEvent(id, "accepted");
  logActivity("order", proposal.order_id, "proposal_accepted", "Клиент принял КП");
  return getProposalById(id);
}

// ---------- Задачи ----------

export type TaskStatus = "open" | "done";
export type TaskEntityType = "order" | "contractor";

export type Task = {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  due_at: string | null;
  entity_type: TaskEntityType | null;
  entity_id: number | null;
  contractor_id: number | null;
  order_id: number | null;
  reminded_at: string | null;
  source: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  done_at: string | null;
};

export type TaskWithLinks = Task & {
  contractor_name: string | null;
  order_title: string | null;
};

export type TaskInput = {
  title: string;
  description?: string;
  due_at?: string;
  entity_type?: TaskEntityType;
  entity_id?: number;
  contractor_id?: number;
  order_id?: number;
  source?: string;
};

export function createTask(input: TaskInput, actor?: string): Task {
  const db = getCrmDb();
  const task = db
    .prepare(
      `INSERT INTO tasks (title, description, due_at, entity_type, entity_id, contractor_id, order_id, source, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING *`,
    )
    .get(
      input.title,
      input.description || null,
      input.due_at || null,
      input.entity_type || null,
      input.entity_id || null,
      input.contractor_id || null,
      input.order_id || null,
      input.source || "manual",
      actor || null,
    ) as Task;

  if (task.entity_type && task.entity_id) {
    logActivity(task.entity_type, task.entity_id, "task_created", `Задача: «${task.title}»`, actor);
  }
  if (task.contractor_id) {
    logActivity("contractor", task.contractor_id, "task_created", `Задача: «${task.title}»`, actor);
  }
  if (task.order_id) {
    logActivity("order", task.order_id, "task_created", `Задача: «${task.title}»`, actor);
  }
  return task;
}

const TASK_SELECT = `
  SELECT t.*, c.name as contractor_name, o.title as order_title
  FROM tasks t
  LEFT JOIN contractors c ON c.id = t.contractor_id
  LEFT JOIN orders o ON o.id = t.order_id
`;

export function getTasks(status?: TaskStatus): TaskWithLinks[] {
  const db = getCrmDb();
  if (status) {
    return db
      .prepare(`${TASK_SELECT} WHERE t.status = ? ORDER BY t.due_at IS NULL, t.due_at, t.created_at DESC`)
      .all(status) as TaskWithLinks[];
  }
  return db
    .prepare(`${TASK_SELECT} ORDER BY t.status, t.due_at IS NULL, t.due_at, t.created_at DESC`)
    .all() as TaskWithLinks[];
}

/** Задачи и заказы с распознаваемым сроком — источник данных календаря */
export function getTasksWithDueDate(): Task[] {
  const db = getCrmDb();
  return db.prepare(`SELECT * FROM tasks WHERE due_at IS NOT NULL AND status = 'open' ORDER BY due_at`).all() as Task[];
}

/** Открытые задачи со сроком, для которых ещё не отправили напоминание */
export function getDueTasks(): TaskWithLinks[] {
  const db = getCrmDb();
  return db
    .prepare(
      `${TASK_SELECT} WHERE t.status = 'open' AND t.due_at IS NOT NULL
       AND t.due_at <= datetime('now') AND t.reminded_at IS NULL
       ORDER BY t.due_at`,
    )
    .all() as TaskWithLinks[];
}

export function markTaskReminded(id: number): void {
  const db = getCrmDb();
  db.prepare(`UPDATE tasks SET reminded_at = datetime('now') WHERE id = ?`).run(id);
}

export function completeTask(id: number): Task | undefined {
  const db = getCrmDb();
  db.prepare(`UPDATE tasks SET status = 'done', done_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`).run(id);
  return db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(id) as Task | undefined;
}

export function reopenTask(id: number): Task | undefined {
  const db = getCrmDb();
  db.prepare(`UPDATE tasks SET status = 'open', done_at = NULL, updated_at = datetime('now') WHERE id = ?`).run(id);
  return db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(id) as Task | undefined;
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
