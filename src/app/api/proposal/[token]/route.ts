import { NextRequest, NextResponse } from "next/server";
import { getContractorById, getOrderById, getOrderItems, getProposalByToken, markProposalViewed } from "@/lib/crm/db";

/**
 * Публичный роут — вне /api/crm, поэтому middleware его не гейтит.
 * Клиент открывает /kp/<token> без логина.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const proposal = getProposalByToken(token);
  if (!proposal) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  const order = getOrderById(proposal.order_id);
  const contractor = order ? getContractorById(order.contractor_id) : undefined;
  if (!order || !contractor) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  markProposalViewed(proposal.id);

  return NextResponse.json({
    proposal: getProposalByToken(token),
    order: { title: order.title, description: order.description, amount_kopecks: order.amount_kopecks },
    items: getOrderItems(order.id),
    contractorName: contractor.name,
    contractorCompany: contractor.company,
  });
}
