import { NextRequest, NextResponse } from "next/server";
import { checkLoginAllowed, clientKey, registerLoginFailure } from "@/lib/crm/rate-limit";
import { getAccountByToken, respondToEntry } from "@/lib/crm/settlements";

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string; entryId: string }> }) {
  const key = `recon:${clientKey(request.headers)}`;
  if (!checkLoginAllowed(key).allowed) return NextResponse.json({ error: "Слишком много попыток" }, { status: 429 });
  const { token, entryId } = await params;
  const account = getAccountByToken(token);
  if (!account) {
    registerLoginFailure(key);
    return NextResponse.json({ error: "Ссылка не найдена" }, { status: 404 });
  }
  const body = await request.json();
  if (body.response !== "agreed" && body.response !== "disputed") {
    return NextResponse.json({ error: "Неизвестный ответ" }, { status: 400 });
  }
  const ok = respondToEntry(account.id, Number(entryId), body.response, String(body.comment || "").trim());
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Строка не найдена" }, { status: 404 });
}
