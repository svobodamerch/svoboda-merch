import { NextRequest, NextResponse } from "next/server";
import { deleteContractorService, updateContractorService } from "@/lib/crm/db";
import { toKopecks } from "@/lib/crm/format";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const body = await request.json();

  const service = updateContractorService(id, {
    title: body.title,
    description: body.description,
    cost_kopecks: body.cost !== undefined ? toKopecks(body.cost) : undefined,
    sell_price_kopecks: body.sellPrice !== undefined ? toKopecks(body.sellPrice) : undefined,
    lead_time: body.leadTime,
    notes: body.notes,
  });

  if (!service) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }
  return NextResponse.json({ service });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  deleteContractorService(id);
  return NextResponse.json({ ok: true });
}
