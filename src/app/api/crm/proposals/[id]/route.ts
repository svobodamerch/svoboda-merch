import { NextRequest, NextResponse } from "next/server";
import { getOrderById, getOrderItems, getProposalById, getProposalEvents, updateProposal } from "@/lib/crm/db";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const proposal = getProposalById(id);
  if (!proposal) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  const order = getOrderById(proposal.order_id);
  return NextResponse.json({
    proposal,
    order,
    items: getOrderItems(proposal.order_id),
    events: getProposalEvents(id),
  });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const existing = getProposalById(id);
  if (!existing) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  const body = await request.json();
  const proposal = updateProposal(id, {
    template: body.template,
    intro: body.intro,
    solution: body.solution,
    terms: body.terms,
    valid_until: body.validUntil,
  });

  return NextResponse.json({ proposal });
}
