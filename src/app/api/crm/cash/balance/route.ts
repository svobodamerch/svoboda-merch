import { NextRequest, NextResponse } from "next/server";
import { updateBankAccountBalance } from "@/lib/crm/db";
import { toKopecks } from "@/lib/crm/format";

/** Остаток на счёте — вручную, пока нет банковского импорта */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const accountId = Number(body.accountId);
  if (!accountId) {
    return NextResponse.json({ error: "Не указан счёт" }, { status: 400 });
  }

  updateBankAccountBalance(accountId, toKopecks(body.balance ?? 0));
  return NextResponse.json({ ok: true });
}
