import { NextResponse } from "next/server";
import { getAllContractorBalances } from "@/lib/crm/reconciliation";

export async function GET() {
  const balances = getAllContractorBalances();
  return NextResponse.json({
    exceptions: balances.filter((b) => b.hasDiscrepancy),
    // те, у кого есть открытый долг в любую сторону — по ним нужно что-то делать
    open: balances.filter((b) => !b.hasDiscrepancy && b.outstandingKopecks !== 0),
    settled: balances.filter((b) => b.outstandingKopecks === 0 && b.accruedKopecks > 0),
  });
}
