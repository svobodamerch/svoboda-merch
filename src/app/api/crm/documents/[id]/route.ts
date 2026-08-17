import { NextRequest, NextResponse } from "next/server";
import {
  deleteDocument,
  getDocumentById,
  getDocumentItems,
  updateDocument,
  updateDocumentStatus,
  type DocStatus,
} from "@/lib/crm/db";
import { toKopecks } from "@/lib/crm/format";
import { getCurrentActor } from "@/lib/crm/current-user";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const doc = getDocumentById(id);
  if (!doc) {
    return NextResponse.json({ error: "Не найден" }, { status: 404 });
  }
  return NextResponse.json({ document: doc, items: getDocumentItems(id) });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const body = await request.json();
  const actor = await getCurrentActor();

  try {
    if (body.status) {
      const status = body.status as DocStatus;
      const doc = updateDocumentStatus(id, status, actor);
      return NextResponse.json({ document: doc });
    }

    const doc = updateDocument(
      id,
      {
        bank_account_id: body.bankAccountId ? Number(body.bankAccountId) : undefined,
        basis: body.basis != null ? String(body.basis).trim() : undefined,
        comment: body.comment != null ? String(body.comment).trim() : undefined,
        doc_date: body.docDate ? String(body.docDate).trim() : undefined,
        items: Array.isArray(body.items)
          ? body.items.map((i: Record<string, unknown>) => ({
              title: String(i.title || "").trim(),
              quantity: i.quantity != null ? Number(i.quantity) : undefined,
              unit: String(i.unit || "").trim() || undefined,
              unit_price_kopecks: toKopecks((i.unitPrice as string | number) ?? 0),
            }))
          : undefined,
      },
      actor,
    );

    if (!doc) {
      return NextResponse.json({ error: "Не найден" }, { status: 404 });
    }
    return NextResponse.json({ document: doc, items: getDocumentItems(id) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const doc = getDocumentById(id);
  if (doc && doc.status !== "draft") {
    return NextResponse.json({ error: "Удалять можно только черновик" }, { status: 400 });
  }
  deleteDocument(id);
  return NextResponse.json({ ok: true });
}
