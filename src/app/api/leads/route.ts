import { NextRequest, NextResponse } from "next/server";
import { createLead, getLeads, type LeadStatus } from "@/lib/db";
import { sendManagerNotification } from "@/lib/email";
import { createNotionLead } from "@/lib/notion";
import { notifyNewLead } from "@/lib/telegram";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const name = String(body.name || "").trim();
    const phone = String(body.phone || "").trim();
    const productType = String(body.productType || "").trim();
    const quantity = String(body.quantity || "").trim();
    const telegram = String(body.telegram || "").trim();
    const source = String(body.source || "website").trim();

    if (!name || !phone || !productType || !quantity) {
      return NextResponse.json(
        { error: "Заполните обязательные поля" },
        { status: 400 },
      );
    }

    // Сохраняем в SQLite (локально), но если не работает — не ломаем запрос
    let leadId: number | undefined;
    try {
      const lead = createLead({
        name,
        company: String(body.company || "").trim() || undefined,
        phone,
        telegram: telegram || undefined,
        productType,
        quantity,
        comment: String(body.comment || "").trim() || undefined,
        deadline: String(body.deadline || "").trim() || undefined,
        source,
      });
      leadId = lead.id;
    } catch (dbErr) {
      console.warn("[api/leads] SQLite недоступна (ожидается на Vercel):", dbErr);
    }

    // Всегда отправляем уведомление менеджеру и дублируем в Notion
    const emailData = {
      name,
      company: String(body.company || "").trim() || undefined,
      phone,
      productType,
      quantity,
      comment: String(body.comment || "").trim() || undefined,
      deadline: String(body.deadline || "").trim() || undefined,
    };
    sendManagerNotification(emailData).catch(() => {});
    createNotionLead(emailData).catch(() => {});

    // Дублируем в Telegram. Ошибка отправки не должна ронять приём заявки.
    notifyNewLead({
      name,
      phone,
      telegram: telegram || undefined,
      company: String(body.company || "").trim() || undefined,
      productType,
      quantity,
      comment: String(body.comment || "").trim() || undefined,
      source,
    }).catch((e) => console.warn("[api/leads] Telegram:", e));

    return NextResponse.json({ success: true, id: leadId ?? null }, { status: 201 });
  } catch (error) {
    console.error("[api/leads] POST error:", error);
    return NextResponse.json(
      { error: "Ошибка сервера" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as LeadStatus | null;
    const leads = getLeads(status || undefined);
    return NextResponse.json({ leads });
  } catch (error) {
    console.error("[api/leads] GET error:", error);
    return NextResponse.json(
      { error: "Ошибка сервера" },
      { status: 500 },
    );
  }
}
