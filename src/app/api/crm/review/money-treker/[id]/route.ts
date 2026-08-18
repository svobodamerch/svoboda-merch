import { NextRequest, NextResponse } from "next/server";
import { dismissMtTransaction, linkMtTransaction } from "@/lib/crm/db";
import { getCurrentActor } from "@/lib/crm/current-user";

/** Разнести операцию Money Treker в CRM (создаёт платёж) или скрыть её без разноски */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const actor = await getCurrentActor();

  if (body.dismiss) {
    dismissMtTransaction(id, actor);
    return NextResponse.json({ ok: true });
  }

  const payment = linkMtTransaction(
    id,
    {
      contractorId: body.contractorId ? Number(body.contractorId) : undefined,
      orderId: body.orderId ? Number(body.orderId) : undefined,
      categoryId: body.categoryId ? Number(body.categoryId) : undefined,
      comment: body.comment,
    },
    actor,
  );

  if (!payment) {
    return NextResponse.json({ error: "Операция не найдена или уже разнесена" }, { status: 400 });
  }
  return NextResponse.json({ payment });
}
