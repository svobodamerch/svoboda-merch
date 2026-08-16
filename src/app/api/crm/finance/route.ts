import { NextResponse } from "next/server";
import { getPaymentsByMonth, getExpensesByCategory } from "@/lib/crm/db";
import { getMoneyTrekerData } from "@/lib/moneyTreker";

/** P&L: сделки CRM (свои платежи) + бизнес-доходы/расходы из Money Treker, по месяцам */
export async function GET() {
  const crmByMonth = getPaymentsByMonth();
  const mt = getMoneyTrekerData();

  const months = new Set<string>();
  crmByMonth.forEach((r) => months.add(r.month));
  mt.byMonth.forEach((r) => months.add(r.month));

  const rows = [...months].sort().map((month) => {
    const crmIn = crmByMonth.find((r) => r.month === month && r.direction === "in")?.total_kopecks ?? 0;
    const crmOut = crmByMonth.find((r) => r.month === month && r.direction === "out")?.total_kopecks ?? 0;
    const mtIncomeKopecks = mt.byMonth
      .filter((r) => r.month === month && r.type === "income")
      .reduce((sum, r) => sum + Math.round(r.total * 100), 0);
    const mtExpenseKopecks = mt.byMonth
      .filter((r) => r.month === month && r.type === "expense")
      .reduce((sum, r) => sum + Math.round(r.total * 100), 0);

    const income = crmIn + mtIncomeKopecks;
    const expense = crmOut + mtExpenseKopecks;

    return {
      month,
      crmIncomeKopecks: crmIn,
      crmExpenseKopecks: crmOut,
      mtIncomeKopecks,
      mtExpenseKopecks,
      incomeKopecks: income,
      expenseKopecks: expense,
      netKopecks: income - expense,
    };
  });

  const mtCategories = mt.byMonth.reduce<Record<string, number>>((acc, r) => {
    if (r.type !== "expense") return acc;
    acc[r.category] = (acc[r.category] || 0) + r.total;
    return acc;
  }, {});

  const combined = new Map<string, { totalKopecks: number; kind?: "fixed" | "variable" }>();
  for (const [category, total] of Object.entries(mtCategories)) {
    combined.set(category, { totalKopecks: Math.round(total * 100) });
  }
  for (const c of getExpensesByCategory()) {
    const existing = combined.get(c.category);
    combined.set(c.category, {
      totalKopecks: (existing?.totalKopecks || 0) + c.total_kopecks,
      kind: c.kind,
    });
  }

  return NextResponse.json({
    months: rows,
    moneyTrekerGeneratedAt: mt.generatedAt,
    expenseCategories: [...combined.entries()]
      .map(([category, v]) => ({ category, totalKopecks: v.totalKopecks, kind: v.kind }))
      .sort((a, b) => b.totalKopecks - a.totalKopecks),
  });
}
