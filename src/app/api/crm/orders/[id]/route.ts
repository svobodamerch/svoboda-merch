import { NextRequest, NextResponse } from "next/server";
import {
  getActivity,
  getOrderById,
  getPaymentsByOrder,
  updateOrderStatus,
  updateOrderNotes,
  type OrderStatus,
} from "@/lib/crm/db";
import { getCurrentActor } from "@/lib/crm/current-user";

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
  });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const order = getOrderById(id);
  if (!order) {
    return NextResponse.json({ error: "Не найден" }, { status: 404 });
  }

  const body = await request.json();
  const status = body.status as OrderStatus | undefined;
  if (status) {
    const actor = await getCurrentActor();
    updateOrderStatus(id, status, actor);
  }
  if (typeof body.notes === "string") {
    updateOrderNotes(id, body.notes.trim());
  }

  return NextResponse.json({ order: getOrderById(id) });
}
