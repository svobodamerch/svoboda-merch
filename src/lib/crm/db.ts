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
  ensureContractorServiceProductColumn(db);
  ensurePaymentsCategoryColumn(db);
  ensureOrderNotesColumn(db);
  ensureContractorRequisiteColumns(db);
  ensureOrderLegalEntityColumn(db);
  ensureOrderCostReviewColumns(db);
  db.exec("CREATE INDEX IF NOT EXISTS idx_payments_category ON payments(category_id)");
  db.exec("CREATE INDEX IF NOT EXISTS idx_order_costs_review ON order_costs(needs_review)");
  return db;
}

/**
 * payments.contractor_id был NOT NULL — платёж без контрагента (банковская
 * комиссия, курьер и т.п.) не мог существовать. SQLite не даёт ослабить
 * NOT NULL через ALTER, поэтому на уже существующих базах пересобираем
 * таблицу: новая с contractor_id NULL + category_id, копируем данные,
 * подменяем. На новых базах initSchema уже создаёт её такой — миграция
 * тут не сработает (contractor_id там сразу NULL-able).
 */
function ensurePaymentsCategoryColumn(db: Database.Database) {
  const cols = db.prepare("PRAGMA table_info(payments)").all() as { name: string; notnull: number }[];
  const contractorCol = cols.find((c) => c.name === "contractor_id");
  const hasCategoryCol = cols.some((c) => c.name === "category_id");
  if (hasCategoryCol && contractorCol && contractorCol.notnull === 0) return;

  const tx = db.transaction(() => {
    db.exec(`
      CREATE TABLE payments_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contractor_id INTEGER REFERENCES contractors(id),
        category_id INTEGER REFERENCES expense_categories(id),
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
      INSERT INTO payments_new (id, contractor_id, order_id, direction, amount_kopecks, method, comment, paid_at, source, created_by, created_at)
        SELECT id, contractor_id, order_id, direction, amount_kopecks, method, comment, paid_at, source, created_by, created_at FROM payments;
      DROP TABLE payments;
      ALTER TABLE payments_new RENAME TO payments;
      CREATE INDEX IF NOT EXISTS idx_payments_contractor ON payments(contractor_id);
      CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
      CREATE INDEX IF NOT EXISTS idx_payments_category ON payments(category_id);
    `);
  });
  tx();
}

/** contractor_services появилась раньше product_id — добавляем на уже существующих базах */
function ensureContractorServiceProductColumn(db: Database.Database) {
  const cols = (db.prepare("PRAGMA table_info(contractor_services)").all() as { name: string }[]).map(
    (c) => c.name,
  );
  if (!cols.includes("product_id")) {
    db.exec("ALTER TABLE contractor_services ADD COLUMN product_id INTEGER REFERENCES products(id)");
  }
}

/** База знаний: свободные заметки по проекту (что сработало, косяки, поставщики) — добавляем на уже существующих базах */
function ensureOrderNotesColumn(db: Database.Database) {
  const cols = (db.prepare("PRAGMA table_info(orders)").all() as { name: string }[]).map((c) => c.name);
  if (!cols.includes("notes")) db.exec("ALTER TABLE orders ADD COLUMN notes TEXT");
}

/** Юрреквизиты и договор появились позже contractors — добавляем на уже существующих базах */
function ensureContractorRequisiteColumns(db: Database.Database) {
  const cols = (db.prepare("PRAGMA table_info(contractors)").all() as { name: string }[]).map((c) => c.name);
  const add = (name: string) => {
    if (!cols.includes(name)) db.exec(`ALTER TABLE contractors ADD COLUMN ${name} TEXT`);
  };
  [
    "kpp", "ogrn", "legal_address", "actual_address",
    "bank_name", "bank_account", "bank_bik", "bank_corr_account",
    "contract_number", "contract_date", "contract_basis",
  ].forEach(add);
}

/** legal_entity_id появился позже orders — добавляем на уже существующих базах */
function ensureOrderLegalEntityColumn(db: Database.Database) {
  const cols = (db.prepare("PRAGMA table_info(orders)").all() as { name: string }[]).map((c) => c.name);
  if (!cols.includes("legal_entity_id")) {
    db.exec("ALTER TABLE orders ADD COLUMN legal_entity_id INTEGER REFERENCES legal_entities(id)");
  }
}

/**
 * Флаг «на разбор»: когда данные внесены приблизительно (не ясен точный
 * контрагент, не сходится количество и т.п.), не гадаем и не молчим —
 * помечаем needs_review вместо текстовой пометки в comment, чтобы потом
 * можно было спокойно сесть и пройтись по очереди целиком.
 */
function ensureOrderCostReviewColumns(db: Database.Database) {
  const cols = (db.prepare("PRAGMA table_info(order_costs)").all() as { name: string }[]).map((c) => c.name);
  if (!cols.includes("needs_review")) db.exec("ALTER TABLE order_costs ADD COLUMN needs_review INTEGER NOT NULL DEFAULT 0");
  if (!cols.includes("review_note")) db.exec("ALTER TABLE order_costs ADD COLUMN review_note TEXT");
}

/** tasks появилась раньше contractor_id/order_id/reminded_at — добавляем на уже существующих базах */
function ensureTaskLinkColumns(db: Database.Database) {
  const cols = (db.prepare("PRAGMA table_info(tasks)").all() as { name: string }[]).map((c) => c.name);
  if (!cols.includes("contractor_id")) db.exec("ALTER TABLE tasks ADD COLUMN contractor_id INTEGER REFERENCES contractors(id)");
  if (!cols.includes("order_id")) db.exec("ALTER TABLE tasks ADD COLUMN order_id INTEGER REFERENCES orders(id)");
  if (!cols.includes("reminded_at")) db.exec("ALTER TABLE tasks ADD COLUMN reminded_at TEXT");
  if (!cols.includes("amount_kopecks")) db.exec("ALTER TABLE tasks ADD COLUMN amount_kopecks INTEGER");
  // Напомнить можно раньше срока («созвон в 14:00, напомнить за 10 минут»).
  // Пусто — напоминаем ровно в due_at, как было.
  if (!cols.includes("remind_at")) db.exec("ALTER TABLE tasks ADD COLUMN remind_at TEXT");
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
      kpp TEXT,
      ogrn TEXT,
      legal_address TEXT,
      actual_address TEXT,
      bank_name TEXT,
      bank_account TEXT,
      bank_bik TEXT,
      bank_corr_account TEXT,
      contract_number TEXT,
      contract_date TEXT,
      contract_basis TEXT,
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

    /*
     * Контактные лица контрагента — отдельной таблицей, потому что у
     * организации подписант и менеджер проекта почти всегда разные люди,
     * а старые поля phone/telegram/email на самом контрагенте держат
     * только одного.
     */
    CREATE TABLE IF NOT EXISTS contractor_contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contractor_id INTEGER NOT NULL REFERENCES contractors(id),
      name TEXT NOT NULL,
      role TEXT,
      phone TEXT,
      email TEXT,
      telegram TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_contractor_contacts_contractor ON contractor_contacts(contractor_id);

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contractor_id INTEGER NOT NULL REFERENCES contractors(id),
      legal_entity_id INTEGER REFERENCES legal_entities(id),
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

    CREATE TABLE IF NOT EXISTS expense_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      kind TEXT NOT NULL DEFAULT 'variable',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contractor_id INTEGER REFERENCES contractors(id),
      category_id INTEGER REFERENCES expense_categories(id),
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

    /*
     * Юрлица: две ИП с разными налоговыми режимами. От юрлица зависят
     * реквизиты в документе, своя нумерация и формула налога.
     */
    CREATE TABLE IF NOT EXISTS legal_entities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      short_name TEXT NOT NULL,
      inn TEXT NOT NULL,
      kpp TEXT,
      ogrnip TEXT,
      address TEXT,
      signer_name TEXT,
      tax_regime TEXT NOT NULL DEFAULT 'usn_income',
      tax_rate REAL NOT NULL DEFAULT 6,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    /*
     * Расчётные счета отдельной таблицей, а не полями юрлица: счёт можно
     * сменить или держать несколько, а уже выставленные документы обязаны
     * показывать тот счёт, с которым их выставили.
     */
    CREATE TABLE IF NOT EXISTS bank_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      legal_entity_id INTEGER NOT NULL REFERENCES legal_entities(id),
      bank_name TEXT NOT NULL,
      bik TEXT NOT NULL,
      corr_account TEXT,
      account_number TEXT NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_bank_accounts_entity ON bank_accounts(legal_entity_id);

    /*
     * Счета и акты одной таблицей: структура у них совпадает почти
     * полностью, акт обычно делается из счёта теми же позициями, и остаётся
     * место для накладной и УПД. Реквизиты сторон сохраняются снимком в
     * JSON — смена банка не должна переписывать историю документов.
     */
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doc_type TEXT NOT NULL DEFAULT 'invoice',
      number TEXT NOT NULL,
      doc_date TEXT NOT NULL,
      legal_entity_id INTEGER NOT NULL REFERENCES legal_entities(id),
      bank_account_id INTEGER REFERENCES bank_accounts(id),
      contractor_id INTEGER NOT NULL REFERENCES contractors(id),
      order_id INTEGER REFERENCES orders(id),
      source_document_id INTEGER REFERENCES documents(id),
      basis TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      total_kopecks INTEGER NOT NULL DEFAULT 0,
      supplier_snapshot TEXT,
      buyer_snapshot TEXT,
      paid_at TEXT,
      comment TEXT,
      created_by TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_documents_contractor ON documents(contractor_id);
    CREATE INDEX IF NOT EXISTS idx_documents_order ON documents(order_id);
    CREATE INDEX IF NOT EXISTS idx_documents_entity ON documents(legal_entity_id);

    CREATE TABLE IF NOT EXISTS document_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_id INTEGER NOT NULL REFERENCES documents(id),
      position INTEGER NOT NULL DEFAULT 0,
      title TEXT NOT NULL,
      quantity REAL NOT NULL DEFAULT 1,
      unit TEXT NOT NULL DEFAULT 'шт',
      unit_price_kopecks INTEGER NOT NULL DEFAULT 0,
      amount_kopecks INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_document_items_doc ON document_items(document_id);

    /*
     * Себестоимость заказа. Отдельно от payments сознательно: платёж — это
     * факт движения денег, а затрата возникает раньше (пришёл счёт от
     * поставщика) и может быть ещё не оплачена. Прибыль считается только
     * отсюда; payments отвечает на вопрос «сколько денег ушло», а не
     * «во сколько нам обошёлся заказ».
     */
    CREATE TABLE IF NOT EXISTS order_costs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id),
      order_item_id INTEGER REFERENCES order_items(id),
      kind TEXT NOT NULL DEFAULT 'material',
      title TEXT NOT NULL,
      contractor_id INTEGER REFERENCES contractors(id),
      quantity REAL NOT NULL DEFAULT 1,
      unit TEXT NOT NULL DEFAULT 'шт',
      unit_cost_kopecks INTEGER NOT NULL DEFAULT 0,
      amount_kopecks INTEGER NOT NULL DEFAULT 0,
      supplier_invoice TEXT,
      doc_url TEXT,
      status TEXT NOT NULL DEFAULT 'planned',
      payment_id INTEGER REFERENCES payments(id),
      comment TEXT,
      needs_review INTEGER NOT NULL DEFAULT 0,
      review_note TEXT,
      created_by TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_order_costs_order ON order_costs(order_id);
    CREATE INDEX IF NOT EXISTS idx_order_costs_contractor ON order_costs(contractor_id);

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
      amount_kopecks INTEGER,
      reminded_at TEXT,
      source TEXT NOT NULL DEFAULT 'manual',
      created_by TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      done_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(due_at);

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL DEFAULT 'other',
      title TEXT NOT NULL,
      description TEXT,
      default_cost_kopecks INTEGER NOT NULL DEFAULT 0,
      default_sell_price_kopecks INTEGER NOT NULL DEFAULT 0,
      lead_time TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

    CREATE TABLE IF NOT EXISTS contractor_services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contractor_id INTEGER NOT NULL REFERENCES contractors(id),
      product_id INTEGER REFERENCES products(id),
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
  kpp: string | null;
  ogrn: string | null;
  legal_address: string | null;
  actual_address: string | null;
  bank_name: string | null;
  bank_account: string | null;
  bank_bik: string | null;
  bank_corr_account: string | null;
  contract_number: string | null;
  contract_date: string | null;
  contract_basis: string | null;
  phone: string | null;
  telegram: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ContractorContact = {
  id: number;
  contractor_id: number;
  name: string;
  role: string | null;
  phone: string | null;
  email: string | null;
  telegram: string | null;
  created_at: string;
};

export type Order = {
  id: number;
  contractor_id: number;
  legal_entity_id: number | null;
  title: string;
  description: string | null;
  status: OrderStatus;
  amount_kopecks: number;
  deadline: string | null;
  source: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Payment = {
  id: number;
  contractor_id: number | null;
  category_id: number | null;
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
  kpp?: string;
  ogrn?: string;
  legal_address?: string;
  actual_address?: string;
  bank_name?: string;
  bank_account?: string;
  bank_bik?: string;
  bank_corr_account?: string;
  contract_number?: string;
  contract_date?: string;
  contract_basis?: string;
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
      `INSERT INTO contractors
         (type, name, company, inn, kpp, ogrn, legal_address, actual_address,
          bank_name, bank_account, bank_bik, bank_corr_account,
          contract_number, contract_date, contract_basis,
          phone, telegram, email, address, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING *`,
    )
    .get(
      input.type || "client",
      input.name,
      input.company || null,
      input.inn || null,
      input.kpp || null,
      input.ogrn || null,
      input.legal_address || null,
      input.actual_address || null,
      input.bank_name || null,
      input.bank_account || null,
      input.bank_bik || null,
      input.bank_corr_account || null,
      input.contract_number || null,
      input.contract_date || null,
      input.contract_basis || null,
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
      type = ?, name = ?, company = ?, inn = ?, kpp = ?, ogrn = ?, legal_address = ?, actual_address = ?,
      bank_name = ?, bank_account = ?, bank_bik = ?, bank_corr_account = ?,
      contract_number = ?, contract_date = ?, contract_basis = ?,
      phone = ?, telegram = ?, email = ?, address = ?, notes = ?,
      updated_at = datetime('now')
     WHERE id = ?`,
  ).run(
    input.type ?? current.type,
    input.name ?? current.name,
    input.company ?? current.company,
    input.inn ?? current.inn,
    input.kpp ?? current.kpp,
    input.ogrn ?? current.ogrn,
    input.legal_address ?? current.legal_address,
    input.actual_address ?? current.actual_address,
    input.bank_name ?? current.bank_name,
    input.bank_account ?? current.bank_account,
    input.bank_bik ?? current.bank_bik,
    input.bank_corr_account ?? current.bank_corr_account,
    input.contract_number ?? current.contract_number,
    input.contract_date ?? current.contract_date,
    input.contract_basis ?? current.contract_basis,
    input.phone ?? current.phone,
    input.telegram ?? current.telegram,
    input.email ?? current.email,
    input.address ?? current.address,
    input.notes ?? current.notes,
    id,
  );
}

// ---------- Контактные лица контрагента ----------

export type ContractorContactInput = {
  name: string;
  role?: string;
  phone?: string;
  email?: string;
  telegram?: string;
};

export function getContractorContacts(contractorId: number): ContractorContact[] {
  const db = getCrmDb();
  return db
    .prepare(`SELECT * FROM contractor_contacts WHERE contractor_id = ? ORDER BY id`)
    .all(contractorId) as ContractorContact[];
}

export function createContractorContact(contractorId: number, input: ContractorContactInput): ContractorContact {
  const db = getCrmDb();
  return db
    .prepare(
      `INSERT INTO contractor_contacts (contractor_id, name, role, phone, email, telegram)
       VALUES (?, ?, ?, ?, ?, ?) RETURNING *`,
    )
    .get(contractorId, input.name, input.role || null, input.phone || null, input.email || null, input.telegram || null) as ContractorContact;
}

export function deleteContractorContact(id: number): void {
  const db = getCrmDb();
  db.prepare(`DELETE FROM contractor_contacts WHERE id = ?`).run(id);
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
  // Заказ увеличивает то, что нам должны; входящая оплата это гасит.
  // Исходящая оплата — мы отдали деньги — тоже гасит долг (или уходит в плюс,
  // если платили без встречного заказа: тогда это на нашей стороне, до
  // выяснения — например, доплатить, завести заказ или это аванс).
  return ordersTotal - paymentsIn + paymentsOut;
}

// ---------- Работы контрагента (справочник цен) ----------

export type ContractorService = {
  id: number;
  contractor_id: number;
  product_id: number | null;
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
  product_id?: number;
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
      `INSERT INTO contractor_services (contractor_id, product_id, title, description, cost_kopecks, sell_price_kopecks, lead_time, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING *`,
    )
    .get(
      contractorId,
      input.product_id || null,
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

// ---------- Каталог товаров ----------

export type ProductCategory = "clothing" | "accessories" | "other";

export type Product = {
  id: number;
  category: ProductCategory;
  title: string;
  description: string | null;
  default_cost_kopecks: number;
  default_sell_price_kopecks: number;
  lead_time: string | null;
  created_at: string;
  updated_at: string;
};

export type ProductInput = {
  category?: ProductCategory;
  title: string;
  description?: string;
  default_cost_kopecks?: number;
  default_sell_price_kopecks?: number;
  lead_time?: string;
};

export function getProducts(): Product[] {
  const db = getCrmDb();
  return db.prepare(`SELECT * FROM products ORDER BY category, title`).all() as Product[];
}

export function getProductById(id: number): Product | undefined {
  const db = getCrmDb();
  return db.prepare(`SELECT * FROM products WHERE id = ?`).get(id) as Product | undefined;
}

export function createProduct(input: ProductInput): Product {
  const db = getCrmDb();
  return db
    .prepare(
      `INSERT INTO products (category, title, description, default_cost_kopecks, default_sell_price_kopecks, lead_time)
       VALUES (?, ?, ?, ?, ?, ?)
       RETURNING *`,
    )
    .get(
      input.category || "other",
      input.title,
      input.description || null,
      input.default_cost_kopecks || 0,
      input.default_sell_price_kopecks || 0,
      input.lead_time || null,
    ) as Product;
}

export function updateProduct(id: number, input: Partial<ProductInput>): Product | undefined {
  const db = getCrmDb();
  const current = getProductById(id);
  if (!current) return undefined;

  db.prepare(
    `UPDATE products SET category = ?, title = ?, description = ?, default_cost_kopecks = ?, default_sell_price_kopecks = ?, lead_time = ?,
      updated_at = datetime('now')
     WHERE id = ?`,
  ).run(
    input.category ?? current.category,
    input.title ?? current.title,
    input.description ?? current.description,
    input.default_cost_kopecks ?? current.default_cost_kopecks,
    input.default_sell_price_kopecks ?? current.default_sell_price_kopecks,
    input.lead_time ?? current.lead_time,
    id,
  );
  return getProductById(id);
}

export function deleteProduct(id: number): void {
  const db = getCrmDb();
  db.prepare(`DELETE FROM products WHERE id = ?`).run(id);
}

// ---------- Заказы ----------

export type OrderInput = {
  contractor_id: number;
  legal_entity_id?: number;
  title: string;
  description?: string;
  amount_kopecks: number;
  deadline?: string;
  source?: string;
};

export function createOrder(input: OrderInput, actor?: string): Order {
  const db = getCrmDb();
  // Без явного выбора — сделка идёт через юрлицо по умолчанию, если оно заведено
  const legalEntityId =
    input.legal_entity_id ??
    (db.prepare(`SELECT id FROM legal_entities WHERE is_default = 1 LIMIT 1`).get() as { id: number } | undefined)
      ?.id ??
    null;

  const order = db
    .prepare(
      `INSERT INTO orders (contractor_id, legal_entity_id, title, description, amount_kopecks, deadline, source, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING *`,
    )
    .get(
      input.contractor_id,
      legalEntityId,
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

export function updateOrderLegalEntity(id: number, legalEntityId: number, actor?: string): void {
  const db = getCrmDb();
  db.prepare(`UPDATE orders SET legal_entity_id = ?, updated_at = datetime('now') WHERE id = ?`).run(
    legalEntityId,
    id,
  );
  logActivity("order", id, "legal_entity_changed", "Юрлицо сделки изменено", actor);
}

/**
 * Налог по сделке — кассовым методом, как оба ИП фактически считают (см.
 * финмодель): дата поступления денег, не дата счёта или начисления.
 * УСН «доходы» — ставка от полученного. УСН «доходы минус расходы» —
 * ставка от (получено минус подтверждённые/оплаченные затраты), но не
 * меньше нуля — база не бывает отрицательной.
 */
export function getOrderTax(orderId: number): { legalEntity: LegalEntity | null; baseKopecks: number; taxKopecks: number } {
  const db = getCrmDb();
  const order = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(orderId) as Order | undefined;
  if (!order || !order.legal_entity_id) return { legalEntity: null, baseKopecks: 0, taxKopecks: 0 };

  const entity = getLegalEntity(order.legal_entity_id);
  if (!entity) return { legalEntity: null, baseKopecks: 0, taxKopecks: 0 };

  const received = (
    db
      .prepare(`SELECT COALESCE(SUM(amount_kopecks), 0) AS s FROM payments WHERE order_id = ? AND direction = 'in'`)
      .get(orderId) as { s: number }
  ).s;

  let base = received;
  if (entity.tax_regime === "usn_income_minus_expense") {
    const spent = (
      db
        .prepare(
          `SELECT COALESCE(SUM(amount_kopecks), 0) AS s FROM order_costs WHERE order_id = ? AND status = 'paid'`,
        )
        .get(orderId) as { s: number }
    ).s;
    base = Math.max(0, received - spent);
  }

  return { legalEntity: entity, baseKopecks: base, taxKopecks: Math.round((base * entity.tax_rate) / 100) };
}

/** База знаний: заметки по проекту — что сработало, косяки, поставщики, сроки */
export function updateOrderNotes(id: number, notes: string): void {
  const db = getCrmDb();
  db.prepare(`UPDATE orders SET notes = ?, updated_at = datetime('now') WHERE id = ?`).run(notes || null, id);
}

// ---------- Платежи ----------

export type PaymentInput = {
  contractor_id?: number;
  category_id?: number;
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
      `INSERT INTO payments (contractor_id, category_id, order_id, direction, amount_kopecks, method, comment, source, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING *`,
    )
    .get(
      input.contractor_id || null,
      input.category_id || null,
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
  if (payment.contractor_id) {
    logActivity("contractor", payment.contractor_id, "payment_recorded", message, actor);
  }

  return payment;
}

// ---------- Категории расходов ----------

export type ExpenseCategoryKind = "fixed" | "variable";
export type ExpenseCategory = { id: number; name: string; kind: ExpenseCategoryKind; created_at: string };

export function getExpenseCategories(): ExpenseCategory[] {
  const db = getCrmDb();
  return db.prepare(`SELECT * FROM expense_categories ORDER BY name`).all() as ExpenseCategory[];
}

export function getOrCreateExpenseCategory(name: string, kind: ExpenseCategoryKind = "variable"): ExpenseCategory {
  const db = getCrmDb();
  const existing = db.prepare(`SELECT * FROM expense_categories WHERE name = ?`).get(name) as
    | ExpenseCategory
    | undefined;
  if (existing) return existing;
  return db
    .prepare(`INSERT INTO expense_categories (name, kind) VALUES (?, ?) RETURNING *`)
    .get(name, kind) as ExpenseCategory;
}

export function deleteExpenseCategory(id: number): void {
  const db = getCrmDb();
  db.prepare(`DELETE FROM expense_categories WHERE id = ?`).run(id);
}

export type PaymentWithLabels = Payment & { contractor_name: string | null; category_name: string | null };

export function getPayments(): PaymentWithLabels[] {
  const db = getCrmDb();
  return db
    .prepare(
      `SELECT p.*, c.name as contractor_name, ec.name as category_name
       FROM payments p
       LEFT JOIN contractors c ON c.id = p.contractor_id
       LEFT JOIN expense_categories ec ON ec.id = p.category_id
       ORDER BY p.paid_at DESC`,
    )
    .all() as PaymentWithLabels[];
}

export type MonthlyPaymentTotal = { month: string; direction: PaymentDirection; total_kopecks: number };

/** Платежи CRM, сгруппированные по месяцу и направлению — для P&L */
export function getPaymentsByMonth(): MonthlyPaymentTotal[] {
  const db = getCrmDb();
  return db
    .prepare(
      `SELECT strftime('%Y-%m', paid_at) as month, direction, SUM(amount_kopecks) as total_kopecks
       FROM payments GROUP BY month, direction ORDER BY month`,
    )
    .all() as MonthlyPaymentTotal[];
}

export type CategoryTotal = { category: string; kind: ExpenseCategoryKind; total_kopecks: number };

/** Расходы CRM (не Money Treker) по статьям — только те, что заведены через CRM/бота */
export function getExpensesByCategory(): CategoryTotal[] {
  const db = getCrmDb();
  return db
    .prepare(
      `SELECT ec.name as category, ec.kind as kind, SUM(p.amount_kopecks) as total_kopecks
       FROM payments p JOIN expense_categories ec ON ec.id = p.category_id
       WHERE p.direction = 'out'
       GROUP BY ec.id ORDER BY total_kopecks DESC`,
    )
    .all() as CategoryTotal[];
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

export type ActiveDealsSummary = {
  count: number;
  amountKopecks: number;
  byStatus: { status: OrderStatus; count: number; amountKopecks: number }[];
};

/** Сделки в работе — все статусы кроме готовых/отменённых */
export function getActiveDealsSummary(): ActiveDealsSummary {
  const db = getCrmDb();
  const rows = db
    .prepare(
      `SELECT status, COUNT(*) AS count, COALESCE(SUM(amount_kopecks), 0) AS amount
       FROM orders WHERE status NOT IN ('done', 'cancelled') GROUP BY status`,
    )
    .all() as { status: OrderStatus; count: number; amount: number }[];

  return {
    count: rows.reduce((s, r) => s + r.count, 0),
    amountKopecks: rows.reduce((s, r) => s + r.amount, 0),
    byStatus: rows.map((r) => ({ status: r.status, count: r.count, amountKopecks: r.amount })),
  };
}

/** Затраты по сделкам, подтверждённые счётом или оплаченные, начисленные в этом месяце */
export function getMonthCostKopecks(): number {
  const db = getCrmDb();
  const row = db
    .prepare(
      `SELECT COALESCE(SUM(amount_kopecks), 0) as sum FROM order_costs
       WHERE status != 'planned' AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')`,
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

// ---------- Юрлица и расчётные счета ----------

export type TaxRegime = "usn_income" | "usn_income_minus_expense";

export type LegalEntity = {
  id: number;
  name: string;
  short_name: string;
  inn: string;
  kpp: string | null;
  ogrnip: string | null;
  address: string | null;
  signer_name: string | null;
  tax_regime: TaxRegime;
  tax_rate: number;
  is_default: number;
  created_at: string;
  updated_at: string;
};

export type BankAccount = {
  id: number;
  legal_entity_id: number;
  bank_name: string;
  bik: string;
  corr_account: string | null;
  account_number: string;
  is_default: number;
  is_active: number;
  created_at: string;
};

export function getLegalEntities(): LegalEntity[] {
  const db = getCrmDb();
  return db.prepare(`SELECT * FROM legal_entities ORDER BY is_default DESC, id`).all() as LegalEntity[];
}

export function getLegalEntity(id: number): LegalEntity | undefined {
  const db = getCrmDb();
  return db.prepare(`SELECT * FROM legal_entities WHERE id = ?`).get(id) as LegalEntity | undefined;
}

export function upsertLegalEntity(input: Partial<LegalEntity> & { name: string; short_name: string; inn: string }): LegalEntity {
  const db = getCrmDb();
  if (input.id) {
    db.prepare(
      `UPDATE legal_entities SET name=?, short_name=?, inn=?, kpp=?, ogrnip=?, address=?,
         signer_name=?, tax_regime=?, tax_rate=?, updated_at=datetime('now') WHERE id=?`,
    ).run(
      input.name, input.short_name, input.inn, input.kpp || null, input.ogrnip || null,
      input.address || null, input.signer_name || null, input.tax_regime || "usn_income",
      input.tax_rate ?? 6, input.id,
    );
    return getLegalEntity(input.id)!;
  }
  return db
    .prepare(
      `INSERT INTO legal_entities (name, short_name, inn, kpp, ogrnip, address, signer_name, tax_regime, tax_rate, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
    )
    .get(
      input.name, input.short_name, input.inn, input.kpp || null, input.ogrnip || null,
      input.address || null, input.signer_name || null, input.tax_regime || "usn_income",
      input.tax_rate ?? 6, input.is_default ?? 0,
    ) as LegalEntity;
}

export function getBankAccounts(legalEntityId?: number): BankAccount[] {
  const db = getCrmDb();
  if (legalEntityId) {
    return db
      .prepare(`SELECT * FROM bank_accounts WHERE legal_entity_id = ? ORDER BY is_default DESC, id`)
      .all(legalEntityId) as BankAccount[];
  }
  return db.prepare(`SELECT * FROM bank_accounts ORDER BY legal_entity_id, is_default DESC`).all() as BankAccount[];
}

export function createBankAccount(input: Omit<BankAccount, "id" | "created_at" | "is_active"> & { is_active?: number }): BankAccount {
  const db = getCrmDb();
  const tx = db.transaction(() => {
    // Счёт по умолчанию у юрлица может быть только один
    if (input.is_default) {
      db.prepare(`UPDATE bank_accounts SET is_default = 0 WHERE legal_entity_id = ?`).run(input.legal_entity_id);
    }
    return db
      .prepare(
        `INSERT INTO bank_accounts (legal_entity_id, bank_name, bik, corr_account, account_number, is_default, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *`,
      )
      .get(
        input.legal_entity_id, input.bank_name, input.bik, input.corr_account || null,
        input.account_number, input.is_default ?? 0, input.is_active ?? 1,
      ) as BankAccount;
  });
  return tx();
}

export function setDefaultBankAccount(id: number): void {
  const db = getCrmDb();
  const acc = db.prepare(`SELECT * FROM bank_accounts WHERE id = ?`).get(id) as BankAccount | undefined;
  if (!acc) return;
  const tx = db.transaction(() => {
    db.prepare(`UPDATE bank_accounts SET is_default = 0 WHERE legal_entity_id = ?`).run(acc.legal_entity_id);
    db.prepare(`UPDATE bank_accounts SET is_default = 1, is_active = 1 WHERE id = ?`).run(id);
  });
  tx();
}

export function archiveBankAccount(id: number): void {
  const db = getCrmDb();
  db.prepare(`UPDATE bank_accounts SET is_active = 0, is_default = 0 WHERE id = ?`).run(id);
}

// ---------- Счета и акты ----------

export type DocType = "invoice" | "act";
export type DocStatus = "draft" | "issued" | "paid" | "cancelled";

export type DocumentRow = {
  id: number;
  doc_type: DocType;
  number: string;
  doc_date: string;
  legal_entity_id: number;
  bank_account_id: number | null;
  contractor_id: number;
  order_id: number | null;
  source_document_id: number | null;
  basis: string | null;
  status: DocStatus;
  total_kopecks: number;
  supplier_snapshot: string | null;
  buyer_snapshot: string | null;
  paid_at: string | null;
  comment: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type DocumentItem = {
  id: number;
  document_id: number;
  position: number;
  title: string;
  quantity: number;
  unit: string;
  unit_price_kopecks: number;
  amount_kopecks: number;
};

export type DocumentItemInput = {
  title: string;
  quantity?: number;
  unit?: string;
  unit_price_kopecks: number;
};

export type DocumentWithLabels = DocumentRow & {
  contractor_name: string | null;
  entity_short_name: string | null;
};

/**
 * Следующий номер — продолжение существующей нумерации юрлица по типу
 * документа. Нумерация у ИП сквозная и уже идёт (Лялин дошёл до 302,
 * Остапович до 177), поэтому берём максимум числовой части, а не счётчик
 * с нуля.
 */
export function nextDocumentNumber(legalEntityId: number, docType: DocType): string {
  const db = getCrmDb();
  const rows = db
    .prepare(`SELECT number FROM documents WHERE legal_entity_id = ? AND doc_type = ?`)
    .all(legalEntityId, docType) as { number: string }[];
  const max = rows.reduce((m, r) => {
    const n = parseInt(String(r.number).replace(/\D/g, ""), 10);
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return String(max + 1);
}

function snapshotSupplier(entity: LegalEntity, account?: BankAccount): string {
  return JSON.stringify({
    name: entity.name,
    inn: entity.inn,
    kpp: entity.kpp,
    address: entity.address,
    signer: entity.signer_name,
    bank: account
      ? {
          bank_name: account.bank_name,
          bik: account.bik,
          corr_account: account.corr_account,
          account_number: account.account_number,
        }
      : null,
  });
}

function snapshotBuyer(c: Contractor): string {
  return JSON.stringify({
    name: c.company || c.name,
    inn: c.inn,
    address: c.address,
    contact: c.name,
  });
}

export type CreateDocumentInput = {
  doc_type?: DocType;
  legal_entity_id: number;
  bank_account_id?: number;
  contractor_id: number;
  order_id?: number;
  source_document_id?: number;
  basis?: string;
  doc_date?: string;
  number?: string;
  comment?: string;
  items: DocumentItemInput[];
};

export function createDocument(input: CreateDocumentInput, actor?: string): DocumentRow {
  const db = getCrmDb();
  const entity = getLegalEntity(input.legal_entity_id);
  if (!entity) throw new Error("Юрлицо не найдено");

  const accounts = getBankAccounts(entity.id);
  const account =
    accounts.find((a) => a.id === input.bank_account_id) ||
    accounts.find((a) => a.is_default && a.is_active) ||
    accounts.find((a) => a.is_active);

  const contractor = getContractorById(input.contractor_id);
  if (!contractor) throw new Error("Контрагент не найден");

  const docType = input.doc_type || "invoice";
  const items = input.items.filter((i) => i.title.trim());
  const total = items.reduce(
    (s, i) => s + Math.round((i.quantity ?? 1) * i.unit_price_kopecks),
    0,
  );

  const tx = db.transaction(() => {
    const doc = db
      .prepare(
        `INSERT INTO documents
           (doc_type, number, doc_date, legal_entity_id, bank_account_id, contractor_id, order_id,
            source_document_id, basis, status, total_kopecks, supplier_snapshot, buyer_snapshot, comment, created_by)
         VALUES (?, ?, COALESCE(?, date('now')), ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?)
         RETURNING *`,
      )
      .get(
        docType,
        input.number || nextDocumentNumber(entity.id, docType),
        input.doc_date || null,
        entity.id,
        account?.id || null,
        contractor.id,
        input.order_id || null,
        input.source_document_id || null,
        input.basis || null,
        total,
        snapshotSupplier(entity, account),
        snapshotBuyer(contractor),
        input.comment || null,
        actor || null,
      ) as DocumentRow;

    const insert = db.prepare(
      `INSERT INTO document_items (document_id, position, title, quantity, unit, unit_price_kopecks, amount_kopecks)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    );
    items.forEach((i, idx) => {
      const qty = i.quantity ?? 1;
      insert.run(doc.id, idx + 1, i.title, qty, i.unit || "шт", i.unit_price_kopecks, Math.round(qty * i.unit_price_kopecks));
    });

    return doc;
  });

  const doc = tx();
  if (input.order_id) {
    logActivity("order", input.order_id, "document_created",
      `${docType === "act" ? "Акт" : "Счёт"} №${doc.number} на ${(total / 100).toLocaleString("ru-RU")} ₽`, actor);
  }
  return doc;
}

export function getDocuments(filter: { contractorId?: number; orderId?: number; docType?: DocType } = {}): DocumentWithLabels[] {
  const db = getCrmDb();
  const where: string[] = [];
  const args: unknown[] = [];
  if (filter.contractorId) { where.push("d.contractor_id = ?"); args.push(filter.contractorId); }
  if (filter.orderId) { where.push("d.order_id = ?"); args.push(filter.orderId); }
  if (filter.docType) { where.push("d.doc_type = ?"); args.push(filter.docType); }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  return db
    .prepare(
      `SELECT d.*, c.name AS contractor_name, le.short_name AS entity_short_name
       FROM documents d
       LEFT JOIN contractors c ON c.id = d.contractor_id
       LEFT JOIN legal_entities le ON le.id = d.legal_entity_id
       ${clause}
       ORDER BY d.doc_date DESC, d.id DESC`,
    )
    .all(...args) as DocumentWithLabels[];
}

export function getDocumentById(id: number): DocumentWithLabels | undefined {
  const db = getCrmDb();
  return db
    .prepare(
      `SELECT d.*, c.name AS contractor_name, le.short_name AS entity_short_name
       FROM documents d
       LEFT JOIN contractors c ON c.id = d.contractor_id
       LEFT JOIN legal_entities le ON le.id = d.legal_entity_id
       WHERE d.id = ?`,
    )
    .get(id) as DocumentWithLabels | undefined;
}

export function getDocumentItems(documentId: number): DocumentItem[] {
  const db = getCrmDb();
  return db
    .prepare(`SELECT * FROM document_items WHERE document_id = ? ORDER BY position, id`)
    .all(documentId) as DocumentItem[];
}

export function updateDocumentStatus(id: number, status: DocStatus, actor?: string): DocumentRow | undefined {
  const db = getCrmDb();
  const doc = getDocumentById(id);
  if (!doc) return undefined;

  db.prepare(
    `UPDATE documents SET status = ?, paid_at = CASE WHEN ? = 'paid' THEN COALESCE(paid_at, datetime('now')) ELSE paid_at END,
       updated_at = datetime('now') WHERE id = ?`,
  ).run(status, status, id);

  if (doc.order_id) {
    logActivity("order", doc.order_id, "document_status", `Счёт №${doc.number}: ${status}`, actor);
  }
  return db.prepare(`SELECT * FROM documents WHERE id = ?`).get(id) as DocumentRow;
}

/**
 * Отметить счёт оплаченным: как и с затратами, платёж создаём здесь же,
 * чтобы поступление не пришлось вводить вторым действием.
 */
export function payDocument(id: number, opts: { method?: PaymentMethod; paid_at?: string } = {}, actor?: string): DocumentRow | undefined {
  const db = getCrmDb();
  const doc = getDocumentById(id);
  if (!doc) return undefined;
  if (doc.status === "paid") return doc;

  const tx = db.transaction(() => {
    db.prepare(
      `INSERT INTO payments (contractor_id, order_id, direction, amount_kopecks, method, comment, paid_at, source, created_by)
       VALUES (?, ?, 'in', ?, ?, ?, COALESCE(?, datetime('now')), 'manual', ?)`,
    ).run(
      doc.contractor_id,
      doc.order_id,
      doc.total_kopecks,
      opts.method || "transfer",
      `Оплата счёта №${doc.number}`,
      opts.paid_at || null,
      actor || null,
    );
    db.prepare(
      `UPDATE documents SET status='paid', paid_at=COALESCE(?, datetime('now')), updated_at=datetime('now') WHERE id=?`,
    ).run(opts.paid_at || null, id);
  });
  tx();

  if (doc.order_id) {
    logActivity("order", doc.order_id, "document_paid", `Счёт №${doc.number} оплачен`, actor);
  }
  return db.prepare(`SELECT * FROM documents WHERE id = ?`).get(id) as DocumentRow;
}

/** Акт по счёту: те же позиции, своя нумерация, ссылка на счёт-источник */
export function createActFromInvoice(invoiceId: number, actor?: string): DocumentRow | undefined {
  const invoice = getDocumentById(invoiceId);
  if (!invoice || invoice.doc_type !== "invoice") return undefined;
  const items = getDocumentItems(invoiceId);

  return createDocument(
    {
      doc_type: "act",
      legal_entity_id: invoice.legal_entity_id,
      bank_account_id: invoice.bank_account_id || undefined,
      contractor_id: invoice.contractor_id,
      order_id: invoice.order_id || undefined,
      source_document_id: invoice.id,
      basis: invoice.basis || `Счёт №${invoice.number} от ${invoice.doc_date}`,
      items: items.map((i) => ({
        title: i.title,
        quantity: i.quantity,
        unit: i.unit,
        unit_price_kopecks: i.unit_price_kopecks,
      })),
    },
    actor,
  );
}

export function deleteDocument(id: number): void {
  const db = getCrmDb();
  const tx = db.transaction(() => {
    db.prepare(`DELETE FROM document_items WHERE document_id = ?`).run(id);
    db.prepare(`DELETE FROM documents WHERE id = ?`).run(id);
  });
  tx();
}

// ---------- Себестоимость заказа ----------

/** Материалы (заготовки), работа подряда (пошив, печать), логистика, прочее */
export type CostKind = "material" | "work" | "logistics" | "other";
/** План → счёт поставщика получен → оплачено */
export type CostStatus = "planned" | "confirmed" | "paid";

export type OrderCost = {
  id: number;
  order_id: number;
  order_item_id: number | null;
  kind: CostKind;
  title: string;
  contractor_id: number | null;
  quantity: number;
  unit: string;
  unit_cost_kopecks: number;
  amount_kopecks: number;
  supplier_invoice: string | null;
  doc_url: string | null;
  status: CostStatus;
  payment_id: number | null;
  comment: string | null;
  needs_review: number;
  review_note: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderCostWithLabels = OrderCost & {
  contractor_name: string | null;
  item_title: string | null;
};

export type OrderCostInput = {
  order_id: number;
  order_item_id?: number;
  kind?: CostKind;
  title: string;
  contractor_id?: number;
  quantity?: number;
  unit?: string;
  unit_cost_kopecks?: number;
  amount_kopecks?: number;
  supplier_invoice?: string;
  doc_url?: string;
  status?: CostStatus;
  comment?: string;
  needs_review?: boolean;
  review_note?: string;
};

const COST_SELECT = `
  SELECT oc.*, c.name AS contractor_name, oi.title AS item_title
  FROM order_costs oc
  LEFT JOIN contractors c ON c.id = oc.contractor_id
  LEFT JOIN order_items oi ON oi.id = oc.order_item_id
`;

/**
 * Итог строки: если заданы количество и цена за единицу — считаем из них,
 * иначе берём сумму как есть. Так одинаково удобно и «55 шт × 330,83 ₽»,
 * и «доставка 800 ₽» одной суммой.
 */
function costAmount(input: OrderCostInput): number {
  if (input.amount_kopecks != null) return Math.round(input.amount_kopecks);
  const qty = input.quantity ?? 1;
  return Math.round(qty * (input.unit_cost_kopecks ?? 0));
}

export function getOrderCosts(orderId: number): OrderCostWithLabels[] {
  const db = getCrmDb();
  return db
    .prepare(`${COST_SELECT} WHERE oc.order_id = ? ORDER BY oc.id`)
    .all(orderId) as OrderCostWithLabels[];
}

export function createOrderCost(input: OrderCostInput, actor?: string): OrderCost {
  const db = getCrmDb();
  const amount = costAmount(input);
  const cost = db
    .prepare(
      `INSERT INTO order_costs
         (order_id, order_item_id, kind, title, contractor_id, quantity, unit,
          unit_cost_kopecks, amount_kopecks, supplier_invoice, doc_url, status, comment,
          needs_review, review_note, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING *`,
    )
    .get(
      input.order_id,
      input.order_item_id || null,
      input.kind || "material",
      input.title,
      input.contractor_id || null,
      input.quantity ?? 1,
      input.unit || "шт",
      input.unit_cost_kopecks ?? 0,
      amount,
      input.supplier_invoice || null,
      input.doc_url || null,
      input.status || "planned",
      input.comment || null,
      input.needs_review ? 1 : 0,
      input.review_note || null,
      actor || null,
    ) as OrderCost;

  logActivity("order", input.order_id, "cost_added", `Затрата: «${cost.title}»`, actor);
  return cost;
}

export function updateOrderCost(id: number, input: Partial<OrderCostInput>, actor?: string): OrderCost | undefined {
  const db = getCrmDb();
  const existing = db.prepare(`SELECT * FROM order_costs WHERE id = ?`).get(id) as OrderCost | undefined;
  if (!existing) return undefined;

  // Роуты передают все поля явно, в том числе как undefined, когда клиент их
  // не менял — {...existing, ...input} тогда затирал бы существующие значения
  // (например title) этим undefined. Оставляем в input только реально заданное.
  const definedInput = Object.fromEntries(
    Object.entries(input).filter(([, v]) => v !== undefined),
  ) as Partial<OrderCostInput>;
  const merged = { ...existing, ...definedInput } as unknown as OrderCostInput & { amount_kopecks?: number };
  // Пересчитываем сумму, только если пришли количество или цена и не пришла явная сумма
  const amount =
    input.amount_kopecks != null
      ? Math.round(input.amount_kopecks)
      : input.quantity != null || input.unit_cost_kopecks != null
        ? Math.round((merged.quantity ?? 1) * (merged.unit_cost_kopecks ?? 0))
        : existing.amount_kopecks;

  db.prepare(
    `UPDATE order_costs SET
       order_item_id = ?, kind = ?, title = ?, contractor_id = ?, quantity = ?, unit = ?,
       unit_cost_kopecks = ?, amount_kopecks = ?, supplier_invoice = ?, doc_url = ?,
       status = ?, comment = ?, needs_review = ?, review_note = ?, updated_at = datetime('now')
     WHERE id = ?`,
  ).run(
    merged.order_item_id || null,
    merged.kind || "material",
    merged.title,
    merged.contractor_id || null,
    merged.quantity ?? 1,
    merged.unit || "шт",
    merged.unit_cost_kopecks ?? 0,
    amount,
    merged.supplier_invoice || null,
    merged.doc_url || null,
    merged.status || "planned",
    merged.comment || null,
    input.needs_review != null ? (input.needs_review ? 1 : 0) : existing.needs_review,
    input.review_note !== undefined ? input.review_note || null : existing.review_note,
    id,
  );

  logActivity("order", existing.order_id, "cost_updated", `Затрата изменена: «${merged.title}»`, actor);
  return db.prepare(`SELECT * FROM order_costs WHERE id = ?`).get(id) as OrderCost;
}

export function deleteOrderCost(id: number, actor?: string): void {
  const db = getCrmDb();
  const existing = db.prepare(`SELECT * FROM order_costs WHERE id = ?`).get(id) as OrderCost | undefined;
  if (!existing) return;
  db.prepare(`DELETE FROM order_costs WHERE id = ?`).run(id);
  logActivity("order", existing.order_id, "cost_deleted", `Затрата удалена: «${existing.title}»`, actor);
}

export type ReviewCostRow = OrderCostWithLabels & { order_title: string | null };

/** Всё, что внесено приблизительно и требует спокойного разбора — по всем заказам сразу */
export function getCostsNeedingReview(): ReviewCostRow[] {
  const db = getCrmDb();
  return db
    .prepare(
      `SELECT oc.*, c.name AS contractor_name, oi.title AS item_title, o.title AS order_title
       FROM order_costs oc
       LEFT JOIN contractors c ON c.id = oc.contractor_id
       LEFT JOIN order_items oi ON oi.id = oc.order_item_id
       LEFT JOIN orders o ON o.id = oc.order_id
       WHERE oc.needs_review = 1
       ORDER BY oc.created_at DESC`,
    )
    .all() as ReviewCostRow[];
}

/**
 * Отметить затрату оплаченной: одним действием создаём исходящий платёж и
 * связываем его со строкой. Иначе одну и ту же трату пришлось бы вводить
 * дважды — и был бы риск задвоить её в отчётах.
 */
export function payOrderCost(
  id: number,
  opts: { method?: PaymentMethod; paid_at?: string } = {},
  actor?: string,
): OrderCost | undefined {
  const db = getCrmDb();
  const cost = db.prepare(`SELECT * FROM order_costs WHERE id = ?`).get(id) as OrderCost | undefined;
  if (!cost) return undefined;
  if (cost.payment_id) return cost;

  const tx = db.transaction(() => {
    const payment = db
      .prepare(
        `INSERT INTO payments (contractor_id, order_id, direction, amount_kopecks, method, comment, paid_at, source, created_by)
         VALUES (?, ?, 'out', ?, ?, ?, COALESCE(?, datetime('now')), 'manual', ?)
         RETURNING *`,
      )
      .get(
        cost.contractor_id,
        cost.order_id,
        cost.amount_kopecks,
        opts.method || "transfer",
        cost.supplier_invoice ? `${cost.title} · счёт ${cost.supplier_invoice}` : cost.title,
        opts.paid_at || null,
        actor || null,
      ) as Payment;

    db.prepare(
      `UPDATE order_costs SET status = 'paid', payment_id = ?, updated_at = datetime('now') WHERE id = ?`,
    ).run(payment.id, id);
  });
  tx();

  logActivity("order", cost.order_id, "cost_paid", `Оплачено: «${cost.title}»`, actor);
  return db.prepare(`SELECT * FROM order_costs WHERE id = ?`).get(id) as OrderCost;
}

export type OrderEconomics = {
  revenueKopecks: number;
  costPlannedKopecks: number;
  costActualKopecks: number;
  costPaidKopecks: number;
  costUnpaidKopecks: number;
  costByKind: { kind: CostKind; totalKopecks: number }[];
  grossProfitKopecks: number;
  marginPercent: number;
  receivedKopecks: number;
  paidOutKopecks: number;
  receivableKopecks: number;
  cashFlowKopecks: number;
};

/**
 * Экономика заказа. Себестоимость берётся только из order_costs — платежи
 * поставщикам в неё не суммируются, иначе оплаченная затрата посчиталась бы
 * дважды. Платежи отвечают отдельно, за движение денег.
 */
export function getOrderEconomics(orderId: number): OrderEconomics {
  const db = getCrmDb();

  const revenue = (
    db.prepare(`SELECT amount_kopecks FROM orders WHERE id = ?`).get(orderId) as
      | { amount_kopecks: number }
      | undefined
  )?.amount_kopecks ?? 0;

  const costs = db
    .prepare(`SELECT kind, status, amount_kopecks FROM order_costs WHERE order_id = ?`)
    .all(orderId) as { kind: CostKind; status: CostStatus; amount_kopecks: number }[];

  // План — прикидка до счёта; факт — то, что подтверждено документом или уже оплачено
  const costPlanned = costs.filter((c) => c.status === "planned").reduce((s, c) => s + c.amount_kopecks, 0);
  const costActual = costs.filter((c) => c.status !== "planned").reduce((s, c) => s + c.amount_kopecks, 0);
  const costPaid = costs.filter((c) => c.status === "paid").reduce((s, c) => s + c.amount_kopecks, 0);

  const byKind = new Map<CostKind, number>();
  for (const c of costs) byKind.set(c.kind, (byKind.get(c.kind) || 0) + c.amount_kopecks);

  const cash = db
    .prepare(
      `SELECT direction, SUM(amount_kopecks) AS total FROM payments WHERE order_id = ? GROUP BY direction`,
    )
    .all(orderId) as { direction: PaymentDirection; total: number }[];
  const received = cash.find((r) => r.direction === "in")?.total ?? 0;
  const paidOut = cash.find((r) => r.direction === "out")?.total ?? 0;

  const gross = revenue - costActual;

  return {
    revenueKopecks: revenue,
    costPlannedKopecks: costPlanned,
    costActualKopecks: costActual,
    costPaidKopecks: costPaid,
    costUnpaidKopecks: costActual - costPaid,
    costByKind: [...byKind.entries()].map(([kind, totalKopecks]) => ({ kind, totalKopecks })),
    grossProfitKopecks: gross,
    marginPercent: revenue > 0 ? Math.round((gross / revenue) * 1000) / 10 : 0,
    receivedKopecks: received,
    paidOutKopecks: paidOut,
    receivableKopecks: revenue - received,
    cashFlowKopecks: received - paidOut,
  };
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
  remind_at: string | null;
  entity_type: TaskEntityType | null;
  entity_id: number | null;
  contractor_id: number | null;
  order_id: number | null;
  amount_kopecks: number | null;
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
  remind_at?: string;
  entity_type?: TaskEntityType;
  entity_id?: number;
  contractor_id?: number;
  order_id?: number;
  amount_kopecks?: number;
  source?: string;
};

export function createTask(input: TaskInput, actor?: string): Task {
  const db = getCrmDb();
  const task = db
    .prepare(
      `INSERT INTO tasks (title, description, due_at, remind_at, entity_type, entity_id, contractor_id, order_id, amount_kopecks, source, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING *`,
    )
    .get(
      input.title,
      input.description || null,
      input.due_at || null,
      input.remind_at || null,
      input.entity_type || null,
      input.entity_id || null,
      input.contractor_id || null,
      input.order_id || null,
      input.amount_kopecks ?? null,
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
       AND COALESCE(t.remind_at, t.due_at) <= datetime('now') AND t.reminded_at IS NULL
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
