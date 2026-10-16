import { NextRequest, NextResponse } from "next/server";
import { ingestProposals, type ProposalInput } from "@/lib/crm/settlements";

/** Сюда Treker складывает найденные в переписке денежные движения. Только по x-bot-secret. */
export async function POST(request: NextRequest) {
  const secret = process.env.BOT_API_SECRET;
  if (!secret || request.headers.get("x-bot-secret") !== secret) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }
  const body = await request.json();
  const items: ProposalInput[] = Array.isArray(body.items) ? body.items.slice(0, 100) : [];
  return NextResponse.json({ added: ingestProposals(String(body.account || ""), items), received: items.length });
}
