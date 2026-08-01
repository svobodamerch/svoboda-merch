import { NextRequest, NextResponse } from "next/server";
import { createLead } from "@/lib/db";
import { sendManagerNotification } from "@/lib/email";
import { createNotionLead } from "@/lib/notion";
import { notifyNewLeadWithPhoto } from "@/lib/telegram";

// Заявка из конструктора отдельно от /api/leads: тело содержит base64
// картинку дизайна, не хотим раздувать обычные текстовые заявки этим.

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // с запасом — реальный экспорт canvas в разы меньше

function decodeDesignImage(dataUrl: string): Buffer | null {
  const match = /^data:image\/png;base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  const buffer = Buffer.from(match[1], "base64");
  if (buffer.length === 0 || buffer.length > MAX_IMAGE_BYTES) return null;
  return buffer;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const name = String(body.name || "").trim();
    const phone = String(body.phone || "").trim();
    const telegram = String(body.telegram || "").trim();
    const comment = String(body.comment || "").trim();
    const productName = String(body.productName || "Товар из конструктора").trim();
    const colorLabel = String(body.colorLabel || "").trim();

    if (!name || !phone) {
      return NextResponse.json({ error: "Заполните обязательные поля" }, { status: 400 });
    }

    const designBuffer = decodeDesignImage(String(body.designImage || ""));
    if (!designBuffer) {
      return NextResponse.json({ error: "Не удалось получить дизайн" }, { status: 400 });
    }

    const fullComment = [
      `[КОНСТРУКТОР] ${productName}${colorLabel ? `, цвет: ${colorLabel}` : ""}`,
      comment,
    ]
      .filter(Boolean)
      .join("\n");

    let leadId: number | undefined;
    try {
      const lead = createLead({
        name,
        phone,
        telegram: telegram || undefined,
        productType: `Конструктор: ${productName}`,
        quantity: "1",
        comment: fullComment,
        source: "constructor",
      });
      leadId = lead.id;
    } catch (dbErr) {
      console.warn("[api/design-leads] SQLite недоступна (ожидается на Vercel):", dbErr);
    }

    const emailData = {
      name,
      phone,
      productType: `Конструктор: ${productName}`,
      quantity: "1",
      comment: fullComment,
    };
    sendManagerNotification(emailData, [{ filename: "design.png", content: designBuffer }]).catch(() => {});

    // Notion без вложения на этом этапе — файл живёт в письме/Telegram.
    createNotionLead({
      ...emailData,
      comment: `${fullComment}\n(дизайн приложен в письме и Telegram)`,
    }).catch(() => {});

    notifyNewLeadWithPhoto(
      {
        name,
        phone,
        telegram: telegram || undefined,
        productType: `Конструктор: ${productName}`,
        comment: fullComment,
        source: "constructor",
      },
      designBuffer,
    ).catch((e) => console.warn("[api/design-leads] Telegram:", e));

    return NextResponse.json({ success: true, id: leadId ?? null }, { status: 201 });
  } catch (error) {
    console.error("[api/design-leads] POST error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
