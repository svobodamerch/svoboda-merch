import { NextRequest, NextResponse } from "next/server";
import { deleteOrderShipment, updateOrderShipment } from "@/lib/crm/db";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ shipmentId: string }> }) {
  updateOrderShipment(Number((await params).shipmentId), await request.json());
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ shipmentId: string }> }) {
  deleteOrderShipment(Number((await params).shipmentId));
  return NextResponse.json({ ok: true });
}
