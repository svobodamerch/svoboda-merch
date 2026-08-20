import { NextRequest, NextResponse } from "next/server";
import { deleteDuplicatePayment, dismissDuplicate } from "@/lib/crm/ingest";
import { getCurrentActor } from "@/lib/crm/current-user";

/** Решение по паре похожих платежей: удалить дубль или признать разными тратами */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const actor = await getCurrentActor();

  if (body.action === "dismiss") {
    dismissDuplicate(Number(body.paymentA), Number(body.paymentB), actor);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "delete") {
    deleteDuplicatePayment(Number(body.paymentId));
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });
}
