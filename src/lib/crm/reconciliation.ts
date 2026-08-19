import { getCrmDb } from "./db";

/**
 * Сверка с контрагентами.
 *
 * Долг нигде не хранится — он всегда вычисляется из первичных фактов:
 * начальный остаток + начисления − платежи. Иначе цифра в CRM однажды
 * разойдётся с фактами, и именно это уже произошло с подрядчиками.
 *
 * См. docs/domain-model.md.
 */

export type ContractorRole = "client" | "supplier";

export type ContractorBalance = {
  contractorId: number;
  name: string;
  role: ContractorRole;
  /** Долг на момент начала учёта в CRM */
  openingKopecks: number;
  openingAt: string | null;
  /** Начислено: у клиента — сумма сделок, у подрядчика — согласованные и оплаченные затраты */
  accruedKopecks: number;
  /** Реально прошедшие деньги в нужную сторону */
  paidKopecks: number;
  /**
   * Сколько осталось. У подрядчика — сколько мы ему должны,
   * у клиента — сколько он должен нам. Минус означает переплату.
   */
  outstandingKopecks: number;
  /** Заплачено больше, чем начислено, — расхождение требует объяснения */
  hasDiscrepancy: boolean;
  discrepancyKopecks: number;
  acceptedAt: string | null;
  note: string | null;
};

type Row = {
  id: number;
  name: string;
  type: ContractorRole;
  opening_balance_kopecks: number;
  opening_balance_at: string | null;
  reconciliation_accepted_at: string | null;
  reconciliation_note: string | null;
  accrued_costs: number;
  paid_out: number;
  orders_total: number;
  paid_in: number;
};

const BALANCE_SELECT = `
  SELECT c.id, c.name, c.type,
         c.opening_balance_kopecks, c.opening_balance_at,
         c.reconciliation_accepted_at, c.reconciliation_note,
         -- начислено подрядчику: план не считается обязательством
         COALESCE((SELECT SUM(oc.amount_kopecks) FROM order_costs oc
                   WHERE oc.contractor_id = c.id AND oc.status IN ('confirmed', 'paid')), 0) AS accrued_costs,
         COALESCE((SELECT SUM(p.amount_kopecks) FROM payments p
                   WHERE p.contractor_id = c.id AND p.direction = 'out'), 0) AS paid_out,
         COALESCE((SELECT SUM(o.amount_kopecks) FROM orders o
                   WHERE o.contractor_id = c.id AND o.status != 'cancelled'), 0) AS orders_total,
         COALESCE((SELECT SUM(p.amount_kopecks) FROM payments p
                   WHERE p.contractor_id = c.id AND p.direction = 'in'), 0) AS paid_in
  FROM contractors c
`;

function toBalance(r: Row): ContractorBalance {
  const isSupplier = r.type === "supplier";
  const accrued = isSupplier ? r.accrued_costs : r.orders_total;
  const paid = isSupplier ? r.paid_out : r.paid_in;
  const outstanding = r.opening_balance_kopecks + accrued - paid;

  return {
    contractorId: r.id,
    name: r.name,
    role: r.type,
    openingKopecks: r.opening_balance_kopecks,
    openingAt: r.opening_balance_at,
    accruedKopecks: accrued,
    paidKopecks: paid,
    outstandingKopecks: outstanding,
    hasDiscrepancy: outstanding < 0 && r.reconciliation_accepted_at === null,
    discrepancyKopecks: outstanding < 0 ? -outstanding : 0,
    acceptedAt: r.reconciliation_accepted_at,
    note: r.reconciliation_note,
  };
}

export function getContractorBalanceDetailed(id: number): ContractorBalance | undefined {
  const db = getCrmDb();
  const row = db.prepare(`${BALANCE_SELECT} WHERE c.id = ?`).get(id) as Row | undefined;
  return row ? toBalance(row) : undefined;
}

export function getAllContractorBalances(): ContractorBalance[] {
  const db = getCrmDb();
  const rows = db.prepare(`${BALANCE_SELECT} ORDER BY c.name`).all() as Row[];
  return rows.map(toBalance);
}

/**
 * Расхождения: заплатили больше, чем начислено. Причина почти всегда одна
 * из двух — либо начисление не заведено, либо это долг с прошлого периода,
 * который лечится начальным остатком.
 */
export function getReconciliationExceptions(): ContractorBalance[] {
  return getAllContractorBalances().filter((b) => b.hasDiscrepancy);
}

/**
 * Кто кому должен. Раньше это считалось одной формулой для всех, из-за чего
 * подрядчики попадали в «должны нам»: мы платим им деньги, а формула считала
 * исходящий платёж уменьшением их долга перед нами.
 */
export function getDebtsByRole(): { owedToUs: ContractorBalance[]; weOwe: ContractorBalance[] } {
  const balances = getAllContractorBalances();
  return {
    owedToUs: balances
      .filter((b) => b.role === "client" && b.outstandingKopecks > 0)
      .sort((a, b) => b.outstandingKopecks - a.outstandingKopecks),
    weOwe: balances
      .filter((b) => b.role === "supplier" && b.outstandingKopecks > 0)
      .sort((a, b) => b.outstandingKopecks - a.outstandingKopecks),
  };
}

export function setOpeningBalance(
  contractorId: number,
  balanceKopecks: number,
  note?: string,
  at?: string,
): void {
  const db = getCrmDb();
  db.prepare(
    `UPDATE contractors
     SET opening_balance_kopecks = ?, opening_balance_at = COALESCE(?, date('now')), opening_balance_note = ?
     WHERE id = ?`,
  ).run(Math.round(balanceKopecks), at || null, note || null, contractorId);
}

/** Расхождение осознанно принято — перестаём подсвечивать, но цифру не прячем */
export function acceptReconciliation(contractorId: number, note?: string): void {
  const db = getCrmDb();
  db.prepare(
    `UPDATE contractors
     SET reconciliation_accepted_at = datetime('now'), reconciliation_note = ?
     WHERE id = ?`,
  ).run(note || null, contractorId);
}

export function reopenReconciliation(contractorId: number): void {
  const db = getCrmDb();
  db.prepare(
    `UPDATE contractors SET reconciliation_accepted_at = NULL, reconciliation_note = NULL WHERE id = ?`,
  ).run(contractorId);
}
