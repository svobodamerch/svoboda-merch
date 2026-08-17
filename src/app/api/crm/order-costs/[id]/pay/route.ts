import { NextRequest, NextResponse } from "next/server";
import { payOrderCost, getOrderEconomics, type PaymentMethod } from "@/lib/crm/db";
import { getCurrentActor } from "@/lib/crm/current-user";

/** Отметить затрату оплаченной — платёж создаётся автоматически и связывается со строкой */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const body = await request.json().catch(() => ({}));
  const actor = await getCurrentActor();

  const cost = payOrderCost(
    id,
    { method: (body.method as PaymentMethod) || "transfer", paid_at: body.paidAt || undefined },
    actor,
  );

  if (!cost) {
    return NextResponse.json({ error: "Затрата не найдена" }, { status: 404 });
  }
  return NextResponse.json({ cost, economics: getOrderEconomics(cost.order_id) });
}
