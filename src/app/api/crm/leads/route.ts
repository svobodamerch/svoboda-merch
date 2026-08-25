import { NextRequest, NextResponse } from "next/server";
import { getLeads, type LeadStatus } from "@/lib/db";

/** Заявки с сайта — под /api/crm, поэтому доступны только с активной сессией */
export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status") as LeadStatus | null;
  return NextResponse.json({ leads: getLeads(status || undefined) });
}
