import { NextResponse } from "next/server";
import { getCostsNeedingReview, getOrphanPayments } from "@/lib/crm/db";

/** Всё, что внесено приблизительно или не разнесено по сделкам */
export async function GET() {
  return NextResponse.json({
    costs: getCostsNeedingReview(),
    orphanPayments: getOrphanPayments(),
  });
}
