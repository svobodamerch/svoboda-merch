import { getCrmDb } from "./db";

/**
 * Экономика проекта: план → обязательства → факт → прогноз.
 *
 * Вся арифметика живёт здесь, а не в компонентах — показатели считаются
 * из первичных фактов (начисления, счета, платежи) и нигде не хранятся,
 * иначе они разойдутся с фактами. См. docs/domain-model.md.
 */

export type ProjectCosts = {
  /** Оплачено по факту */
  actualKopecks: number;
  /** Согласовано с подрядчиком, но ещё не оплачено — уже обязательство бизнеса */
  committedKopecks: number;
  /** Предполагаемые затраты, обязательства пока нет */
  plannedKopecks: number;
  /** Чем всё закончится: факт + обязательства + план */
  forecastKopecks: number;
};

export type ProjectRevenue = {
  /** Сколько клиент обязался заплатить */
  contractedKopecks: number;
  /** Сколько официально выставлено счетами */
  invoicedKopecks: number;
  /** Сколько реально пришло */
  receivedKopecks: number;
  /** Сколько ожидаем получить всего */
  forecastKopecks: number;
};

/** Детерминированные предупреждения по проекту. Без AI — простые правила */
export type ProjectWarning = {
  code: "costs_missing" | "overpaid" | "unbilled" | "low_margin" | "payable_open";
  severity: "info" | "warning" | "critical";
  message: string;
};

export type ProjectFinancials = {
  orderId: number;
  revenue: ProjectRevenue;
  costs: ProjectCosts;
  /** Прогнозная прибыль — главный показатель, показывается первым */
  forecastProfitKopecks: number;
  forecastMarginPercent: number | null;
  /** Прибыль по факту денег. На незакрытом проекте вводит в заблуждение */
  actualProfitKopecks: number;
  actualMarginPercent: number | null;
  /** Клиент ещё должен по договорённости: контракт минус полученное */
  receivableKopecks: number;
  /** Работа есть, а счёт не выставлен: контракт минус выставленное */
  unbilledKopecks: number;
  /** Мы должны подрядчикам по этому проекту: начислено минус оплачено им */
  payableKopecks: number;
  warnings: ProjectWarning[];
};

/** Ниже этого порога маржа считается тревожной */
const LOW_MARGIN_THRESHOLD = 25;

/** Маржа не определена, пока нет выручки — ноль здесь врёт сильнее, чем пустота */
function margin(profitKopecks: number, revenueKopecks: number): number | null {
  if (revenueKopecks <= 0) return null;
  return Math.round((profitKopecks / revenueKopecks) * 1000) / 10;
}

export function getProjectFinancials(orderId: number): ProjectFinancials {
  const db = getCrmDb();

  const order = db
    .prepare(`SELECT amount_kopecks, status FROM orders WHERE id = ?`)
    .get(orderId) as { amount_kopecks: number; status: string } | undefined;

  const costRows = db
    .prepare(
      `SELECT status, COALESCE(SUM(amount_kopecks), 0) AS total
       FROM order_costs WHERE order_id = ? GROUP BY status`,
    )
    .all(orderId) as { status: string; total: number }[];

  const byStatus = (s: string) => costRows.find((r) => r.status === s)?.total ?? 0;
  const actualCost = byStatus("paid");
  const committedCost = byStatus("confirmed");
  const plannedCost = byStatus("planned");
  const forecastCost = actualCost + committedCost + plannedCost;

  const invoiced = (
    db
      .prepare(
        `SELECT COALESCE(SUM(total_kopecks), 0) AS s FROM documents
         WHERE order_id = ? AND doc_type = 'invoice' AND status IN ('issued', 'paid')`,
      )
      .get(orderId) as { s: number }
  ).s;

  const received = (
    db
      .prepare(
        `SELECT COALESCE(SUM(amount_kopecks), 0) AS s FROM payments
         WHERE order_id = ? AND direction = 'in'`,
      )
      .get(orderId) as { s: number }
  ).s;

  const paidToContractors = (
    db
      .prepare(
        `SELECT COALESCE(SUM(amount_kopecks), 0) AS s FROM payments
         WHERE order_id = ? AND direction = 'out'`,
      )
      .get(orderId) as { s: number }
  ).s;

  const contracted = order?.amount_kopecks ?? 0;
  // У завершённого проекта выручка больше не прогнозируется — берём то, что есть
  const isClosed = order?.status === "done" || order?.status === "cancelled";
  const forecastRevenue = isClosed ? Math.max(contracted, received) : contracted;

  const forecastProfit = forecastRevenue - forecastCost;
  const actualProfit = received - actualCost;
  const forecastMargin = margin(forecastProfit, forecastRevenue);
  // Начисленное подрядчикам (согласованное и оплаченное) минус реально им перечисленное
  const payable = committedCost + actualCost - paidToContractors;

  const warnings: ProjectWarning[] = [];

  // Маржа без заведённых затрат — не прибыль, а незаполненные данные
  if (contracted > 0 && forecastCost === 0) {
    warnings.push({
      code: "costs_missing",
      severity: "warning",
      message: "Затраты не заведены — маржа недостоверна",
    });
  } else if (forecastMargin !== null && forecastMargin < LOW_MARGIN_THRESHOLD) {
    warnings.push({
      code: "low_margin",
      severity: forecastMargin < 0 ? "critical" : "warning",
      message: `Прогнозная маржа ${forecastMargin}% — ниже порога ${LOW_MARGIN_THRESHOLD}%`,
    });
  }

  if (received > contracted && contracted > 0) {
    warnings.push({
      code: "overpaid",
      severity: "critical",
      message: "Получено больше суммы проекта — платёж не на тот проект или сумма занижена",
    });
  }

  if (contracted > invoiced) {
    warnings.push({
      code: "unbilled",
      severity: invoiced === 0 ? "warning" : "info",
      message: "Есть невыставленная часть — счёт в CRM не заведён",
    });
  }

  if (payable > 0) {
    warnings.push({
      code: "payable_open",
      severity: "info",
      message: "Есть непогашенные обязательства перед подрядчиками",
    });
  }

  return {
    orderId,
    revenue: {
      contractedKopecks: contracted,
      invoicedKopecks: invoiced,
      receivedKopecks: received,
      forecastKopecks: forecastRevenue,
    },
    costs: {
      actualKopecks: actualCost,
      committedKopecks: committedCost,
      plannedKopecks: plannedCost,
      forecastKopecks: forecastCost,
    },
    forecastProfitKopecks: forecastProfit,
    forecastMarginPercent: forecastMargin,
    actualProfitKopecks: actualProfit,
    actualMarginPercent: margin(actualProfit, received),
    receivableKopecks: contracted - received,
    unbilledKopecks: contracted - invoiced,
    payableKopecks: payable,
    warnings,
  };
}
