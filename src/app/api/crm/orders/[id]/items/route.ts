import { NextRequest, NextResponse } from "next/server";
import { getOrderById, getOrderItems, replaceOrderItems, type OrderItemInput } from "@/lib/crm/db";
import { toKopecks } from "@/lib/crm/format";
import { getCurrentActor } from "@/lib/crm/current-user";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const orderId = Number((await params).id);
  return NextResponse.json({ items: getOrderItems(orderId) });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const orderId = Number((await params).id);
  const order = getOrderById(orderId);
  if (!order) {
    return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
  }

  const body = await request.json();
  const rawItems = Array.isArray(body.items) ? body.items : [];

  const items: OrderItemInput[] = rawItems
    .map((raw: Record<string, unknown>) => ({
      title: String(raw.title || "").trim(),
      description: String(raw.description || "").trim() || undefined,
      quantity: Math.max(1, Number(raw.quantity) || 1),
      unit: String(raw.unit || "шт").trim() || "шт",
      unit_price_kopecks: toKopecks((raw.unitPrice as string | number) ?? 0),
      discount_percent: Math.min(100, Math.max(0, Number(raw.discountPercent) || 0)),
    }))
    .filter((item: OrderItemInput) => item.title);

  const actor = await getCurrentActor();
  const saved = replaceOrderItems(orderId, items, actor);

  return NextResponse.json({ items: saved, order: getOrderById(orderId) });
}
