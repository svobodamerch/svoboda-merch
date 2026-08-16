import { NextResponse } from "next/server";
import { getProposals } from "@/lib/crm/db";

export async function GET() {
  return NextResponse.json({ proposals: getProposals() });
}
