import { NextRequest, NextResponse } from "next/server";
import { deleteDeal, getDealById, loseDeal, updateDeal, winDeal, type DealStage } from "@/lib/crm/sales";
import { toKopecks } from "@/lib/crm/format";
import { getCurrentActor } from "@/lib/crm/current-user";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const body = await request.json();
  const actor = await getCurrentActor();

  if (body.action === "win") {
    try {
      const result = winDeal(id, actor);
      if (!result) return NextResponse.json({ error: "Не найдена" }, { status: 404 });
      return NextResponse.json(result);
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 400 });
    }
  }

  if (body.action === "lose") {
    return NextResponse.json({ deal: loseDeal(id, String(body.reason || "").trim(), actor) });
  }

  const deal = updateDeal(
    id,
    {
      stage: (body.stage as DealStage) || undefined,
      title: body.title ? String(body.title).trim() : undefined,
      amount_kopecks: body.amount !== undefined ? toKopecks(body.amount) : undefined,
      probability: body.probability !== undefined ? Number(body.probability) : undefined,
      expected_close_date: body.expectedCloseDate !== undefined ? String(body.expectedCloseDate) : undefined,
      next_action: body.nextAction !== undefined ? String(body.nextAction) : undefined,
      contractor_id: body.contractorId ? Number(body.contractorId) : undefined,
    },
    actor,
  );
  if (!deal) return NextResponse.json({ error: "Не найдена" }, { status: 404 });
  return NextResponse.json({ deal });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!getDealById(id)) return NextResponse.json({ error: "Не найдена" }, { status: 404 });
  deleteDeal(id);
  return NextResponse.json({ ok: true });
}
