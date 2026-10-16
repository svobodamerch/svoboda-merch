import { NextRequest, NextResponse } from "next/server";
import { listProposals } from "@/lib/crm/settlements";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return NextResponse.json({ proposals: listProposals(Number((await params).id)) });
}
