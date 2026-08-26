import { NextRequest, NextResponse } from "next/server";
import { applyQuickActions, parseQuickUpdate, type QuickAction } from "@/lib/crm/quickUpdate";
import { getCurrentActor } from "@/lib/crm/current-user";

/** Разбор текста на действия — ничего ещё не меняет */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const text = String(body.text || "").trim();
  if (!text) return NextResponse.json({ error: "Пусто" }, { status: 400 });

  const result = await parseQuickUpdate(text);
  if (result.actions.length === 0 && !result.unparsed) {
    return NextResponse.json({ error: "Не заведён ключ Groq или ничего не распознано" }, { status: 422 });
  }
  return NextResponse.json(result);
}

/** Применение действий, которые пользователь подтвердил (могли отредактировать список) */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const body = await request.json();
  const actions = (body.actions || []) as QuickAction[];
  if (!Array.isArray(actions) || actions.length === 0) {
    return NextResponse.json({ error: "Нет действий" }, { status: 400 });
  }

  try {
    applyQuickActions({ contractorId: id }, actions, await getCurrentActor());
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
