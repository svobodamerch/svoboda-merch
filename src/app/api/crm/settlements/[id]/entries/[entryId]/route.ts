import { NextRequest, NextResponse } from "next/server";
import { toKopecks } from "@/lib/crm/format";
import { deleteEntry, updateEntry } from "@/lib/crm/settlements";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; entryId: string }> }) {
  const { entryId } = await params;
  const body = await request.json();
  const amountRaw = body.amount === undefined ? undefined : String(body.amount).trim();
  updateEntry(Number(entryId), {
    entry_date: body.date,
    category: body.category,
    direction: body.direction,
    amount_kopecks: amountRaw === undefined ? undefined : amountRaw ? toKopecks(amountRaw) : null,
    title: body.title,
    evidence: body.evidence,
    basis: body.basis,
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string; entryId: string }> }) {
  deleteEntry(Number((await params).entryId));
  return NextResponse.json({ ok: true });
}
