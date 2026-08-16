import { NextRequest, NextResponse } from "next/server";
import { deleteExpenseCategory } from "@/lib/crm/db";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  deleteExpenseCategory(id);
  return NextResponse.json({ ok: true });
}
