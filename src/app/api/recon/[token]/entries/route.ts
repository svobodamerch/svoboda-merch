import { NextRequest, NextResponse } from "next/server";
import { toKopecks } from "@/lib/crm/format";
import { checkLoginAllowed, clientKey, registerLoginFailure } from "@/lib/crm/rate-limit";
import { addEntry, getAccountByToken } from "@/lib/crm/settlements";

/** Контрагент добавляет строку, которой нет в нашем списке. Андрей увидит её с пометкой «добавлено им». */
export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const key = `recon:${clientKey(request.headers)}`;
  if (!checkLoginAllowed(key).allowed) return NextResponse.json({ error: "Слишком много попыток" }, { status: 429 });
  const account = getAccountByToken((await params).token);
  if (!account) {
    registerLoginFailure(key);
    return NextResponse.json({ error: "Ссылка не найдена" }, { status: 404 });
  }
  const body = await request.json();
  const title = String(body.title || "").trim();
  if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(String(body.date || ""))) {
    return NextResponse.json({ error: "Нужны дата и описание" }, { status: 400 });
  }
  const amountRaw = String(body.amount ?? "").trim();
  const entry = addEntry(
    account.id,
    {
      entry_date: String(body.date),
      category: body.category === "personal" ? "personal" : "business",
      direction: body.direction === "in" ? "in" : "out",
      amount_kopecks: amountRaw ? toKopecks(amountRaw) : null,
      title,
      source: "counterparty",
    },
    "them",
  );
  return NextResponse.json({ entry });
}
