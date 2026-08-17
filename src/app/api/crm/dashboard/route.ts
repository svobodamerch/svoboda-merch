import { NextResponse } from "next/server";
import {
  getActiveDealsSummary,
  getDebts,
  getMonthCostKopecks,
  getMonthRevenueKopecks,
  getRecentActivity,
} from "@/lib/crm/db";

export async function GET() {
  return NextResponse.json({
    monthRevenueKopecks: getMonthRevenueKopecks(),
    monthCostKopecks: getMonthCostKopecks(),
    activeDeals: getActiveDealsSummary(),
    debts: getDebts(),
    activity: getRecentActivity(30),
  });
}
