import { NextRequest, NextResponse } from "next/server";
import { lookupEntities } from "@/lib/crm/archive";

/** Поиск контрагента/заказа/проекта по тексту — к чему привязать документ */
export async function GET(request: NextRequest) {
  return NextResponse.json(lookupEntities(request.nextUrl.searchParams.get("q") || ""));
}
