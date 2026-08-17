import { NextResponse } from "next/server";
import { getOrders, getTasksWithDueDate } from "@/lib/crm/db";

const NSK_OFFSET_MS = 7 * 60 * 60 * 1000;

/**
 * due_at бывает двух видов: просто дата "YYYY-MM-DD" (ручной ввод через
 * <input type="date">) или полный момент в UTC "YYYY-MM-DD HH:MM:SS" (бот
 * пишет уже сконвертированным из новосибирского времени). Календарь
 * группирует по дню — приводим оба случая к одной локальной дате, а не
 * берём первые 10 символов UTC-строки: для раннего утра по Новосибирску
 * это могла бы быть предыдущая UTC-дата.
 */
function toLocalDateKey(dueAt: string): string {
  if (dueAt.length <= 10) return dueAt;
  const utcMs = new Date(dueAt.replace(" ", "T") + "Z").getTime();
  return new Date(utcMs + NSK_OFFSET_MS).toISOString().slice(0, 10);
}

/**
 * orders.deadline — свободный текст (старые записи), поэтому фильтруем
 * только то, что реально парсится как дата, прямо здесь — страница
 * календаря получает уже чистые данные.
 */
export async function GET() {
  const orders = getOrders()
    .filter((o) => o.deadline && !Number.isNaN(Date.parse(o.deadline)))
    .map((o) => ({
      id: o.id,
      title: o.title,
      description: o.description,
      date: toLocalDateKey(o.deadline as string),
    }));

  const tasks = getTasksWithDueDate().map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    date: toLocalDateKey(t.due_at as string),
  }));

  return NextResponse.json({ orders, tasks });
}
