import { NextRequest, NextResponse } from "next/server";
import { getCurrentActor } from "@/lib/crm/current-user";
import { acceptTgInbox, dismissTgInbox } from "@/lib/crm/tg-inbox";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const { action } = await request.json();
  if (action === "dismiss") {
    dismissTgInbox(id);
    return NextResponse.json({ ok: true });
  }
  if (action === "accept") {
    const result = acceptTgInbox(id, await getCurrentActor());
    if (!result) return NextResponse.json({ error: "Уже обработано или не найдено" }, { status: 404 });
    return NextResponse.json({ ok: true, result });
  }
  return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });
}
