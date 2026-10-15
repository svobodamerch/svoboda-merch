import { randomBytes } from "node:crypto";
import { getCrmDb } from "./db";

export type SettlementCategory = "business" | "personal";
export type SettlementDirection = "in" | "out";

export type SettlementEntry = {
  id: number;
  account_id: number;
  entry_date: string;
  category: SettlementCategory;
  /** out — контрагент заплатил или перевёл; in — деньги пришли к нему или мы ему перевели */
  direction: SettlementDirection;
  amount_kopecks: number | null;
  title: string;
  source: string | null;
  evidence: string | null;
  basis: "confirmed_in_chat" | "needs_check";
  origin: "us" | "them";
  response: "agreed" | "disputed" | null;
  response_comment: string | null;
  responded_at: string | null;
  created_at: string;
};

export type SettlementAccount = { id: number; name: string; token: string; note: string | null; created_at: string };

export type SettlementBalance = {
  inKopecks: number;
  outKopecks: number;
  /** in − out: плюс — у контрагента остались наши деньги, минус — мы ему должны */
  balanceKopecks: number;
  /** Остаток только по строкам, которые подтверждены перепиской или самим контрагентом */
  confirmedBalanceKopecks: number;
  withoutAmount: number;
};

export function computeBalance(entries: SettlementEntry[], category: SettlementCategory): SettlementBalance {
  let inK = 0;
  let outK = 0;
  let confirmed = 0;
  let withoutAmount = 0;
  for (const e of entries) {
    if (e.category !== category) continue;
    if (e.amount_kopecks == null) {
      withoutAmount++;
      continue;
    }
    // спорные строки в остаток не входят, пока стороны не договорились
    if (e.response === "disputed") continue;
    const signed = e.direction === "in" ? e.amount_kopecks : -e.amount_kopecks;
    if (e.direction === "in") inK += e.amount_kopecks;
    else outK += e.amount_kopecks;
    if (e.basis === "confirmed_in_chat" || e.response === "agreed") confirmed += signed;
  }
  return { inKopecks: inK, outKopecks: outK, balanceKopecks: inK - outK, confirmedBalanceKopecks: confirmed, withoutAmount };
}

export function createAccount(name: string, note?: string): SettlementAccount {
  const token = randomBytes(16).toString("hex");
  return getCrmDb()
    .prepare(`INSERT INTO settlement_accounts (name, token, note) VALUES (?, ?, ?) RETURNING *`)
    .get(name, token, note || null) as SettlementAccount;
}

export function listAccounts(): (SettlementAccount & { entries: number; disputed: number; unanswered: number })[] {
  return getCrmDb()
    .prepare(
      `SELECT a.*,
         (SELECT COUNT(*) FROM settlement_entries e WHERE e.account_id = a.id) AS entries,
         (SELECT COUNT(*) FROM settlement_entries e WHERE e.account_id = a.id AND e.response = 'disputed') AS disputed,
         (SELECT COUNT(*) FROM settlement_entries e WHERE e.account_id = a.id AND e.response IS NULL) AS unanswered
       FROM settlement_accounts a ORDER BY a.id DESC`,
    )
    .all() as (SettlementAccount & { entries: number; disputed: number; unanswered: number })[];
}

export function getAccount(id: number): SettlementAccount | undefined {
  return getCrmDb().prepare(`SELECT * FROM settlement_accounts WHERE id = ?`).get(id) as SettlementAccount | undefined;
}

export function getAccountByToken(token: string): SettlementAccount | undefined {
  if (!/^[0-9a-f]{32}$/.test(token)) return undefined;
  return getCrmDb().prepare(`SELECT * FROM settlement_accounts WHERE token = ?`).get(token) as SettlementAccount | undefined;
}

export function rotateToken(id: number): string {
  const token = randomBytes(16).toString("hex");
  getCrmDb().prepare(`UPDATE settlement_accounts SET token = ? WHERE id = ?`).run(token, id);
  return token;
}

export function getEntries(accountId: number): SettlementEntry[] {
  return getCrmDb()
    .prepare(`SELECT * FROM settlement_entries WHERE account_id = ? ORDER BY entry_date, id`)
    .all(accountId) as SettlementEntry[];
}

export type EntryInput = {
  entry_date: string;
  category: SettlementCategory;
  direction: SettlementDirection;
  amount_kopecks?: number | null;
  title: string;
  source?: string;
  evidence?: string;
  basis?: "confirmed_in_chat" | "needs_check";
};

export function addEntry(accountId: number, input: EntryInput, origin: "us" | "them" = "us"): SettlementEntry {
  return getCrmDb()
    .prepare(
      `INSERT INTO settlement_entries
         (account_id, entry_date, category, direction, amount_kopecks, title, source, evidence, basis, origin)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
    )
    .get(
      accountId, input.entry_date, input.category, input.direction, input.amount_kopecks ?? null,
      input.title.slice(0, 500), input.source || null, input.evidence?.slice(0, 1000) || null,
      input.basis || "needs_check", origin,
    ) as SettlementEntry;
}

export function updateEntry(id: number, patch: Partial<EntryInput>): void {
  const cols: string[] = [];
  const vals: unknown[] = [];
  const map: Record<string, unknown> = {
    entry_date: patch.entry_date, category: patch.category, direction: patch.direction,
    amount_kopecks: patch.amount_kopecks, title: patch.title, evidence: patch.evidence, basis: patch.basis,
  };
  for (const [k, v] of Object.entries(map)) {
    if (v !== undefined) {
      cols.push(`${k} = ?`);
      vals.push(v);
    }
  }
  if (!cols.length) return;
  // правка нашей стороны сбрасывает ответ: контрагент должен увидеть новую версию
  cols.push("response = NULL", "response_comment = NULL", "responded_at = NULL");
  getCrmDb().prepare(`UPDATE settlement_entries SET ${cols.join(", ")} WHERE id = ?`).run(...vals, id);
}

export function deleteEntry(id: number): void {
  getCrmDb().prepare(`DELETE FROM settlement_entries WHERE id = ?`).run(id);
}

export function respondToEntry(accountId: number, entryId: number, response: "agreed" | "disputed", comment: string): boolean {
  const res = getCrmDb()
    .prepare(
      `UPDATE settlement_entries SET response = ?, response_comment = ?, responded_at = datetime('now')
       WHERE id = ? AND account_id = ?`,
    )
    .run(response, comment.slice(0, 1000) || null, entryId, accountId);
  return res.changes > 0;
}
