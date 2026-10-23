import { NextRequest, NextResponse } from "next/server";
import { createLead } from "@/lib/db";
import { sendManagerNotification } from "@/lib/email";
import { createNotionLead } from "@/lib/notion";
import { notifyNewLead } from "@/lib/telegram";

// Лендинги брендов (onetee/teetee/prdprnmtl) шлют форму сюда с другого
// домена — без этих заголовков браузер режет запрос на preflight
const BRAND_ORIGINS = /^https:\/\/(www\.)?(onetee|teetee|prdprnmtl)\.ru$/;

function corsHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get("origin") || "";
  if (!BRAND_ORIGINS.test(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request) });
}

export async function POST(request: NextRequest) {
  const cors = corsHeaders(request);
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
        { status: 400, headers: cors },
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

    return NextResponse.json({ success: true, id: leadId ?? null }, { status: 201, headers: cors });
  } catch (error) {
    console.error("[api/leads] POST error:", error);
    return NextResponse.json(
      { error: "Ошибка сервера" },
      { status: 500, headers: cors },
    );
  }
}

// Чтение заявок (имена, телефоны, комментарии клиентов) сюда специально не
// вынесено: этот путь не под /api/crm и не защищён сессией — здесь принимают
// форму с сайта. Список заявок отдаёт /api/crm/leads, куда без входа не попасть.
