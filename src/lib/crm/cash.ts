import { getCrmDb } from "./db";
import type {
  CashConfidence,
  CashDirection,
  CashEvent,
  CashForecast,
  CashHorizon,
  CashKind,
} from "./cash-types";

export * from "./cash-types";

/**
 * Денежный поток: факт и прогноз в одной модели чтения.
 *
 * Хранятся они раздельно (payments — только реальные деньги,
 * expected_cash_events — только ожидаемые), потому что смешивать их в одной
 * таблице опасно: любой существующий подсчёт поступлений мгновенно начал бы
 * учитывать прогноз как полученные деньги. Объединяем на чтении.
 *
 * См. docs/domain-model.md.
 */

type PaymentRow = {
  id: number;
  direction: CashDirection;
  kind: CashKind;
  amount_kopecks: number;
  paid_at: string;
  contractor_id: number | null;
  contractor_name: string | null;
  order_id: number | null;
  order_title: string | null;
  document_id: number | null;
  legal_entity_id: number | null;
  category_id: number | null;
  comment: string | null;
};

type ExpectedRow = {
  id: number;
  direction: CashDirection;
  kind: CashKind;
  amount_kopecks: number;
  expected_at: string;
  confidence: CashConfidence;
  contractor_id: number | null;
  contractor_name: string | null;
  order_id: number | null;
  order_title: string | null;
  document_id: number | null;
  legal_entity_id: number | null;
  comment: string | null;
};

/**
 * Событие считается неразобранным, если непонятно, что это за деньги:
 * нет смысла, либо не привязано ни к сделке, ни к статье расходов.
 */
function isUnattributed(row: PaymentRow): boolean {
  if (row.kind === "other") return true;
  if (row.kind === "overhead") return row.category_id === null;
  return row.order_id === null && row.contractor_id === null;
}

export function getActualCashEvents(): CashEvent[] {
  const db = getCrmDb();
  const rows = db
    .prepare(
      `SELECT p.id, p.direction, p.kind, p.amount_kopecks, p.paid_at,
              p.contractor_id, c.name AS contractor_name,
              p.order_id, o.title AS order_title,
              p.document_id, p.legal_entity_id, p.category_id, p.comment
       FROM payments p
       LEFT JOIN contractors c ON c.id = p.contractor_id
       LEFT JOIN orders o ON o.id = p.order_id
       ORDER BY p.paid_at DESC, p.id DESC`,
    )
    .all() as PaymentRow[];

  return rows.map((r) => ({
    id: r.id,
    status: "actual" as const,
    direction: r.direction,
    kind: r.kind,
    amountKopecks: r.amount_kopecks,
    date: r.paid_at,
    confidence: null,
    contractorId: r.contractor_id,
    contractorName: r.contractor_name,
    orderId: r.order_id,
    orderTitle: r.order_title,
    documentId: r.document_id,
    legalEntityId: r.legal_entity_id,
    comment: r.comment,
    unattributed: isUnattributed(r),
  }));
}

export function getExpectedCashEvents(): CashEvent[] {
  const db = getCrmDb();
  const rows = db
    .prepare(
      `SELECT e.id, e.direction, e.kind, e.amount_kopecks, e.expected_at, e.confidence,
              e.contractor_id, c.name AS contractor_name,
              e.order_id, o.title AS order_title,
              e.document_id, e.legal_entity_id, e.comment
       FROM expected_cash_events e
       LEFT JOIN contractors c ON c.id = e.contractor_id
       LEFT JOIN orders o ON o.id = e.order_id
       WHERE e.status = 'open'
       ORDER BY e.expected_at`,
    )
    .all() as ExpectedRow[];

  return rows.map((r) => ({
    id: r.id,
    status: "expected" as const,
    direction: r.direction,
    kind: r.kind,
    amountKopecks: r.amount_kopecks,
    date: r.expected_at,
    confidence: r.confidence,
    contractorId: r.contractor_id,
    contractorName: r.contractor_name,
    orderId: r.order_id,
    orderTitle: r.order_title,
    documentId: r.document_id,
    legalEntityId: r.legal_entity_id,
    comment: r.comment,
    unattributed: false,
  }));
}

export type ExpectedCashInput = {
  direction: CashDirection;
  kind?: CashKind;
  amount_kopecks: number;
  expected_at: string;
  confidence?: CashConfidence;
  contractor_id?: number;
  order_id?: number;
  document_id?: number;
  legal_entity_id?: number;
  comment?: string;
};

export function createExpectedCashEvent(input: ExpectedCashInput, actor?: string) {
  const db = getCrmDb();
  return db
    .prepare(
      `INSERT INTO expected_cash_events
         (direction, kind, amount_kopecks, expected_at, confidence,
          contractor_id, order_id, document_id, legal_entity_id, comment, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING *`,
    )
    .get(
      input.direction,
      input.kind || "other",
      input.amount_kopecks,
      input.expected_at,
      input.confidence || "medium",
      input.contractor_id || null,
      input.order_id || null,
      input.document_id || null,
      input.legal_entity_id || null,
      input.comment || null,
      actor || null,
    );
}

/** Ожидание сбылось — закрываем его фактическим платежом, а не удаляем */
export function realizeExpectedCashEvent(id: number, paymentId: number) {
  const db = getCrmDb();
  db.prepare(
    `UPDATE expected_cash_events
     SET status = 'realized', realized_payment_id = ?, updated_at = datetime('now')
     WHERE id = ?`,
  ).run(paymentId, id);
}

function todayIso(): string {
  // Сервер живёт в UTC, бизнес — в Москве. Считаем день по Москве,
  // иначе вечерние события уезжают на сутки вперёд.
  const msk = new Date(Date.now() + 3 * 60 * 60 * 1000);
  return msk.toISOString().slice(0, 10);
}

/**
 * Прогноз денег. Главный показатель — не «сколько придёт», а минимальный
 * остаток внутри периода: прибыльный проект спокойно создаёт кассовый разрыв,
 * если платить подрядчикам раньше, чем платит клиент.
 */
export function getCashForecast(horizonDays: number[] = [30, 60, 90]): CashForecast {
  const db = getCrmDb();

  const balanceRow = db
    .prepare(
      `SELECT COALESCE(SUM(current_balance_kopecks), 0) AS total,
              SUM(CASE WHEN balance_updated_at IS NOT NULL THEN 1 ELSE 0 END) AS filled
       FROM bank_accounts WHERE is_active = 1`,
    )
    .get() as { total: number; filled: number | null };

  const events = getExpectedCashEvents();
  const today = todayIso();

  const horizons = horizonDays.map((days) => {
    const until = new Date(`${today}T00:00:00Z`);
    until.setUTCDate(until.getUTCDate() + days);
    const untilIso = until.toISOString().slice(0, 10);

    const inHorizon = events
      .filter((e) => e.date >= today && e.date <= untilIso)
      .sort((a, b) => a.date.localeCompare(b.date));

    let expectedIn = 0;
    let expectedOut = 0;
    let highConfidenceIn = 0;
    let running = balanceRow.total;
    let minimum = running;
    let minimumOn: string | null = null;

    for (const e of inHorizon) {
      if (e.direction === "in") {
        expectedIn += e.amountKopecks;
        if (e.confidence === "high") highConfidenceIn += e.amountKopecks;
        running += e.amountKopecks;
      } else {
        expectedOut += e.amountKopecks;
        running -= e.amountKopecks;
      }
      if (running < minimum) {
        minimum = running;
        minimumOn = e.date;
      }
    }

    return {
      days,
      expectedInKopecks: expectedIn,
      expectedOutKopecks: expectedOut,
      projectedBalanceKopecks: running,
      minimumBalanceKopecks: minimum,
      minimumOnDate: minimumOn,
      highConfidenceInKopecks: highConfidenceIn,
    };
  });

  return {
    currentBalanceKopecks: balanceRow.total,
    // Пока остатки не введены, прогноз показывает движение, а не остаток
    balanceKnown: (balanceRow.filled ?? 0) > 0,
    horizons,
  };
}

export function cancelExpectedCashEvent(id: number) {
  const db = getCrmDb();
  db.prepare(
    `UPDATE expected_cash_events SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?`,
  ).run(id);
}
