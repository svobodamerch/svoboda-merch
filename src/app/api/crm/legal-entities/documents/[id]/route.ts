import { NextRequest, NextResponse } from "next/server";
import { deleteLegalEntityDocument, setLegalEntityDocumentStatus } from "@/lib/crm/db";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const body = await request.json();
  setLegalEntityDocumentStatus(id, body.status === "done" ? "done" : "open");
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  deleteLegalEntityDocument(Number((await params).id));
  return NextResponse.json({ ok: true });
}
