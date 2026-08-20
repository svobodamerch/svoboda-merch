"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type DragEvent } from "react";

/**
 * Деловой календарь, а не календарь встреч: сроки заказов, задачи, обещания
 * и ожидаемые деньги в одном месте. Задачи переносятся между днями мышью —
 * это самое частое действие, ради него не должно быть формы.
 */

type EventType = "order" | "task" | "commitment" | "money";

type CalEvent = {
  id: number;
  title: string;
  description: string | null;
  date: string;
  type: EventType;
};

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MONTHS = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

const typeStyle: Record<EventType, string> = {
  order: "bg-ink/10 text-ink",
  task: "bg-accent/12 text-accent",
  commitment: "bg-amber-100 text-amber-800",
  money: "bg-emerald-100 text-emerald-800",
};

const typeName: Record<EventType, string> = {
  order: "Срок заказа",
  task: "Задача",
  commitment: "Обещание",
  money: "Ожидаемые деньги",
};

/** Дата ячейки — по локальным году/месяцу/дню, без ухода в UTC (иначе в UTC+7 день съезжает назад) */
function toKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDay(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return `${d} ${MONTHS[m - 1].toLowerCase()} ${y}`;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelected] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch("/api/crm/calendar")
      .then((r) => r.json())
      .then((d) => {
        const pick = (rows: CalEvent[] | undefined, type: EventType): CalEvent[] =>
          (rows || []).map((r) => ({ ...r, type }));
        setEvents([
          ...pick(d.orders, "order"),
          ...pick(d.tasks, "task"),
          ...pick(d.commitments, "commitment"),
          ...pick(d.money, "money"),
        ]);
      });
  }, []);

  useEffect(load, [load]);

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

    const out: (Date | null)[] = [];
    for (let i = 0; i < startOffset; i++) out.push(null);
    for (let d = 1; d <= daysInMonth; d++) out.push(new Date(year, month, d));
    return out;
  }, [cursor]);

  const today = toKey(new Date());

  /** Перенос задачи на другой день — переписываем срок, а не создаём копию */
  const moveTask = async (taskId: number, date: string) => {
    setError(null);
    // сразу двигаем в интерфейсе, иначе перетаскивание ощущается сломанным
    setEvents((prev) =>
      prev.map((e) => (e.type === "task" && e.id === taskId ? { ...e, date } : e)),
    );
    const r = await fetch(`/api/crm/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dueAt: date }),
    }).catch(() => null);
    if (!r || !r.ok) {
      setError("Не удалось перенести задачу — вернул как было");
      load();
      return;
    }
    load();
  };

  const onDrop = (e: DragEvent, date: string) => {
    e.preventDefault();
    setDragOver(null);
    const raw = e.dataTransfer.getData("text/task-id");
    if (raw) moveTask(Number(raw), date);
  };

  const selectedEvents = selected ? byDay.get(selected) || [] : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
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
            onClick={() => {
              const d = new Date();
              setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
              setSelected(toKey(d));
            }}
            className="pill label bg-surface text-ink-soft hover:bg-tint"
          >
            Сегодня
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

      <div className="flex flex-wrap gap-3">
        {(Object.keys(typeName) as EventType[]).map((t) => (
          <span key={t} className="label text-muted flex items-center gap-1.5">
            <span className={`inline-block h-2.5 w-2.5 rounded-sm ${typeStyle[t].split(" ")[0]}`} />
            {typeName[t]}
          </span>
        ))}
        <span className="label text-muted">· задачи можно перетаскивать мышью</span>
      </div>

      {error && <p className="label rounded-xl bg-red-50 px-4 py-3 text-red-700">{error}</p>}

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((w) => (
          <div key={w} className="label text-muted px-1 pb-2 text-center">
            {w}
          </div>
        ))}
        {cells.map((date, i) => {
          if (!date) return <div key={i} />;
          const key = toKey(date);
          const dayEvents = byDay.get(key) || [];
          const isToday = key === today;
          const isSelected = selected === key;

          return (
            <div
              key={i}
              onClick={() => setSelected(key)}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(key);
              }}
              onDragLeave={() => setDragOver((d) => (d === key ? null : d))}
              onDrop={(e) => onDrop(e, key)}
              className={`min-h-[104px] cursor-pointer rounded-xl border p-1.5 transition-colors ${
                dragOver === key
                  ? "border-accent bg-tint"
                  : isSelected
                    ? "border-ink bg-tint"
                    : "border-transparent bg-surface hover:bg-tint"
              }`}
            >
              <span
                className={`label mb-1 inline-flex h-5 min-w-5 items-center justify-center rounded-md px-1 ${
                  isToday ? "bg-accent text-bg" : "text-muted"
                }`}
              >
                {date.getDate()}
              </span>
              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map((e) => (
                  <div
                    key={`${e.type}-${e.id}`}
                    draggable={e.type === "task"}
                    onDragStart={(ev) => ev.dataTransfer.setData("text/task-id", String(e.id))}
                    title={e.title}
                    className={`truncate rounded px-1 py-0.5 text-[10px] leading-tight ${typeStyle[e.type]} ${
                      e.type === "task" ? "cursor-grab active:cursor-grabbing" : ""
                    }`}
                  >
                    {e.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <p className="label text-muted px-1 text-[10px]">ещё {dayEvents.length - 3}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <div>
          <p className="label text-accent mb-4">{formatDay(selected)}</p>
          {selectedEvents.length === 0 ? (
            <p className="label text-muted">Ничего не запланировано</p>
          ) : (
            <ul className="divide-y divide-line border-t border-line">
              {selectedEvents.map((e) => (
                <li key={`${e.type}-${e.id}`} className="flex flex-wrap items-baseline justify-between gap-2 py-3">
                  <div className="min-w-0">
                    {e.type === "order" ? (
                      <Link href={`/admin/crm/orders/${e.id}`} className="label text-ink hover:text-accent">
                        {e.title}
                      </Link>
                    ) : (
                      <span className="label text-ink">{e.title}</span>
                    )}
                    {e.description && <p className="label text-muted mt-0.5">{e.description}</p>}
                  </div>
                  <span className={`rounded-md px-1.5 py-0.5 text-[10px] shrink-0 ${typeStyle[e.type]}`}>
                    {typeName[e.type]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
