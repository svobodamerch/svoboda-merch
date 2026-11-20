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
> & {
  group: "income" | "tax" | "fee" | "expense" | "payout";
  /** Деньги Андрея у Юры после этой операции (только бизнес-строки) */
  runningKopecks: number | null;
};

export type ExpectedIncome = {
  doc_number: string | null;
  title: string;
  doc_date: string | null;
  amount_kopecks: number;
  tags: string | null;
  client_name: string | null;
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
  /** Сколько Юра уже отдал Андрею (наличные, переводы) */
  payoutKopecks: number;
  /** Деньги Андрея у Юры: плюс — Юра должен Андрею, минус — Андрей Юре */
  balanceKopecks: number;
  /** Остаток на счёте ИП по последней выписке и его раскладка */
  bank: { balanceKopecks: number; date: string | null; yuraShareKopecks: number } | null;
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
  if (t.startsWith("андрею")) return "payout";
  if (t.startsWith("налог")) return "tax";
  if (t.startsWith("комиссия")) return "fee";
  return "expense";
};

/** Наше юрлицо, которым «владеет» контрагент портала, — по совпадению ИНН */
export function legalEntityIdForContractor(contractorId: number): number | null {
  const row = getCrmDb()
    .prepare(`SELECT le.id FROM legal_entities le JOIN contractors c ON c.inn = le.inn WHERE c.id = ? AND c.inn IS NOT NULL`)
    .get(contractorId) as { id: number } | undefined;
  return row?.id ?? null;
}

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

  let income = 0, expense = 0, tax = 0, fee = 0, payout = 0, needsCheck = 0;
  for (const e of business) {
    if (e.basis === "needs_check" && e.response !== "agreed") needsCheck++;
    if (e.amount_kopecks == null || e.response === "disputed") continue;
    const g = groupOf(e);
    if (g === "income") income += e.amount_kopecks;
    else if (g === "tax") tax += e.amount_kopecks;
    else if (g === "fee") fee += e.amount_kopecks;
    else if (g === "payout") payout += e.amount_kopecks;
    else expense += e.amount_kopecks;
  }
  const bal = computeBalance(all, "business");
  const pBal = personalEntries.length ? computeBalance(all, "personal") : null;

  // Юрлицо контрагента портала (ИП Остапович — наше юрлицо, Юра получает
  // с него процент): ищем по ИНН, отдельной связи не заводим
  const entityId = legalEntityIdForContractor(contractorId);

  // docx и pdf одного счёта — один счёт: схлопываем по номеру
  const docs = db
    .prepare(
      `SELECT a.doc_number, a.title, a.doc_date, a.amount_kopecks, a.tags, c.name AS client_name
       FROM archive_documents a LEFT JOIN contractors c ON c.id = a.contractor_id
       WHERE a.legal_entity_id = ? AND a.status = 'awaiting' AND a.amount_kopecks IS NOT NULL
       ORDER BY a.doc_date`,
    )
    .all(entityId ?? -1) as ExpectedIncome[];
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
    payoutKopecks: payout,
    balanceKopecks: bal.balanceKopecks,
    bank:
      account.bank_balance_kopecks != null
        ? {
            balanceKopecks: account.bank_balance_kopecks,
            date: account.bank_balance_date ?? null,
            yuraShareKopecks: account.bank_balance_kopecks - bal.balanceKopecks,
          }
        : null,
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
    entries: withRunning(all).reverse(),
  };
}

/** Нарастающий остаток денег Андрея по бизнес-строкам — getEntries уже по дате */
function withRunning(all: SettlementEntry[]): FinanceEntry[] {
  let run = 0;
  return all.map((e) => {
    const counts = e.category === "business" && e.amount_kopecks != null && e.response !== "disputed";
    if (counts) run += e.direction === "in" ? e.amount_kopecks! : -e.amount_kopecks!;
    return {
      id: e.id, entry_date: e.entry_date, category: e.category, direction: e.direction,
      amount_kopecks: e.amount_kopecks, title: e.title, basis: e.basis, response: e.response, group: groupOf(e),
      runningKopecks: e.category === "business" ? run : null,
    };
  });
}
