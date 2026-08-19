import { NextResponse } from "next/server";
import {
  getActiveDealsSummary,
  getMonthCostKopecks,
  getMonthRevenueKopecks,
  getRecentActivity,
  getTodayAndOverdueTasks,
} from "@/lib/crm/db";
import { getDebtsByRole } from "@/lib/crm/reconciliation";

export async function GET() {
  return NextResponse.json({
    monthRevenueKopecks: getMonthRevenueKopecks(),
    monthCostKopecks: getMonthCostKopecks(),
    activeDeals: getActiveDealsSummary(),
    debts: getDebtsByRole(),
    tasks: getTodayAndOverdueTasks(),
    activity: getRecentActivity(30),
  });
}
