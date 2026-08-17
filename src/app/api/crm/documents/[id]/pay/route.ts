import { NextRequest, NextResponse } from "next/server";
import { payDocument, type PaymentMethod } from "@/lib/crm/db";
import { getCurrentActor } from "@/lib/crm/current-user";

/** Отметить счёт оплаченным — платёж создаётся автоматически и связывается с документом */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const body = await request.json().catch(() => ({}));
  const actor = await getCurrentActor();

  const doc = payDocument(
    id,
    { method: (body.method as PaymentMethod) || "transfer", paid_at: body.paidAt || undefined },
    actor,
  );

  if (!doc) {
    return NextResponse.json({ error: "Не найден" }, { status: 404 });
  }
  return NextResponse.json({ document: doc });
}
