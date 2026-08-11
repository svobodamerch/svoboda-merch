import { NextRequest, NextResponse } from "next/server";
import { createPayment, getPayments, type PaymentDirection, type PaymentMethod } from "@/lib/crm/db";
import { toKopecks } from "@/lib/crm/format";
import { getCurrentActor } from "@/lib/crm/current-user";

export async function GET() {
  return NextResponse.json({ payments: getPayments() });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const contractorId = Number(body.contractorId);
  const direction = body.direction as PaymentDirection;
  const amount = toKopecks(body.amount ?? 0);

  if (!contractorId || (direction !== "in" && direction !== "out") || amount <= 0) {
    return NextResponse.json(
      { error: "Укажите контрагента, направление и сумму больше нуля" },
      { status: 400 },
    );
  }

  const actor = await getCurrentActor();
  const payment = createPayment(
    {
      contractor_id: contractorId,
      order_id: body.orderId ? Number(body.orderId) : undefined,
      direction,
      amount_kopecks: amount,
      method: (body.method as PaymentMethod) || "transfer",
      comment: String(body.comment || "").trim() || undefined,
      source: "manual",
    },
    actor,
  );

  return NextResponse.json({ payment });
}
