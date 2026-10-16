import { NextRequest, NextResponse } from "next/server";
import { toKopecks } from "@/lib/crm/format";
import {
  addEntry, computeBalance, getAccount, getEntries, rotateToken, setRates,
  type SettlementCategory, type SettlementDirection,
} from "@/lib/crm/settlements";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const account = getAccount(Number((await params).id));
  if (!account) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  const entries = getEntries(account.id);
  return NextResponse.json({
    account,
    entries,
    balances: { business: computeBalance(entries, "business"), personal: computeBalance(entries, "personal") },
  });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const account = getAccount(id);
  if (!account) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  const body = await request.json();

  if (body.action === "rotate_token") {
    return NextResponse.json({ token: rotateToken(id) });
  }

  if (body.action === "set_rates") {
    const num = (v: unknown) => (v === "" || v == null || !Number.isFinite(Number(v)) ? null : Number(v));
    setRates(id, num(body.taxPercent), num(body.feePercent));
    return NextResponse.json({ ok: true });
  }

  const title = String(body.title || "").trim();
  if (!title || !body.date) return NextResponse.json({ error: "Нужны дата и описание" }, { status: 400 });
  const amountRaw = String(body.amount ?? "").trim();
  const entry = addEntry(id, {
    entry_date: String(body.date),
    category: (body.category === "personal" ? "personal" : "business") as SettlementCategory,
    direction: (body.direction === "in" ? "in" : "out") as SettlementDirection,
    amount_kopecks: amountRaw ? toKopecks(amountRaw) : null,
    title,
    source: "manual",
    evidence: String(body.evidence || "").trim() || undefined,
  });
  return NextResponse.json({ entry });
}
