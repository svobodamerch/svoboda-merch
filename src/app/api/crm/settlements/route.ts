import { NextRequest, NextResponse } from "next/server";
import { createAccount, listAccounts } from "@/lib/crm/settlements";

export async function GET() {
  return NextResponse.json({ accounts: listAccounts() });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const name = String(body.name || "").trim();
  if (!name) return NextResponse.json({ error: "Укажите, с кем взаиморасчёты" }, { status: 400 });
  return NextResponse.json({ account: createAccount(name, String(body.note || "").trim() || undefined) });
}
