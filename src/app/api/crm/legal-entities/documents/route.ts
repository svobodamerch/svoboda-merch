import { NextRequest, NextResponse } from "next/server";
import { addLegalEntityDocument } from "@/lib/crm/db";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const legalEntityId = Number(body.legalEntityId);
  const title = String(body.title || "").trim();
  if (!legalEntityId || !title) {
    return NextResponse.json({ error: "Укажите юрлицо и название документа" }, { status: 400 });
  }
  const doc = addLegalEntityDocument(legalEntityId, title, String(body.note || "").trim() || undefined);
  return NextResponse.json({ document: doc });
}
