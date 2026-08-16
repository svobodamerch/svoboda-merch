import { NextRequest, NextResponse } from "next/server";
import { getProposalByToken, markProposalAccepted } from "@/lib/crm/db";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const proposal = getProposalByToken(token);
  if (!proposal) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  const updated = markProposalAccepted(proposal.id);
  return NextResponse.json({ proposal: updated });
}
