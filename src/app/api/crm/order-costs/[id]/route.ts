import { NextRequest, NextResponse } from "next/server";
import {
  deleteOrderCost,
  updateOrderCost,
  type CostKind,
  type CostStatus,
} from "@/lib/crm/db";
import { toKopecks } from "@/lib/crm/format";
import { getCurrentActor } from "@/lib/crm/current-user";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const body = await request.json();
  const actor = await getCurrentActor();

  const cost = updateOrderCost(
    id,
    {
      order_item_id: body.orderItemId ? Number(body.orderItemId) : undefined,
      kind: body.kind as CostKind | undefined,
      title: body.title != null ? String(body.title).trim() : undefined,
      contractor_id: body.contractorId ? Number(body.contractorId) : undefined,
      quantity: body.quantity != null ? Number(body.quantity) : undefined,
      unit_cost_kopecks: body.unitCost != null ? toKopecks(body.unitCost) : undefined,
      amount_kopecks: body.amount != null ? toKopecks(body.amount) : undefined,
      supplier_invoice: body.supplierInvoice != null ? String(body.supplierInvoice).trim() : undefined,
      doc_url: body.docUrl != null ? String(body.docUrl).trim() : undefined,
      status: body.status as CostStatus | undefined,
      comment: body.comment != null ? String(body.comment).trim() : undefined,
    },
    actor,
  );

  if (!cost) {
    return NextResponse.json({ error: "Затрата не найдена" }, { status: 404 });
  }
  return NextResponse.json({ cost });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const actor = await getCurrentActor();
  deleteOrderCost(id, actor);
  return NextResponse.json({ ok: true });
}
