import { NextRequest, NextResponse } from "next/server";
import {
  createExpectedCashEvent,
  getCashForecast,
  getExpectedCashEvents,
  type CashConfidence,
  type CashDirection,
  type CashKind,
} from "@/lib/crm/cash";
import { getBankAccounts } from "@/lib/crm/db";
import { toKopecks } from "@/lib/crm/format";
import { getCurrentActor } from "@/lib/crm/current-user";

export async function GET() {
  return NextResponse.json({
    forecast: getCashForecast(),
    expected: getExpectedCashEvents(),
    accounts: getBankAccounts(),
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const direction = body.direction as CashDirection;
  const amount = toKopecks(body.amount ?? 0);
  const expectedAt = String(body.expectedAt || "").trim();

  if ((direction !== "in" && direction !== "out") || amount <= 0 || !expectedAt) {
    return NextResponse.json(
      { error: "Укажите направление, сумму больше нуля и ожидаемую дату" },
      { status: 400 },
    );
  }

  const event = createExpectedCashEvent(
    {
      direction,
      kind: (body.kind as CashKind) || undefined,
      amount_kopecks: amount,
      expected_at: expectedAt,
      confidence: (body.confidence as CashConfidence) || undefined,
      contractor_id: body.contractorId ? Number(body.contractorId) : undefined,
      order_id: body.orderId ? Number(body.orderId) : undefined,
      comment: String(body.comment || "").trim() || undefined,
    },
    await getCurrentActor(),
  );

  return NextResponse.json({ event });
}
