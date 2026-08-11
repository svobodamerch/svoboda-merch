import { NextRequest, NextResponse } from "next/server";
import { createOrder, getOrders, type OrderStatus } from "@/lib/crm/db";
import { toKopecks } from "@/lib/crm/format";
import { getCurrentActor } from "@/lib/crm/current-user";

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status") as OrderStatus | null;
  return NextResponse.json({ orders: getOrders(status || undefined) });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const contractorId = Number(body.contractorId);
  const title = String(body.title || "").trim();
  const amount = toKopecks(body.amount ?? 0);

  if (!contractorId || !title) {
    return NextResponse.json({ error: "Укажите контрагента и название заказа" }, { status: 400 });
  }

  const actor = await getCurrentActor();
  const order = createOrder(
    {
      contractor_id: contractorId,
      title,
      description: String(body.description || "").trim() || undefined,
      amount_kopecks: amount,
      deadline: String(body.deadline || "").trim() || undefined,
      source: "manual",
    },
    actor,
  );

  return NextResponse.json({ order });
}
