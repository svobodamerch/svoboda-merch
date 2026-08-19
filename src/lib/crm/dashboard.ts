import { getCrmDb, getTodayAndOverdueTasks } from "./db";
import { getCashForecast } from "./cash";
import { getProjectFinancials } from "./finance";
import { getAllContractorBalances } from "./reconciliation";

/**
 * Дашборд собственника: отвечает не «сколько у нас контактов», а
 * «насколько всё хорошо и что произойдёт, если ничего не менять».
 *
 * Своей арифметики здесь нет — только сведение того, что уже считают
 * finance.ts, cash.ts и reconciliation.ts. См. docs/domain-model.md.
 */

export type AlertSeverity = "critical" | "warning" | "info";

export type Alert = {
  severity: AlertSeverity;
  title: string;
  href: string | null;
};

export type ProjectHealth = {
  orderId: number;
  title: string;
  deadline: string | null;
  forecastRevenueKopecks: number;
  forecastProfitKopecks: number;
  marginPercent: number | null;
  health: "green" | "yellow" | "red";
  reason: string | null;
};

export type OwnerDashboard = {
  money: {
    currentBalanceKopecks: number;
    balanceKnown: boolean;
    expectedInKopecks: number;
    expectedOutKopecks: number;
    minimumBalanceKopecks: number;
    minimumOnDate: string | null;
    receivableKopecks: number;
    payableKopecks: number;
  };
  profit: {
    forecastRevenueKopecks: number;
    forecastProfitKopecks: number;
    marginPercent: number | null;
  };
  projects: {
    total: number;
    green: number;
    yellow: number;
    red: number;
    list: ProjectHealth[];
  };
  alerts: Alert[];
};

/** Ниже этого порога прогнозная маржа считается тревожной */
const LOW_MARGIN_THRESHOLD = 25;

function todayIso(): string {
  return new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/**
 * Здоровье проекта — детерминированное правило, а не оценка модели.
 * Красный там, где деньги уже потеряны или срок сорван; жёлтый — где
 * цифрам нельзя верить или маржа просела.
 */
function assessHealth(
  fin: ReturnType<typeof getProjectFinancials>,
  deadline: string | null,
): { health: ProjectHealth["health"]; reason: string | null } {
  const margin = fin.forecastMarginPercent;
  const today = todayIso();

  if (margin !== null && margin < 0) {
    return { health: "red", reason: "Прогноз убыточен" };
  }
  if (deadline && deadline < today) {
    return { health: "red", reason: "Срок просрочен" };
  }
  if (fin.warnings.some((w) => w.severity === "critical")) {
    return { health: "red", reason: fin.warnings.find((w) => w.severity === "critical")!.message };
  }
  if (margin !== null && margin < LOW_MARGIN_THRESHOLD) {
    return { health: "yellow", reason: `Маржа ${margin}%` };
  }
  if (fin.warnings.some((w) => w.code === "costs_missing")) {
    return { health: "yellow", reason: "Затраты не заведены" };
  }
  return { health: "green", reason: null };
}

export function getOwnerDashboard(): OwnerDashboard {
  const db = getCrmDb();

  const activeOrders = db
    .prepare(
      `SELECT id, title, deadline FROM orders
       WHERE status NOT IN ('done', 'cancelled') ORDER BY deadline IS NULL, deadline`,
    )
    .all() as { id: number; title: string; deadline: string | null }[];

  const list: ProjectHealth[] = activeOrders.map((o) => {
    const fin = getProjectFinancials(o.id);
    const { health, reason } = assessHealth(fin, o.deadline);
    return {
      orderId: o.id,
      title: o.title,
      deadline: o.deadline,
      forecastRevenueKopecks: fin.revenue.forecastKopecks,
      forecastProfitKopecks: fin.forecastProfitKopecks,
      marginPercent: fin.forecastMarginPercent,
      health,
      reason,
    };
  });

  const forecastRevenue = list.reduce((s, p) => s + p.forecastRevenueKopecks, 0);
  const forecastProfit = list.reduce((s, p) => s + p.forecastProfitKopecks, 0);

  const balances = getAllContractorBalances();
  const receivable = balances
    .filter((b) => b.role === "client" && b.outstandingKopecks > 0)
    .reduce((s, b) => s + b.outstandingKopecks, 0);
  const payable = balances
    .filter((b) => b.role === "supplier" && b.outstandingKopecks > 0)
    .reduce((s, b) => s + b.outstandingKopecks, 0);

  const forecast = getCashForecast([30]);
  const h = forecast.horizons[0];

  const alerts: Alert[] = [];

  // Кассовый разрыв важнее всего: прибыльный бизнес умирает от нехватки денег
  if (forecast.balanceKnown && h.minimumBalanceKopecks < 0) {
    alerts.push({
      severity: "critical",
      title: `Кассовый разрыв ${(-h.minimumBalanceKopecks / 100).toLocaleString("ru-RU")} ₽${
        h.minimumOnDate ? ` — ${new Date(h.minimumOnDate).toLocaleDateString("ru-RU")}` : ""
      }`,
      href: "/admin/crm/cash",
    });
  }
  if (!forecast.balanceKnown) {
    alerts.push({
      severity: "info",
      title: "Остатки на счетах не введены — прогноз кассы неполный",
      href: "/admin/crm/cash",
    });
  }

  for (const b of balances.filter((x) => x.hasDiscrepancy)) {
    alerts.push({
      severity: "warning",
      title: `${b.name}: расхождение ${(b.discrepancyKopecks / 100).toLocaleString("ru-RU")} ₽`,
      href: `/admin/crm/contractors/${b.contractorId}`,
    });
  }

  for (const p of list.filter((x) => x.health === "red")) {
    alerts.push({
      severity: "critical",
      title: `${p.title}: ${p.reason}`,
      href: `/admin/crm/orders/${p.orderId}`,
    });
  }

  const overdueTasks = getTodayAndOverdueTasks().filter(
    (t) => t.due_at && t.due_at.slice(0, 10) < todayIso(),
  );
  if (overdueTasks.length > 0) {
    alerts.push({
      severity: "warning",
      title: `Просроченных задач: ${overdueTasks.length}`,
      href: "/admin/crm/tasks",
    });
  }

  const order: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 };
  alerts.sort((a, b) => order[a.severity] - order[b.severity]);

  return {
    money: {
      currentBalanceKopecks: forecast.currentBalanceKopecks,
      balanceKnown: forecast.balanceKnown,
      expectedInKopecks: h.expectedInKopecks,
      expectedOutKopecks: h.expectedOutKopecks,
      minimumBalanceKopecks: h.minimumBalanceKopecks,
      minimumOnDate: h.minimumOnDate,
      receivableKopecks: receivable,
      payableKopecks: payable,
    },
    profit: {
      forecastRevenueKopecks: forecastRevenue,
      forecastProfitKopecks: forecastProfit,
      marginPercent:
        forecastRevenue > 0 ? Math.round((forecastProfit / forecastRevenue) * 1000) / 10 : null,
    },
    projects: {
      total: list.length,
      green: list.filter((p) => p.health === "green").length,
      yellow: list.filter((p) => p.health === "yellow").length,
      red: list.filter((p) => p.health === "red").length,
      list,
    },
    alerts,
  };
}
