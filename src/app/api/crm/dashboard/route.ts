import { NextResponse } from "next/server";
import {
  getActiveDealsSummary,
  getMonthCostKopecks,
  getMonthRevenueKopecks,
  getRecentActivity,
  getTodayAndOverdueTasks,
} from "@/lib/crm/db";
import { getDebtsByRole } from "@/lib/crm/reconciliation";
import { getOwnerDashboard } from "@/lib/crm/dashboard";

export async function GET() {
  return NextResponse.json({
    owner: getOwnerDashboard(),
    monthRevenueKopecks: getMonthRevenueKopecks(),
    monthCostKopecks: getMonthCostKopecks(),
    activeDeals: getActiveDealsSummary(),
    debts: getDebtsByRole(),
    tasks: getTodayAndOverdueTasks(),
    activity: getRecentActivity(30),
  });
}
