import { NextResponse } from "next/server";
import { getDebts, getMonthRevenueKopecks, getRecentActivity } from "@/lib/crm/db";

export async function GET() {
  return NextResponse.json({
    monthRevenueKopecks: getMonthRevenueKopecks(),
    debts: getDebts(),
    activity: getRecentActivity(30),
  });
}
