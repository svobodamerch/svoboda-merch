import { NextRequest, NextResponse } from "next/server";
import { createDocument, getDocuments, type DocType } from "@/lib/crm/db";
import { toKopecks } from "@/lib/crm/format";
import { getCurrentActor } from "@/lib/crm/current-user";

export async function GET(request: NextRequest) {
  const contractorId = request.nextUrl.searchParams.get("contractorId");
  const orderId = request.nextUrl.searchParams.get("orderId");
  const docType = request.nextUrl.searchParams.get("docType") as DocType | null;

  return NextResponse.json({
    documents: getDocuments({
      contractorId: contractorId ? Number(contractorId) : undefined,
      orderId: orderId ? Number(orderId) : undefined,
      docType: docType || undefined,
    }),
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const contractorId = Number(body.contractorId);
  const legalEntityId = Number(body.legalEntityId);
  const items = Array.isArray(body.items) ? body.items : [];

  if (!contractorId || !legalEntityId) {
    return NextResponse.json({ error: "Укажите контрагента и юрлицо" }, { status: 400 });
  }
  if (!items.length) {
    return NextResponse.json({ error: "Добавьте хотя бы одну позицию" }, { status: 400 });
  }

  const actor = await getCurrentActor();
  const doc = createDocument(
    {
      doc_type: (body.docType as DocType) || "invoice",
      legal_entity_id: legalEntityId,
      bank_account_id: body.bankAccountId ? Number(body.bankAccountId) : undefined,
      contractor_id: contractorId,
      order_id: body.orderId ? Number(body.orderId) : undefined,
      basis: String(body.basis || "").trim() || undefined,
      doc_date: String(body.docDate || "").trim() || undefined,
      comment: String(body.comment || "").trim() || undefined,
      items: items.map((i: Record<string, unknown>) => ({
        title: String(i.title || "").trim(),
        quantity: i.quantity != null ? Number(i.quantity) : undefined,
        unit: String(i.unit || "").trim() || undefined,
        unit_price_kopecks: toKopecks((i.unitPrice as string | number) ?? 0),
      })),
    },
    actor,
  );

  return NextResponse.json({ document: doc });
}
