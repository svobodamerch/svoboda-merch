import { getCrmDb } from "./db";
import { computeBalance, getAccount, getEntries, listProposals, type SettlementEntry } from "./settlements";

/**
 * Финансовая сводка в портале контрагента — поверх уже существующей
 * сверки (settlement_*), без второй бухгалтерии. Налог и комиссия в
 * сверке — обычные строки расхода, отличаем их по началу названия
 * («Налог …», «Комиссия …»), так их создаёт acceptProposal.
 * Ожидаемые поступления — выставленные счета из архива документов со
 * статусом awaiting: их ещё нет в сверке, но они уже «в пути».
 */

export type FinanceEntry = Pick<
  SettlementEntry,
  "id" | "entry_date" | "category" | "direction" | "amount_kopecks" | "title" | "basis" | "response"
> & { group: "income" | "tax" | "fee" | "expense" };

export type ExpectedIncome = {
  doc_number: string | null;
  title: string;
  doc_date: string | null;
  amount_kopecks: number;
  tags: string | null;
};

export type PortalFinance = {
  accountName: string;
  note: string | null;
  taxPercent: number;
  feePercent: number;
  incomeKopecks: number;
  expenseKopecks: number;
  taxKopecks: number;
  feeKopecks: number;
  balanceKopecks: number;
  confirmedBalanceKopecks: number;
  needsCheckCount: number;
  lastEntryDate: string | null;
  personal: { inKopecks: number; outKopecks: number; balanceKopecks: number } | null;
  expected: ExpectedIncome[];
  expectedKopecks: number;
  /** Сколько останется от ожидаемого после налога и комиссии */
  expectedNetKopecks: number;
  pending: { entry_date: string; direction: string; amount_kopecks: number | null; title: string }[];
  entries: FinanceEntry[];
};

const groupOf = (e: SettlementEntry): FinanceEntry["group"] => {
  if (e.direction === "in") return "income";
  const t = e.title.trim().toLowerCase();
  if (t.startsWith("налог")) return "tax";
  if (t.startsWith("комиссия")) return "fee";
  return "expense";
};

export function getPortalFinance(contractorId: number): PortalFinance | null {
  const db = getCrmDb();
  const link = db.prepare(`SELECT settlement_account_id FROM contractors WHERE id = ?`).get(contractorId) as
    | { settlement_account_id: number | null }
    | undefined;
  if (!link?.settlement_account_id) return null;
  const account = getAccount(link.settlement_account_id);
  if (!account) return null;

  const all = getEntries(account.id);
  const business = all.filter((e) => e.category === "business");
  const personalEntries = all.filter((e) => e.category === "personal");

  let income = 0, expense = 0, tax = 0, fee = 0, needsCheck = 0;
  for (const e of business) {
    if (e.basis === "needs_check" && e.response !== "agreed") needsCheck++;
    if (e.amount_kopecks == null || e.response === "disputed") continue;
    const g = groupOf(e);
    if (g === "income") income += e.amount_kopecks;
    else if (g === "tax") tax += e.amount_kopecks;
    else if (g === "fee") fee += e.amount_kopecks;
    else expense += e.amount_kopecks;
  }
  const bal = computeBalance(all, "business");
  const pBal = personalEntries.length ? computeBalance(all, "personal") : null;

  // docx и pdf одного счёта — один счёт: схлопываем по номеру
  const docs = db
    .prepare(
      `SELECT doc_number, title, doc_date, amount_kopecks, tags FROM archive_documents
       WHERE contractor_id = ? AND status = 'awaiting' AND amount_kopecks IS NOT NULL
       ORDER BY doc_date`,
    )
    .all(contractorId) as ExpectedIncome[];
  const seen = new Set<string>();
  const expected = docs.filter((d) => {
    const key = d.doc_number || d.title;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).map((d) => ({ ...d, title: d.title.replace(/\s*\((товары|ред\.[^)]*)\)\s*$/, "") }));
  const expectedSum = expected.reduce((s, d) => s + d.amount_kopecks, 0);
  const taxP = account.tax_percent || 0;
  const feeP = account.fee_percent || 0;

  return {
    accountName: account.name,
    note: account.note,
    taxPercent: taxP,
    feePercent: feeP,
    incomeKopecks: income,
    expenseKopecks: expense,
    taxKopecks: tax,
    feeKopecks: fee,
    balanceKopecks: bal.balanceKopecks,
    confirmedBalanceKopecks: bal.confirmedBalanceKopecks,
    needsCheckCount: needsCheck,
    lastEntryDate: all.length ? all[all.length - 1].entry_date : null,
    personal: pBal ? { inKopecks: pBal.inKopecks, outKopecks: pBal.outKopecks, balanceKopecks: pBal.balanceKopecks } : null,
    expected,
    expectedKopecks: expectedSum,
    expectedNetKopecks: Math.round(expectedSum * (1 - (taxP + feeP) / 100)),
    pending: listProposals(account.id).map((p) => ({
      entry_date: p.entry_date, direction: p.direction, amount_kopecks: p.amount_kopecks, title: p.title,
    })),
    entries: all
      .map((e) => ({
        id: e.id, entry_date: e.entry_date, category: e.category, direction: e.direction,
        amount_kopecks: e.amount_kopecks, title: e.title, basis: e.basis, response: e.response, group: groupOf(e),
      }))
      .reverse(),
  };
}
