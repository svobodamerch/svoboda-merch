"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type CalEvent = { id: number; title: string; description: string | null; date: string; type: "order" | "task" };

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MONTHS = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

/** Дата ячейки — по локальным году/месяцу/дню, без ухода в UTC (иначе в UTC+7 день съезжает назад) */
function toKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelected] = useState<string | null>(null);
  const [openEvent, setOpenEvent] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/crm/calendar")
      .then((r) => r.json())
      .then((d) => {
        const orders: CalEvent[] = d.orders.map((o: { id: number; title: string; date: string }) => ({
          ...o,
          type: "order" as const,
        }));
        const tasks: CalEvent[] = d.tasks.map((t: { id: number; title: string; date: string }) => ({
          ...t,
          type: "task" as const,
        }));
        setEvents([...orders, ...tasks]);
      });
  }, []);

  const byDay = useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    for (const e of events) {
      const list = map.get(e.date) || [];
      list.push(e);
      map.set(e.date, list);
    }
    return map;
  }, [events]);

  const cells = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const startOffset = (first.getDay() + 6) % 7; // понедельник = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const out: { date: Date | null }[] = [];
    for (let i = 0; i < startOffset; i++) out.push({ date: null });
    for (let d = 1; d <= daysInMonth; d++) out.push({ date: new Date(year, month, d) });
    return out;
  }, [cursor]);

  const today = toKey(new Date());
  const selectedEvents = selected ? byDay.get(selected) || [] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="label-lg text-ink">
          {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))}
            className="pill label bg-surface text-ink-soft hover:bg-tint"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))}
            className="pill label bg-surface text-ink-soft hover:bg-tint"
          >
            →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((w) => (
          <div key={w} className="label text-muted px-1 pb-2 text-center">
            {w}
          </div>
        ))}
        {cells.map((cell, i) => {
          if (!cell.date) return <div key={i} />;
          const key = toKey(cell.date);
          const dayEvents = byDay.get(key) || [];
          return (
            <button
              key={i}
              type="button"
              onClick={() => setSelected(key)}
              className={`aspect-square rounded-xl p-2 text-left transition-colors ${
                selected === key ? "bg-ink text-bg" : key === today ? "bg-tint" : "bg-surface hover:bg-tint"
              }`}
            >
              <span className="label block">{cell.date.getDate()}</span>
              {dayEvents.length > 0 && (
                <span
                  className={`label mt-1 block truncate ${selected === key ? "text-bg" : "text-accent"}`}
                >
                  {dayEvents.length === 1 ? dayEvents[0].title : `${dayEvents.length} событий`}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selected && (
        <div>
          <p className="label text-accent mb-4">{selected}</p>
          {selectedEvents.length === 0 ? (
            <p className="label text-muted">Ничего не запланировано</p>
          ) : (
            <ul className="divide-y divide-line border-t border-line">
              {selectedEvents.map((e) => {
                const key = `${e.type}-${e.id}`;
                const isOpen = openEvent === key;
                return (
                  <li key={key} className="py-3">
                    <div className="flex items-center justify-between">
                      {e.type === "order" ? (
                        <Link href={`/admin/crm/orders/${e.id}`} className="label text-ink hover:text-accent">
                          Заказ: {e.title}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setOpenEvent(isOpen ? null : key)}
                          className="label text-ink text-left hover:text-accent"
                        >
                          Задача: {e.title}
                        </button>
                      )}
                      <span className="label text-muted shrink-0">
                        {e.type === "order" ? "срок заказа" : "задача"}
                      </span>
                    </div>
                    {e.type === "task" && isOpen && (
                      <p className="label text-muted mt-2">{e.description || "Без описания"}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
