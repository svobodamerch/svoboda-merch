import { NextRequest, NextResponse } from "next/server";
import { deleteArchiveDoc, getArchiveDoc, removeArchiveFile, updateArchiveDoc, type ArchiveInput } from "@/lib/crm/archive";
import { parseArchiveFields } from "@/lib/crm/archive-fields";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Ctx) {
  const doc = getArchiveDoc(Number((await params).id));
  if (!doc) return NextResponse.json({ error: "Документ не найден" }, { status: 404 });
  return NextResponse.json({ document: doc });
}

/** Меняются только переданные поля — ассистент может дописать сводку, не трогая остальное */
export async function PATCH(request: NextRequest, { params }: Ctx) {
  const docId = Number((await params).id);
  if (!getArchiveDoc(docId)) return NextResponse.json({ error: "Документ не найден" }, { status: 404 });
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const parsed = parseArchiveFields((k) => body[k]);
  const map: Record<string, keyof ArchiveInput> = {
    kind: "kind", title: "title", docNumber: "doc_number", docDate: "doc_date", amount: "amount_kopecks",
    direction: "direction", status: "status", contractorId: "contractor_id", orderId: "order_id",
    projectId: "project_id", summary: "summary", contentText: "content_text", tags: "tags",
  };
  const patch: Partial<ArchiveInput> = {};
  for (const [bodyKey, col] of Object.entries(map)) {
    if (bodyKey in body) (patch as Record<string, unknown>)[col] = parsed[col];
  }
  if ("title" in patch && !patch.title) delete patch.title;
  return NextResponse.json({ document: updateArchiveDoc(docId, patch) });
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  const doc = getArchiveDoc(Number((await params).id));
  if (!doc) return NextResponse.json({ error: "Документ не найден" }, { status: 404 });
  if (doc.filename) await removeArchiveFile(doc.filename);
  deleteArchiveDoc(doc.id);
  return NextResponse.json({ ok: true });
}
