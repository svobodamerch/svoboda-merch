import { NextRequest, NextResponse } from "next/server";
import { relay, trekerFetch } from "@/lib/crm/treker";
import { getCrmDb, getOrderById, getOrderCosts, getOrderItems, getOrderShipments } from "@/lib/crm/db";

/** Разбор «что висит по сделке»: данные CRM + привязанная переписка → Claude (на стороне Treker) */
export async function POST(_r: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const order = getOrderById(id);
  if (!order) return NextResponse.json({ error: "Не найдено" }, { status: 404 });

  const payments = getCrmDb()
    .prepare(`SELECT direction, amount_kopecks/100.0 AS rub, comment, created_at FROM payments WHERE order_id = ? ORDER BY id`)
    .all(id);
  const context = {
    сделка: { название: order.title, статус: order.status, сумма_руб: order.amount_kopecks / 100, срок: order.deadline, описание: order.description },
    позиции: getOrderItems(id).map((i) => ({
      название: i.title, кол_во: i.quantity, цена_руб: i.unit_price_kopecks / 100, срок: i.lead_time, заметки: i.description,
    })),
    платежи: payments,
    затраты: getOrderCosts(id).map((c) => ({ название: c.title, руб: c.amount_kopecks / 100, статус: c.status, на_проверке: !!c.needs_review })),
    отправки: getOrderShipments(id).map((s) => ({ город: s.city, получатель: s.recipient, статус: s.status, трек: s.tracking })),
  };
  return relay(await trekerFetch(`/api/crm-link/order/${id}/analyze`, { method: "POST", body: JSON.stringify({ order: context }) }));
}
