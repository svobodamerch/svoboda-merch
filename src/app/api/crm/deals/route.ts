import { NextRequest, NextResponse } from "next/server";
import { createDeal, getPipeline, getDeals, type DealStage } from "@/lib/crm/sales";
import { toKopecks } from "@/lib/crm/format";
import { getCurrentActor } from "@/lib/crm/current-user";

export async function GET() {
  return NextResponse.json({ pipeline: getPipeline(), all: getDeals() });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const title = String(body.title || "").trim();
  if (!title) {
    return NextResponse.json({ error: "Нужно название сделки" }, { status: 400 });
  }

  const deal = createDeal(
    {
      contractor_id: body.contractorId ? Number(body.contractorId) : undefined,
      title,
      stage: (body.stage as DealStage) || undefined,
      amount_kopecks: body.amount ? toKopecks(body.amount) : 0,
      expected_close_date: String(body.expectedCloseDate || "").trim() || undefined,
      next_action: String(body.nextAction || "").trim() || undefined,
    },
    await getCurrentActor(),
  );

  return NextResponse.json({ deal });
}
