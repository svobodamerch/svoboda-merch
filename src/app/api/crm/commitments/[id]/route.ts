import { NextRequest, NextResponse } from "next/server";
import { completeCommitment, deleteCommitment } from "@/lib/crm/sales";

export async function PATCH(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  completeCommitment(Number((await params).id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  deleteCommitment(Number((await params).id));
  return NextResponse.json({ ok: true });
}
