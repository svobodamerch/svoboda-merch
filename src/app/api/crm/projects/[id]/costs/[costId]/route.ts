import { NextRequest, NextResponse } from "next/server";
import { deleteProjectCost } from "@/lib/crm/db";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ costId: string }> }) {
  const { costId } = await params;
  deleteProjectCost(Number(costId));
  return NextResponse.json({ ok: true });
}
