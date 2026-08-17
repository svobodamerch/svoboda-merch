import { NextRequest, NextResponse } from "next/server";
import {
  createOrderCost,
  getOrderById,
  getOrderCosts,
  getOrderEconomics,
  type CostKind,
  type CostStatus,
} from "@/lib/crm/db";
import { toKopecks } from "@/lib/crm/format";
import { getCurrentActor } from "@/lib/crm/current-user";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const orderId = Number((await params).id);
  return NextResponse.json({
    costs: getOrderCosts(orderId),
    economics: getOrderEconomics(orderId),
  });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const orderId = Number((await params).id);
  if (!getOrderById(orderId)) {
    return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
  }

  const body = await request.json();
  const title = String(body.title || "").trim();
  if (!title) {
    return NextResponse.json({ error: "Укажите, за что затрата" }, { status: 400 });
  }

  const actor = await getCurrentActor();
  const cost = createOrderCost(
    {
      order_id: orderId,
      order_item_id: body.orderItemId ? Number(body.orderItemId) : undefined,
      kind: (body.kind as CostKind) || "material",
      title,
      contractor_id: body.contractorId ? Number(body.contractorId) : undefined,
      quantity: body.quantity != null ? Number(body.quantity) : undefined,
      unit: String(body.unit || "").trim() || undefined,
      unit_cost_kopecks: body.unitCost ? toKopecks(body.unitCost) : undefined,
      // Явная сумма побеждает расчёт из количества — для затрат вроде доставки
      amount_kopecks: body.amount ? toKopecks(body.amount) : undefined,
      supplier_invoice: String(body.supplierInvoice || "").trim() || undefined,
      doc_url: String(body.docUrl || "").trim() || undefined,
      status: (body.status as CostStatus) || "planned",
      comment: String(body.comment || "").trim() || undefined,
    },
    actor,
  );

  return NextResponse.json({ cost, economics: getOrderEconomics(orderId) });
}
