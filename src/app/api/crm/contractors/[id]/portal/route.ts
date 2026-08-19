import { NextRequest, NextResponse } from "next/server";
import { ensureContractorPortalSlug, getContractorById } from "@/lib/crm/db";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const contractor = getContractorById(id);
  if (!contractor) {
    return NextResponse.json({ error: "Не найден" }, { status: 404 });
  }
  if (!contractor.phone) {
    return NextResponse.json({ error: "У контрагента не указан телефон — он же пароль портала" }, { status: 400 });
  }

  const slug = ensureContractorPortalSlug(id);
  return NextResponse.json({ slug });
}
