import { NextRequest, NextResponse } from "next/server";
import {
  getBankAccounts,
  getLegalEntity,
  getLegalEntityActivity,
  getLegalEntityDocuments,
} from "@/lib/crm/db";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const entity = getLegalEntity(id);
  if (!entity) return NextResponse.json({ error: "Не найдено" }, { status: 404 });

  return NextResponse.json({
    entity,
    bankAccounts: getBankAccounts(id),
    documents: getLegalEntityDocuments(id),
    activity: getLegalEntityActivity(id),
  });
}
