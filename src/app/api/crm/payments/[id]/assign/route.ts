import { NextRequest, NextResponse } from "next/server";
import { assignPaymentToOrder } from "@/lib/crm/db";
import { getCurrentActor } from "@/lib/crm/current-user";

/** Разнести «висящий» платёж по сделке */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const body = await request.json();
  const orderId = Number(body.orderId);
  if (!orderId) {
    return NextResponse.json({ error: "Укажите сделку" }, { status: 400 });
  }

  const actor = await getCurrentActor();
  assignPaymentToOrder(id, orderId, actor);
  return NextResponse.json({ ok: true });
}
