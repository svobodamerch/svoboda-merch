import { NextRequest, NextResponse } from "next/server";
import {
  getActivity,
  getOrderById,
  getOrderTax,
  getPaymentsByOrder,
  updateOrderLegalEntity,
  updateOrderStatus,
  updateOrderNotes,
  type OrderStatus,
} from "@/lib/crm/db";
import { getCurrentActor } from "@/lib/crm/current-user";
import { getProjectFinancials } from "@/lib/crm/finance";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const order = getOrderById(id);
  if (!order) {
    return NextResponse.json({ error: "Не найден" }, { status: 404 });
  }

  return NextResponse.json({
    order,
    payments: getPaymentsByOrder(id),
    activity: getActivity("order", id),
    tax: getOrderTax(id),
    financials: getProjectFinancials(id),
  });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const order = getOrderById(id);
  if (!order) {
    return NextResponse.json({ error: "Не найден" }, { status: 404 });
  }

  const body = await request.json();
  const actor = await getCurrentActor();

  const status = body.status as OrderStatus | undefined;
  if (status) {
    updateOrderStatus(id, status, actor);
  }
  if (typeof body.notes === "string") {
    updateOrderNotes(id, body.notes.trim());
  }
  if (body.legalEntityId) {
    updateOrderLegalEntity(id, Number(body.legalEntityId), actor);
  }

  return NextResponse.json({ order: getOrderById(id), tax: getOrderTax(id) });
}
