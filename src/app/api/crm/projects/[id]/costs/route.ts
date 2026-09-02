import { NextRequest, NextResponse } from "next/server";
import { createProjectCost, getProjectCosts } from "@/lib/crm/db";
import { toKopecks } from "@/lib/crm/format";
import { getCurrentActor } from "@/lib/crm/current-user";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json({ costs: getProjectCosts(Number(id)) });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const title = String(body.title || "").trim();
  if (!title) return NextResponse.json({ error: "Укажите, что купили" }, { status: 400 });

  const quantity = body.quantity ? Number(body.quantity) : 1;
  const amount = toKopecks(body.amount);
  if (!amount || amount <= 0) return NextResponse.json({ error: "Укажите сумму" }, { status: 400 });

  const actor = await getCurrentActor();
  const cost = createProjectCost(
    {
      project_id: Number(id),
      title,
      contractor_id: body.contractorId ? Number(body.contractorId) : undefined,
      quantity,
      unit: String(body.unit || "шт"),
      unit_cost_kopecks: quantity ? Math.round(amount / quantity) : 0,
      amount_kopecks: amount,
      comment: String(body.comment || "").trim() || undefined,
    },
    actor,
  );
  return NextResponse.json({ cost });
}
