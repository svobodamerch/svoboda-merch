import { NextRequest, NextResponse } from "next/server";
import { getPortalFinance } from "@/lib/crm/portal-finance";
import { authPortal } from "@/lib/crm/portal-tasks";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const auth = authPortal(request, (await params).slug);
  if (auth.error) return auth.error;
  return NextResponse.json({ finance: getPortalFinance(auth.contractor.id) });
}
