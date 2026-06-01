import { NextResponse } from "next/server";
import { getShopProducts } from "@/lib/notion-shop";

export async function GET() {
  try {
    const products = await getShopProducts();
    return NextResponse.json({ products });
  } catch (error) {
    console.error("[api/shop] GET error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
