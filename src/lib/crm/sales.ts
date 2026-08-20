import { createOrder, getCrmDb, logActivity } from "./db";
import type { DealStage, CommitmentSide, CommitmentStatus } from "./sales-types";
import { DEFAULT_PROBABILITY, OPEN_STAGES } from "./sales-types";

export * from "./sales-types";

/**
 * Воронка продаж и обещания.
 *
 * Сделка — обещание будущей выручки, проект — единица исполнения. Взвешенную
 * воронку нельзя складывать с прогнозом прибыли по проектам: одно основано
 * на вероятности, другое на договорённостях. См. docs/domain-model.md.
 */

export type Deal = {
  id: number;
  contractor_id: number | null;
  contractor_name: string | null;
  title: string;
  stage: DealStage;
  amount_kopecks: number;
  probability: number;
  expected_close_date: string | null;
  next_action: string | null;
  lost_reason: string | null;
  order_id: number | null;
  notes: string | null;
  created_at: string;
  closed_at: string | null;
};

const DEAL_SELECT = `
  SELECT d.*, c.name AS contractor_name
  FROM deals d
  LEFT JOIN contractors c ON c.id = d.contractor_id
`;

export function getDeals(): Deal[] {
  const db = getCrmDb();
  return db
    .prepare(`${DEAL_SELECT} ORDER BY d.expected_close_date IS NULL, d.expected_close_date, d.id DESC`)
    .all() as Deal[];
}

export function getDealById(id: number): Deal | undefined {
  const db = getCrmDb();
  return db.prepare(`${DEAL_SELECT} WHERE d.id = ?`).get(id) as Deal | undefined;
}

export type DealInput = {
  contractor_id?: number;
  title: string;
  stage?: DealStage;
  amount_kopecks?: number;
  probability?: number;
  expected_close_date?: string;
  next_action?: string;
  notes?: string;
};

export function createDeal(input: DealInput, actor?: string): Deal {
  const db = getCrmDb();
  const stage = input.stage || "new";
  const row = db
    .prepare(
      `INSERT INTO deals (contractor_id, title, stage, amount_kopecks, probability,
                          expected_close_date, next_action, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING id`,
    )
    .get(
      input.contractor_id || null,
      input.title,
      stage,
      input.amount_kopecks ?? 0,
      input.probability ?? DEFAULT_PROBABILITY[stage],
      input.expected_close_date || null,
      input.next_action || null,
      input.notes || null,
      actor || null,
    ) as { id: number };

  if (input.contractor_id) {
    logActivity("contractor", input.contractor_id, "deal_created", `Новая сделка «${input.title}»`, actor);
  }
  return getDealById(row.id)!;
}

export function updateDeal(id: number, input: Partial<DealInput>, actor?: string): Deal | undefined {
  const db = getCrmDb();
  const current = getDealById(id);
  if (!current) return undefined;

  // Вероятность по умолчанию идёт за стадией, но заданную вручную не перетираем
  const stage = input.stage ?? current.stage;
  const probability =
    input.probability ??
    (input.stage && input.stage !== current.stage ? DEFAULT_PROBABILITY[input.stage] : current.probability);

  db.prepare(
    `UPDATE deals SET
       contractor_id = ?, title = ?, stage = ?, amount_kopecks = ?, probability = ?,
       expected_close_date = ?, next_action = ?, notes = ?, updated_at = datetime('now')
     WHERE id = ?`,
  ).run(
    input.contractor_id ?? current.contractor_id,
    input.title ?? current.title,
    stage,
    input.amount_kopecks ?? current.amount_kopecks,
    probability,
    input.expected_close_date ?? current.expected_close_date,
    input.next_action ?? current.next_action,
    input.notes ?? current.notes,
    id,
  );
  return getDealById(id);
}

/**
 * Выигрыш создаёт проект: до этого момента сделки не было в экономике,
 * а теперь она становится единицей исполнения со своей себестоимостью.
 */
export function winDeal(id: number, actor?: string): { deal: Deal; orderId: number } | undefined {
  const db = getCrmDb();
  const deal = getDealById(id);
  if (!deal) return undefined;
  if (deal.order_id) return { deal, orderId: deal.order_id };
  if (!deal.contractor_id) throw new Error("У сделки не указан клиент — проект не создать");

  const order = createOrder(
    {
      contractor_id: deal.contractor_id,
      title: deal.title,
      amount_kopecks: deal.amount_kopecks,
      deadline: deal.expected_close_date || undefined,
      source: "deal",
    },
    actor,
  );

  db.prepare(
    `UPDATE deals SET stage = 'won', probability = 100, order_id = ?,
                      closed_at = datetime('now'), updated_at = datetime('now')
     WHERE id = ?`,
  ).run(order.id, id);

  return { deal: getDealById(id)!, orderId: order.id };
}

export function loseDeal(id: number, reason: string, actor?: string): Deal | undefined {
  const db = getCrmDb();
  db.prepare(
    `UPDATE deals SET stage = 'lost', probability = 0, lost_reason = ?,
                      closed_at = datetime('now'), updated_at = datetime('now')
     WHERE id = ?`,
  ).run(reason || null, id);
  const deal = getDealById(id);
  if (deal?.contractor_id) {
    logActivity("contractor", deal.contractor_id, "deal_lost", `Сделка «${deal.title}» проиграна: ${reason}`, actor);
  }
  return deal;
}

export function deleteDeal(id: number): void {
  const db = getCrmDb();
  db.prepare(`DELETE FROM deals WHERE id = ?`).run(id);
}

export type Pipeline = {
  deals: Deal[];
  /** Сумма открытых сделок как есть */
  totalKopecks: number;
  /** С поправкой на вероятность — этим нельзя платить по счетам, но планировать можно */
  weightedKopecks: number;
  closingThisMonthKopecks: number;
};

export function getPipeline(): Pipeline {
  const deals = getDeals().filter((d) => OPEN_STAGES.includes(d.stage));
  const monthPrefix = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 7);

  return {
    deals,
    totalKopecks: deals.reduce((s, d) => s + d.amount_kopecks, 0),
    weightedKopecks: deals.reduce((s, d) => s + Math.round((d.amount_kopecks * d.probability) / 100), 0),
    closingThisMonthKopecks: deals
      .filter((d) => d.expected_close_date?.startsWith(monthPrefix))
      .reduce((s, d) => s + d.amount_kopecks, 0),
  };
}

// ---------- Обещания ----------

export type Commitment = {
  id: number;
  title: string;
  side: CommitmentSide;
  status: CommitmentStatus;
  due_date: string | null;
  contractor_id: number | null;
  contractor_name: string | null;
  order_id: number | null;
  order_title: string | null;
  deal_id: number | null;
  note: string | null;
  created_at: string;
  done_at: string | null;
};

const COMMITMENT_SELECT = `
  SELECT cm.*, c.name AS contractor_name, o.title AS order_title
  FROM commitments cm
  LEFT JOIN contractors c ON c.id = cm.contractor_id
  LEFT JOIN orders o ON o.id = cm.order_id
`;

export function getCommitments(status?: CommitmentStatus): Commitment[] {
  const db = getCrmDb();
  const where = status ? `WHERE cm.status = '${status === "open" ? "open" : "done"}'` : "";
  return db
    .prepare(`${COMMITMENT_SELECT} ${where} ORDER BY cm.due_date IS NULL, cm.due_date, cm.id DESC`)
    .all() as Commitment[];
}

export type CommitmentInput = {
  title: string;
  side?: CommitmentSide;
  due_date?: string;
  contractor_id?: number;
  order_id?: number;
  deal_id?: number;
  note?: string;
};

export function createCommitment(input: CommitmentInput, actor?: string): Commitment {
  const db = getCrmDb();
  const row = db
    .prepare(
      `INSERT INTO commitments (title, side, due_date, contractor_id, order_id, deal_id, note, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
    )
    .get(
      input.title,
      input.side || "we",
      input.due_date || null,
      input.contractor_id || null,
      input.order_id || null,
      input.deal_id || null,
      input.note || null,
      actor || null,
    ) as { id: number };

  return db.prepare(`${COMMITMENT_SELECT} WHERE cm.id = ?`).get(row.id) as Commitment;
}

export function completeCommitment(id: number): void {
  const db = getCrmDb();
  db.prepare(`UPDATE commitments SET status = 'done', done_at = datetime('now') WHERE id = ?`).run(id);
}

export function deleteCommitment(id: number): void {
  const db = getCrmDb();
  db.prepare(`DELETE FROM commitments WHERE id = ?`).run(id);
}

/** Просроченные и сегодняшние обещания — то, из-за чего теряют доверие */
export function getDueCommitments(): Commitment[] {
  const today = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return getCommitments("open").filter((c) => c.due_date !== null && c.due_date <= today);
}
