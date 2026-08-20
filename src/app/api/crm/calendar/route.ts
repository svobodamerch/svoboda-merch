import { NextResponse } from "next/server";
import { getOrders, getTasksWithDueDate } from "@/lib/crm/db";
import { getCommitments } from "@/lib/crm/sales";
import { getExpectedCashEvents } from "@/lib/crm/cash";

const NSK_OFFSET_MS = 3 * 60 * 60 * 1000;

/**
 * due_at бывает двух видов: просто дата "YYYY-MM-DD" (ручной ввод через
 * <input type="date">) или полный момент в UTC "YYYY-MM-DD HH:MM:SS" (бот
 * пишет уже сконвертированным из московского времени). Календарь
 * группирует по дню — приводим оба случая к одной локальной дате, а не
 * берём первые 10 символов UTC-строки: для раннего утра по Москве
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

  // Календарь деловой, а не встреч: срок заказа, задача, обещание и ожидаемые
  // деньги — всё, что случится в этот день и о чём нужно знать заранее
  const commitments = getCommitments("open")
    .filter((c) => c.due_date)
    .map((c) => ({
      id: c.id,
      title: c.title,
      description: c.side === "we" ? "Обещали мы" : "Обещали нам",
      date: toLocalDateKey(c.due_date as string),
    }));

  const money = getExpectedCashEvents().map((e) => ({
    id: e.id,
    title: `${e.direction === "in" ? "+" : "−"}${(e.amountKopecks / 100).toLocaleString("ru-RU")} ₽${
      e.comment ? ` · ${e.comment}` : ""
    }`,
    description: e.orderTitle,
    date: toLocalDateKey(e.date),
  }));

  return NextResponse.json({ orders, tasks, commitments, money });
}
