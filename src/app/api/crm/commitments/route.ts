import { NextRequest, NextResponse } from "next/server";
import { createCommitment, getCommitments, type CommitmentSide } from "@/lib/crm/sales";
import { getCurrentActor } from "@/lib/crm/current-user";

export async function GET() {
  return NextResponse.json({ commitments: getCommitments("open"), done: getCommitments("done") });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const title = String(body.title || "").trim();
  if (!title) {
    return NextResponse.json({ error: "Нужен текст обещания" }, { status: 400 });
  }

  const commitment = createCommitment(
    {
      title,
      side: (body.side as CommitmentSide) || "we",
      due_date: String(body.dueDate || "").trim() || undefined,
      contractor_id: body.contractorId ? Number(body.contractorId) : undefined,
      order_id: body.orderId ? Number(body.orderId) : undefined,
      note: String(body.note || "").trim() || undefined,
    },
    await getCurrentActor(),
  );

  return NextResponse.json({ commitment });
}
