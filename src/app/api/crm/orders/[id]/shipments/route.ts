import { NextRequest, NextResponse } from "next/server";
import { createOrderShipment, getOrderById, getOrderShipments } from "@/lib/crm/db";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return NextResponse.json({ shipments: getOrderShipments(Number((await params).id)) });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const orderId = Number((await params).id);
  if (!getOrderById(orderId)) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  const body = await request.json();
  return NextResponse.json(createOrderShipment(orderId, body), { status: 201 });
}
