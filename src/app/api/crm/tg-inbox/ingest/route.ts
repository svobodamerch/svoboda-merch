import { NextRequest, NextResponse } from "next/server";
import { ingestTgInbox, type IngestItem } from "@/lib/crm/tg-inbox";

/** Сюда Treker складывает находки из Telegram. Только по x-bot-secret (middleware пускает этот путь). */
export async function POST(request: NextRequest) {
  const secret = process.env.BOT_API_SECRET;
  if (!secret || request.headers.get("x-bot-secret") !== secret) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }
  const body = await request.json();
  const items: IngestItem[] = Array.isArray(body.items) ? body.items.slice(0, 200) : [];
  return NextResponse.json({ added: ingestTgInbox(items), received: items.length });
}
