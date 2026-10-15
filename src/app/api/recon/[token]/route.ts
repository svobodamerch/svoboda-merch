import { NextRequest, NextResponse } from "next/server";
import { checkLoginAllowed, clientKey, registerLoginFailure } from "@/lib/crm/rate-limit";
import { computeBalance, getAccountByToken, getEntries } from "@/lib/crm/settlements";

/** Публичная сверка: доступ только по неугадываемой ссылке, вне /api/crm. Перебор токена душим лимитером. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const key = `recon:${clientKey(request.headers)}`;
  const verdict = checkLoginAllowed(key);
  if (!verdict.allowed) return NextResponse.json({ error: "Слишком много попыток" }, { status: 429 });

  const account = getAccountByToken((await params).token);
  if (!account) {
    registerLoginFailure(key);
    return NextResponse.json({ error: "Ссылка не найдена" }, { status: 404 });
  }
  const entries = getEntries(account.id);
  return NextResponse.json({
    name: account.name,
    note: account.note,
    entries,
    balances: { business: computeBalance(entries, "business"), personal: computeBalance(entries, "personal") },
  });
}
