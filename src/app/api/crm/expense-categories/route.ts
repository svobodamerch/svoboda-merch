import { NextRequest, NextResponse } from "next/server";
import { getExpenseCategories, getOrCreateExpenseCategory, type ExpenseCategoryKind } from "@/lib/crm/db";

export async function GET() {
  return NextResponse.json({ categories: getExpenseCategories() });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const name = String(body.name || "").trim();
  if (!name) {
    return NextResponse.json({ error: "Укажите название категории" }, { status: 400 });
  }
  const kind: ExpenseCategoryKind = body.kind === "fixed" ? "fixed" : "variable";
  const category = getOrCreateExpenseCategory(name, kind);
  return NextResponse.json({ category });
}
