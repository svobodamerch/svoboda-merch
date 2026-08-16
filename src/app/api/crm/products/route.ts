import { NextRequest, NextResponse } from "next/server";
import { createProduct, getProducts, type ProductCategory } from "@/lib/crm/db";
import { toKopecks } from "@/lib/crm/format";

export async function GET() {
  return NextResponse.json({ products: getProducts() });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const title = String(body.title || "").trim();
  if (!title) {
    return NextResponse.json({ error: "Укажите название товара" }, { status: 400 });
  }

  const product = createProduct({
    category: (body.category as ProductCategory) || "other",
    title,
    description: String(body.description || "").trim() || undefined,
    default_cost_kopecks: toKopecks(body.cost ?? 0),
    default_sell_price_kopecks: toKopecks(body.sellPrice ?? 0),
    lead_time: String(body.leadTime || "").trim() || undefined,
  });

  return NextResponse.json({ product });
}
