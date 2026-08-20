import { createPayment, getCrmDb } from "./db";
import type { CashKind } from "./cash-types";

/**
 * Приём операций из Money Treker в момент ввода, а не раз в сутки.
 *
 * Операция приходит вместе со своими данными: в суточной выгрузке её ещё нет,
 * поэтому искать её в файле нельзя. Связь запоминается по тому же
 * money_treker_links, что и при ручном разборе, — иначе вечерняя выгрузка
 * предложит разнести её повторно.
 */

export type IncomingMtTransaction = {
  id: string;
  occurred_at: string;
  type: "income" | "expense";
  amount: number;
  comment: string | null;
  category: string | null;
};

export type OrderOption = { id: number; title: string };

export type IngestSuggestion = {
  /** Уже разнесена — второй раз не предлагаем */
  alreadyLinked: boolean;
  suggestedOrder: OrderOption | null;
  suggestedContractorId: number | null;
  /** Почему предложили именно её — чтобы подтверждение было осознанным */
  reason: string | null;
  activeOrders: OrderOption[];
  possibleDuplicate: DuplicateHint | null;
};

export type DuplicateHint = {
  paymentId: number;
  amountKopecks: number;
  paidAt: string;
  comment: string | null;
};

/** Слова короче этого ни о чём не говорят: «и», «за», «на» */
const MIN_KEYWORD = 4;

function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-zа-яё0-9\s]/gi, " ")
    .split(/\s+/)
    .filter((w) => w.length >= MIN_KEYWORD);
}

/**
 * Ищем совпадение по смыслу текста: имя подрядчика или узнаваемое слово
 * из названия сделки («Челябинск», «Кисловодск»). Правила простые и
 * объяснимые — угадывание должно быть предсказуемым.
 */
export function suggestForTransaction(tx: IncomingMtTransaction): IngestSuggestion {
  const db = getCrmDb();

  const alreadyLinked = !!db
    .prepare(`SELECT 1 FROM money_treker_links WHERE mt_transaction_id = ?`)
    .get(tx.id);

  const activeOrders = db
    .prepare(
      `SELECT id, title FROM orders WHERE status NOT IN ('done', 'cancelled')
       ORDER BY deadline IS NULL, deadline`,
    )
    .all() as OrderOption[];

  const haystack = `${tx.comment || ""} ${tx.category || ""}`.toLowerCase();
  const txWords = new Set(words(haystack));

  let suggestedOrder: OrderOption | null = null;
  let suggestedContractorId: number | null = null;
  let reason: string | null = null;

  // 1. Подрядчик или клиент прямо назван в комментарии
  const contractors = db
    .prepare(`SELECT id, name FROM contractors`)
    .all() as { id: number; name: string }[];

  for (const c of contractors) {
    const nameWords = words(c.name);
    if (nameWords.length > 0 && nameWords.some((w) => txWords.has(w))) {
      suggestedContractorId = c.id;
      reason = `в комментарии упомянут «${c.name}»`;
      break;
    }
  }

  // 2. Узнаваемое слово из названия сделки
  for (const o of activeOrders) {
    const titleWords = words(o.title);
    const hit = titleWords.find((w) => txWords.has(w));
    if (hit) {
      suggestedOrder = o;
      reason = reason ? `${reason}, совпало «${hit}»` : `в комментарии совпало «${hit}»`;
      break;
    }
  }

  // 3. Подрядчик найден, и у него ровно одна активная сделка — она и есть
  if (!suggestedOrder && suggestedContractorId) {
    const byContractor = db
      .prepare(
        `SELECT DISTINCT o.id, o.title FROM orders o
         LEFT JOIN order_costs oc ON oc.order_id = o.id
         WHERE o.status NOT IN ('done', 'cancelled')
           AND (o.contractor_id = ? OR oc.contractor_id = ?)`,
      )
      .all(suggestedContractorId, suggestedContractorId) as OrderOption[];
    if (byContractor.length === 1) {
      suggestedOrder = byContractor[0];
      reason = `${reason}, у него одна активная сделка`;
    }
  }

  return {
    alreadyLinked,
    suggestedOrder,
    suggestedContractorId,
    reason,
    activeOrders,
    possibleDuplicate: findDuplicateForAmount(
      Math.round(tx.amount * 100),
      tx.type === "income" ? "in" : "out",
      tx.occurred_at,
    ),
  };
}

/** Та же сумма в ту же сторону в пределах трёх дней — почти наверняка та же трата */
export function findDuplicateForAmount(
  amountKopecks: number,
  direction: "in" | "out",
  occurredAt: string,
): DuplicateHint | null {
  const db = getCrmDb();
  const row = db
    .prepare(
      `SELECT id AS paymentId, amount_kopecks AS amountKopecks, paid_at AS paidAt, comment
       FROM payments
       WHERE amount_kopecks = ? AND direction = ?
         AND ABS(julianday(paid_at) - julianday(?)) <= 3
       ORDER BY ABS(julianday(paid_at) - julianday(?))
       LIMIT 1`,
    )
    .get(amountKopecks, direction, occurredAt, occurredAt) as DuplicateHint | undefined;
  return row ?? null;
}

/**
 * Разнести пришедшую операцию. Данные берём из самой операции, а не из
 * суточной выгрузки — там её ещё нет.
 */
export function ingestMtTransaction(
  tx: IncomingMtTransaction,
  input: { orderId?: number; contractorId?: number; categoryId?: number },
  actor?: string,
) {
  const db = getCrmDb();
  const already = db
    .prepare(`SELECT payment_id FROM money_treker_links WHERE mt_transaction_id = ?`)
    .get(tx.id) as { payment_id: number | null } | undefined;
  if (already) return { payment: null, alreadyLinked: true as const };

  const direction = tx.type === "income" ? "in" : "out";
  // Накладные — только то, что не относится к проекту; расход по сделке
  // накладными называть нельзя, см. docs/domain-model.md
  const kind: CashKind =
    direction === "in"
      ? "client_payment"
      : input.contractorId
        ? "contractor_payment"
        : input.orderId
          ? "project_cost"
          : "overhead";

  const payment = createPayment(
    {
      contractor_id: input.contractorId,
      category_id: input.categoryId,
      order_id: input.orderId,
      direction,
      amount_kopecks: Math.round(tx.amount * 100),
      comment: tx.comment || undefined,
      // дата самой операции, а не «сейчас» — иначе история врёт о движении денег
      paid_at: tx.occurred_at,
      source: "money_treker",
      kind,
    },
    actor,
  );

  db.prepare(
    `INSERT INTO money_treker_links (mt_transaction_id, payment_id, created_by) VALUES (?, ?, ?)`,
  ).run(tx.id, payment.id, actor || null);

  return { payment, alreadyLinked: false as const };
}

export type DuplicateSide = {
  id: number;
  source: string;
  comment: string | null;
  paidAt: string;
  orderTitle: string | null;
};

export type DuplicatePair = {
  a: DuplicateSide;
  b: DuplicateSide;
  amountKopecks: number;
  direction: string;
  /** Платежи привязаны к разным сделкам — чаще всего это просто разные траты */
  differentOrders: boolean;
};

/**
 * Дубли среди уже записанных платежей: одна трата, внесённая и руками в CRM,
 * и через трекер. Совпадение суммы, направления и даты в пределах трёх дней.
 *
 * Пары, про которые уже решили «это разные траты», не показываем повторно.
 */
export function findDuplicatePayments(): DuplicatePair[] {
  const db = getCrmDb();
  return db
    .prepare(
      `SELECT p1.id AS aId, p1.source AS aSource, p1.comment AS aComment, p1.paid_at AS aPaidAt,
              o1.title AS aOrder, p1.order_id AS aOrderId,
              p2.id AS bId, p2.source AS bSource, p2.comment AS bComment, p2.paid_at AS bPaidAt,
              o2.title AS bOrder, p2.order_id AS bOrderId,
              p1.amount_kopecks AS amountKopecks, p1.direction AS direction
       FROM payments p1
       LEFT JOIN orders o1 ON o1.id = p1.order_id
       JOIN payments p2
         ON p2.amount_kopecks = p1.amount_kopecks
        AND p2.direction = p1.direction
        AND p2.id > p1.id
        AND ABS(julianday(p2.paid_at) - julianday(p1.paid_at)) <= 3
       LEFT JOIN orders o2 ON o2.id = p2.order_id
       WHERE NOT EXISTS (
         SELECT 1 FROM duplicate_dismissals d
         WHERE d.payment_a = p1.id AND d.payment_b = p2.id
       )
       ORDER BY p1.paid_at DESC`,
    )
    .all()
    .map((r) => {
      const row = r as Record<string, unknown>;
      return {
        a: {
          id: row.aId as number,
          source: row.aSource as string,
          comment: row.aComment as string | null,
          paidAt: row.aPaidAt as string,
          orderTitle: (row.aOrder as string | null) ?? null,
        },
        b: {
          id: row.bId as number,
          source: row.bSource as string,
          comment: row.bComment as string | null,
          paidAt: row.bPaidAt as string,
          orderTitle: (row.bOrder as string | null) ?? null,
        },
        amountKopecks: row.amountKopecks as number,
        direction: row.direction as string,
        differentOrders:
          row.aOrderId != null && row.bOrderId != null && row.aOrderId !== row.bOrderId,
      };
    });
}

/** «Это разные траты» — запоминаем решение, чтобы пара не всплывала снова */
export function dismissDuplicate(paymentA: number, paymentB: number, actor?: string): void {
  const db = getCrmDb();
  const [a, b] = paymentA < paymentB ? [paymentA, paymentB] : [paymentB, paymentA];
  db.prepare(
    `INSERT OR IGNORE INTO duplicate_dismissals (payment_a, payment_b, created_by) VALUES (?, ?, ?)`,
  ).run(a, b, actor || null);
}

/**
 * Удалить платёж-дубль. Снимаем связь с операцией трекера, иначе она
 * останется помеченной как разнесённая и больше не попадёт в разбор.
 */
export function deleteDuplicatePayment(paymentId: number): void {
  const db = getCrmDb();
  const tx = db.transaction(() => {
    db.prepare(`DELETE FROM money_treker_links WHERE payment_id = ?`).run(paymentId);
    db.prepare(`UPDATE order_costs SET payment_id = NULL WHERE payment_id = ?`).run(paymentId);
    db.prepare(`DELETE FROM payments WHERE id = ?`).run(paymentId);
  });
  tx();
}
