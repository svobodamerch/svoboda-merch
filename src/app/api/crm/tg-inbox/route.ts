import { NextRequest, NextResponse } from "next/server";
import { getTgInbox } from "@/lib/crm/tg-inbox";

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status") || "pending";
  return NextResponse.json({ items: getTgInbox(status) });
}
