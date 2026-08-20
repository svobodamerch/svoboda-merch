import { getCrmDb, getUnlinkedMtTransactions } from "./db";

/**
 * Разбор расходов.
 *
 * Деление на постоянные и переменные нужно не ради таблицы, а ради одного
 * вопроса: сколько валовой прибыли надо приносить в месяц, чтобы выйти в ноль.
 * Постоянные платятся, даже если заказов нет.
 *
 * Прямые затраты по проектам сюда не входят — они уже учтены в марже проекта.
 * См. docs/domain-model.md.
 */

export type ExpenseLine = {
  categoryId: number | null;
  name: string;
  kind: "fixed" | "variable";
  totalKopecks: number;
  count: number;
  /** Среднее за месяц по периоду — по нему считается точка безубыточности */
  perMonthKopecks: number;
};

export type ExpenseMonth = {
  month: string;
  fixedKopecks: number;
  variableKopecks: number;
  directKopecks: number;
  incomeKopecks: number;
};

export type ExpenseBreakdown = {
  months: number;
  fromDate: string;
  /** Накладные, которые платятся независимо от объёма работы */
  fixed: ExpenseLine[];
  /** Накладные, растущие вместе с оборотом */
  variable: ExpenseLine[];
  fixedTotalKopecks: number;
  variableTotalKopecks: number;
  /** Прямые затраты по проектам — показываем отдельно, в марже они уже учтены */
  directTotalKopecks: number;
  /** Расходы без статьи и без сделки: пока не разнесены, картина неполная */
  unsortedKopecks: number;
  unsortedCount: number;
  /** Сколько постоянных расходов приходится на месяц */
  fixedPerMonthKopecks: number;
  byMonth: ExpenseMonth[];
  /** Ещё не разнесено из трекера — пока это висит, разбор неполный */
  pendingFromTrekerKopecks: number;
  pendingFromTrekerCount: number;
};

function monthsAgoIso(months: number): string {
  const d = new Date(Date.now() + 3 * 60 * 60 * 1000);
  d.setUTCMonth(d.getUTCMonth() - months + 1);
  d.setUTCDate(1);
  return d.toISOString().slice(0, 10);
}

export function getExpenseBreakdown(months = 6): ExpenseBreakdown {
  const db = getCrmDb();
  const fromDate = monthsAgoIso(months);

  // Накладные: есть статья расходов и нет привязки к проекту
  const lines = db
    .prepare(
      `SELECT ec.id AS categoryId, ec.name, ec.kind,
              COALESCE(SUM(p.amount_kopecks), 0) AS totalKopecks,
              COUNT(p.id) AS count
       FROM expense_categories ec
       LEFT JOIN payments p
         ON p.category_id = ec.id AND p.direction = 'out'
        AND p.order_id IS NULL AND date(p.paid_at) >= date(?)
       GROUP BY ec.id
       ORDER BY totalKopecks DESC`,
    )
    .all(fromDate) as Omit<ExpenseLine, "perMonthKopecks">[];

  const withPerMonth: ExpenseLine[] = lines.map((l) => ({
    ...l,
    perMonthKopecks: Math.round(l.totalKopecks / months),
  }));

  const fixed = withPerMonth.filter((l) => l.kind === "fixed");
  const variable = withPerMonth.filter((l) => l.kind === "variable");

  const directTotalKopecks = (
    db
      .prepare(
        `SELECT COALESCE(SUM(amount_kopecks), 0) AS s FROM payments
         WHERE direction = 'out' AND order_id IS NOT NULL AND date(paid_at) >= date(?)`,
      )
      .get(fromDate) as { s: number }
  ).s;

  const unsorted = db
    .prepare(
      `SELECT COALESCE(SUM(amount_kopecks), 0) AS total, COUNT(*) AS count
       FROM payments
       WHERE direction = 'out' AND order_id IS NULL AND category_id IS NULL
         AND date(paid_at) >= date(?)`,
    )
    .get(fromDate) as { total: number; count: number };

  const byMonth = db
    .prepare(
      `SELECT strftime('%Y-%m', p.paid_at) AS month,
              COALESCE(SUM(CASE WHEN p.direction = 'out' AND p.order_id IS NULL
                                 AND ec.kind = 'fixed' THEN p.amount_kopecks END), 0) AS fixedKopecks,
              COALESCE(SUM(CASE WHEN p.direction = 'out' AND p.order_id IS NULL
                                 AND ec.kind = 'variable' THEN p.amount_kopecks END), 0) AS variableKopecks,
              COALESCE(SUM(CASE WHEN p.direction = 'out' AND p.order_id IS NOT NULL
                                THEN p.amount_kopecks END), 0) AS directKopecks,
              COALESCE(SUM(CASE WHEN p.direction = 'in' THEN p.amount_kopecks END), 0) AS incomeKopecks
       FROM payments p
       LEFT JOIN expense_categories ec ON ec.id = p.category_id
       WHERE date(p.paid_at) >= date(?)
       GROUP BY month
       ORDER BY month`,
    )
    .all(fromDate) as ExpenseMonth[];

  const fixedTotalKopecks = fixed.reduce((s, l) => s + l.totalKopecks, 0);

  // Пока операции трекера не разнесены, разбор показывает не все деньги —
  // честнее сказать об этом, чем делать вид, что расходов нет
  const pending = getUnlinkedMtTransactions().filter(
    (t) => t.type === "expense" && t.occurred_at.slice(0, 10) >= fromDate,
  );

  return {
    months,
    fromDate,
    pendingFromTrekerKopecks: pending.reduce((s, t) => s + t.amount_kopecks, 0),
    pendingFromTrekerCount: pending.length,
    fixed,
    variable,
    fixedTotalKopecks,
    variableTotalKopecks: variable.reduce((s, l) => s + l.totalKopecks, 0),
    directTotalKopecks,
    unsortedKopecks: unsorted.total,
    unsortedCount: unsorted.count,
    fixedPerMonthKopecks: Math.round(fixedTotalKopecks / months),
    byMonth,
  };
}
