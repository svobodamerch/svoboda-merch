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

export type SettlementAccount = {
  id: number;
  name: string;
  token: string;
  note: string | null;
  tax_percent: number | null;
  fee_percent: number | null;
  created_at: string;
};

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

export type ProposalKind = "client_payment" | "supplier_payment" | "personal_transfer" | "fee" | "other";

export type SettlementProposal = {
  id: number;
  account_id: number;
  source_ref: string;
  kind: ProposalKind;
  category: SettlementCategory;
  direction: SettlementDirection;
  amount_kopecks: number | null;
  title: string;
  entry_date: string;
  evidence: string | null;
  from_counterparty: number;
  status: "pending" | "accepted" | "dismissed";
  created_at: string;
};

export type ProposalInput = {
  sourceRef: string;
  kind: ProposalKind;
  category: SettlementCategory;
  direction: SettlementDirection;
  amount?: number | null;
  title: string;
  date: string;
  evidence?: string;
  fromCounterparty?: boolean;
};

export function setRates(accountId: number, taxPercent: number | null, feePercent: number | null): void {
  getCrmDb().prepare(`UPDATE settlement_accounts SET tax_percent = ?, fee_percent = ? WHERE id = ?`).run(taxPercent, feePercent, accountId);
}

export function ingestProposals(accountName: string, items: ProposalInput[]): number {
  const db = getCrmDb();
  const account = db.prepare(`SELECT id FROM settlement_accounts WHERE name = ?`).get(accountName) as { id: number } | undefined;
  if (!account) return 0;
  const insert = db.prepare(
    `INSERT OR IGNORE INTO settlement_proposals
       (account_id, source_ref, kind, category, direction, amount_kopecks, title, entry_date, evidence, from_counterparty)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  let added = 0;
  db.transaction(() => {
    for (const i of items) {
      const title = String(i.title || "").trim().slice(0, 500);
      if (!title || !i.sourceRef || !/^\d{4}-\d{2}-\d{2}$/.test(String(i.date))) continue;
      const amount = i.amount != null && Number.isFinite(Number(i.amount)) && Number(i.amount) > 0 ? Math.round(Number(i.amount) * 100) : null;
      const res = insert.run(
        account.id, String(i.sourceRef).slice(0, 100), i.kind || "other",
        i.category === "personal" ? "personal" : "business", i.direction === "in" ? "in" : "out",
        amount, title, i.date, i.evidence?.slice(0, 1000) || null, i.fromCounterparty ? 1 : 0,
      );
      added += res.changes;
    }
  })();
  return added;
}

export function listProposals(accountId: number): SettlementProposal[] {
  return getCrmDb()
    .prepare(`SELECT * FROM settlement_proposals WHERE account_id = ? AND status = 'pending' ORDER BY entry_date, id`)
    .all(accountId) as SettlementProposal[];
}

const pct = (v: number) => String(v).replace(".", ",");

/** Принять: строка в сверку; приход от клиента сразу порождает налог и комиссию по ставкам счёта */
export function acceptProposal(proposalId: number): number | null {
  const db = getCrmDb();
  const p = db.prepare(`SELECT * FROM settlement_proposals WHERE id = ? AND status = 'pending'`).get(proposalId) as
    | SettlementProposal
    | undefined;
  if (!p) return null;
  const account = getAccount(p.account_id);
  if (!account) return null;
  const evidence = [p.from_counterparty ? "Подтверждено им в переписке" : "Из переписки", p.evidence].filter(Boolean).join(": ");
  db.transaction(() => {
    addEntry(
      p.account_id,
      {
        entry_date: p.entry_date, category: p.category, direction: p.direction, amount_kopecks: p.amount_kopecks,
        title: p.title, source: "tg", evidence, basis: p.from_counterparty ? "confirmed_in_chat" : "needs_check",
      },
      "us",
    );
    if (p.kind === "client_payment" && p.direction === "in" && p.amount_kopecks) {
      const base = p.amount_kopecks;
      if (account.tax_percent) {
        addEntry(p.account_id, {
          entry_date: p.entry_date, category: p.category, direction: "out",
          amount_kopecks: Math.round((base * account.tax_percent) / 100),
          title: `Налог ${pct(account.tax_percent)}% с поступления «${p.title.slice(0, 80)}», удержан`, source: "auto", basis: "needs_check",
        });
      }
      if (account.fee_percent) {
        addEntry(p.account_id, {
          entry_date: p.entry_date, category: p.category, direction: "out",
          amount_kopecks: Math.round((base * account.fee_percent) / 100),
          title: `Комиссия ${pct(account.fee_percent)}% с поступления «${p.title.slice(0, 80)}», удержана`, source: "auto", basis: "needs_check",
        });
      }
    }
    db.prepare(`UPDATE settlement_proposals SET status = 'accepted' WHERE id = ?`).run(proposalId);
  })();
  return p.account_id;
}

export function dismissProposal(proposalId: number): void {
  getCrmDb().prepare(`UPDATE settlement_proposals SET status = 'dismissed' WHERE id = ? AND status = 'pending'`).run(proposalId);
}
