import { NextRequest, NextResponse } from "next/server";
import {
  acceptReconciliation,
  getContractorBalanceDetailed,
  reopenReconciliation,
  setOpeningBalance,
} from "@/lib/crm/reconciliation";
import { toKopecks } from "@/lib/crm/format";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const body = await request.json();
  const note = String(body.note || "").trim() || undefined;

  switch (body.action) {
    case "opening":
      setOpeningBalance(id, toKopecks(body.openingBalance ?? 0), note);
      break;
    case "accept":
      acceptReconciliation(id, note);
      break;
    case "reopen":
      reopenReconciliation(id);
      break;
    default:
      return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });
  }

  return NextResponse.json({ balance: getContractorBalanceDetailed(id) });
}
