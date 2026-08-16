import { NextRequest, NextResponse } from "next/server";
import { deleteProduct, updateProduct, type ProductCategory } from "@/lib/crm/db";
import { toKopecks } from "@/lib/crm/format";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const body = await request.json();

  const product = updateProduct(id, {
    category: body.category as ProductCategory | undefined,
    title: body.title,
    description: body.description,
    default_cost_kopecks: body.cost !== undefined ? toKopecks(body.cost) : undefined,
    default_sell_price_kopecks: body.sellPrice !== undefined ? toKopecks(body.sellPrice) : undefined,
    lead_time: body.leadTime,
  });

  if (!product) {
    return NextResponse.json({ error: "Не найден" }, { status: 404 });
  }
  return NextResponse.json({ product });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  deleteProduct(id);
  return NextResponse.json({ ok: true });
}
