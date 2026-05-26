import { NextRequest, NextResponse } from "next/server";
import { createLead, getLeads, type LeadStatus } from "@/lib/db";
import { sendManagerNotification } from "@/lib/email";
import { createNotionLead } from "@/lib/notion";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const name = String(body.name || "").trim();
    const phone = String(body.phone || "").trim();
    const productType = String(body.productType || "").trim();
    const quantity = String(body.quantity || "").trim();

    if (!name || !phone || !productType || !quantity) {
      return NextResponse.json(
        { error: "Заполните обязательные поля" },
        { status: 400 },
      );
    }

    const lead = createLead({
      name,
      company: String(body.company || "").trim() || undefined,
      phone,
      productType,
      quantity,
      comment: String(body.comment || "").trim() || undefined,
      deadline: String(body.deadline || "").trim() || undefined,
    });

    // Отправляем уведомление менеджеру и дублируем в Notion асинхронно
    const emailData = {
      name: lead.name,
      company: lead.company || undefined,
      phone: lead.phone,
      productType: lead.product_type,
      quantity: lead.quantity,
      comment: lead.comment || undefined,
      deadline: lead.deadline || undefined,
    };
    sendManagerNotification(emailData).catch(() => {});
    createNotionLead(emailData).catch(() => {});

    return NextResponse.json({ success: true, id: lead.id }, { status: 201 });
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
