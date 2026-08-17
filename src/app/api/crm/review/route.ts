import { NextResponse } from "next/server";
import { getCostsNeedingReview } from "@/lib/crm/db";

/** Всё, что внесено приблизительно и требует спокойного разбора */
export async function GET() {
  return NextResponse.json({ costs: getCostsNeedingReview() });
}
