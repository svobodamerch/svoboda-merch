import { NextResponse } from "next/server";
import { getOrders, getTasksWithDueDate } from "@/lib/crm/db";

/**
 * orders.deadline — свободный текст (старые записи), поэтому фильтруем
 * только то, что реально парсится как дата, прямо здесь — страница
 * календаря получает уже чистые данные.
 */
export async function GET() {
  const orders = getOrders()
    .filter((o) => o.deadline && !Number.isNaN(Date.parse(o.deadline)))
    .map((o) => ({ id: o.id, title: o.title, date: new Date(o.deadline as string).toISOString().slice(0, 10) }));

  const tasks = getTasksWithDueDate().map((t) => ({ id: t.id, title: t.title, date: t.due_at as string }));

  return NextResponse.json({ orders, tasks });
}
