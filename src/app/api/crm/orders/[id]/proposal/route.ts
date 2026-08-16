import { NextRequest, NextResponse } from "next/server";
import { createProposal, getOrderById, getProposalByOrderId } from "@/lib/crm/db";
import { getCurrentActor } from "@/lib/crm/current-user";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const orderId = Number((await params).id);
  const proposal = getProposalByOrderId(orderId);
  if (!proposal) {
    return NextResponse.json({ proposal: null });
  }
  return NextResponse.json({ proposal });
}

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const orderId = Number((await params).id);
  const order = getOrderById(orderId);
  if (!order) {
    return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
  }

  const actor = await getCurrentActor();
  const proposal = createProposal(orderId, {}, actor);
  return NextResponse.json({ proposal });
}
