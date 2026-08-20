import { NextResponse } from "next/server";
import { getCostsNeedingReview, getOrphanPayments, getUnlinkedMtTransactions } from "@/lib/crm/db";
import { findDuplicatePayments } from "@/lib/crm/ingest";

/** Всё, что внесено приблизительно, не разнесено по сделкам, или ждёт разбора из Money Treker */
export async function GET() {
  return NextResponse.json({
    costs: getCostsNeedingReview(),
    orphanPayments: getOrphanPayments(),
    moneyTreker: getUnlinkedMtTransactions(),
    duplicates: findDuplicatePayments(),
  });
}
