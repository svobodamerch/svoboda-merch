import { NextRequest, NextResponse } from "next/server";
import { getExpenseBreakdown } from "@/lib/crm/expenses";
import {
  getExpenseCategories,
  getOrCreateExpenseCategory,
  setExpenseCategoryKind,
  type ExpenseCategoryKind,
} from "@/lib/crm/db";

export async function GET(request: NextRequest) {
  const months = Number(request.nextUrl.searchParams.get("months")) || 6;
  return NextResponse.json({
    breakdown: getExpenseBreakdown(months),
    categories: getExpenseCategories(),
  });
}

/** Завести статью или переключить её между постоянной и переменной */
export async function POST(request: NextRequest) {
  const body = await request.json();

  // Переключение типа уже заведённой статьи
  if (body.categoryId) {
    setExpenseCategoryKind(Number(body.categoryId), body.kind as ExpenseCategoryKind);
    return NextResponse.json({ ok: true });
  }

  const name = String(body.name || "").trim();
  if (!name) {
    return NextResponse.json({ error: "Нужно название статьи" }, { status: 400 });
  }
  const category = getOrCreateExpenseCategory(name, (body.kind as ExpenseCategoryKind) || "variable");
  return NextResponse.json({ category });
}
