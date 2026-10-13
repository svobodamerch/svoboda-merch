import { NextRequest, NextResponse } from "next/server";
import { relay, trekerFetch } from "@/lib/crm/treker";
import { getOrderById } from "@/lib/crm/db";

export async function GET(_r: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  return relay(await trekerFetch(`/api/crm-link/order/${id}?limit=40`));
}

/** Привязать чат к сделке */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const order = getOrderById(id);
  if (!order) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  const { chatId } = await request.json();
  return relay(
    await trekerFetch("/api/crm-link", {
      method: "POST",
      body: JSON.stringify({ chatId, orderId: id, contractorId: order.contractor_id }),
    }),
  );
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const chatId = request.nextUrl.searchParams.get("chatId");
  return relay(await trekerFetch(`/api/crm-link/${id}/${Number(chatId)}`, { method: "DELETE" }));
}
