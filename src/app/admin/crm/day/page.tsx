"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { DayReport } from "@/lib/crm/daily";

/**
 * Итог дня. Факты слева считаются из данных, справа — то, чего в данных нет:
 * что об этом думаешь. Вывод либо становится задачей, либо висит открытым,
 * пока к нему не вернёшься: пока вывод лежит текстом, он ни на что не влияет.
 */

function money(kopecks: number): string {
  return `${Math.round(kopecks / 100).toLocaleString("ru-RU")} ₽`;
}

function todayMsk(): string {
  return new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function shiftDay(day: string, delta: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

function formatDay(day: string): string {
  const names = [
    "января", "февраля", "марта", "апреля", "мая", "июня",
    "июля", "августа", "сентября", "октября", "ноября", "декабря",
  ];
  const [y, m, d] = day.split("-").map(Number);
  return `${d} ${names[m - 1]} ${y}`;
}

const field =
  "w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-[13px] text-ink outline-none focus:border-accent";

export default function DayPage() {
  const [day, setDay] = useState(todayMsk());
  const [data, setData] = useState<DayReport | null>(null);
  const [reflection, setReflection] = useState("");
  const [conclusion, setConclusion] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(() => {
    fetch(`/api/crm/day?day=${day}`)
      .then((r) => r.json())
      .then((d: DayReport) => {
        setData(d);
        setReflection(d.reflection);
      });
  }, [day]);

  useEffect(load, [load]);

  const send = async (body: Record<string, unknown>) => {
    setBusy(true);
    const r = await fetch("/api/crm/day", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ day, ...body }),
    });
    const d = await r.json();
    setBusy(false);
    if (!d.error) setData(d);
    return d;
  };

  const saveReflection = async () => {
    await send({ action: "reflection", reflection });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const addConclusion = async (e: FormEvent) => {
    e.preventDefault();
    if (!conclusion.trim()) return;
    await send({ action: "conclusion", text: conclusion });
    setConclusion("");
  };

  if (!data) return <p className="label text-muted">Загрузка…</p>;
  const { digest: g } = data;
  const isToday = day === todayMsk();
  const nothingHappened =
    g.money.items.length === 0 && g.tasksDone.length === 0 && g.commitmentsDone.length === 0 && g.events.length === 0;

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="label-lg text-ink">Итог дня</p>
          <p className="label text-muted mt-1">{formatDay(day)}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setDay((d) => shiftDay(d, -1))}
            className="pill label bg-surface text-ink-soft hover:bg-tint"
          >
            ←
          </button>
          {!isToday && (
            <button
              type="button"
              onClick={() => setDay(todayMsk())}
              className="pill label bg-surface text-ink-soft hover:bg-tint"
            >
              Сегодня
            </button>
          )}
          <button
            type="button"
            onClick={() => setDay((d) => shiftDay(d, 1))}
            disabled={isToday}
            className="pill label bg-surface text-ink-soft hover:bg-tint disabled:opacity-40"
          >
            →
          </button>
        </div>
      </div>

      {data.openFromBefore.length > 0 && (
        <div className="rounded-xl bg-amber-50 px-4 py-3">
          <p className="label text-amber-800 mb-2">
            Выводы прошлых дней, к которым не вернулись · {data.openFromBefore.length}
          </p>
          <ul className="space-y-1.5">
            {data.openFromBefore.map((c) => (
              <li key={c.id} className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="label text-amber-800">
                  {c.text}
                  <span className="text-amber-700"> · {formatDay(c.day)}</span>
                </span>
                <span className="flex gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => send({ action: "to_task", id: c.id })}
                    disabled={busy}
                    className="label text-accent hover:underline"
                  >
                    В задачу
                  </button>
                  <button
                    type="button"
                    onClick={() => send({ action: "close", id: c.id })}
                    disabled={busy}
                    className="label text-amber-700 hover:text-amber-900"
                  >
                    Закрыть
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div>
            <p className="section-title mb-3">Что было</p>

            {nothingHappened ? (
              <p className="label text-muted">В этот день ничего не записано</p>
            ) : (
              <div className="space-y-4">
                {g.money.items.length > 0 && (
                  <div className="rounded-2xl bg-surface p-5">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="label text-muted">Деньги</span>
                      <span className="label text-ink">
                        +{money(g.money.inKopecks)} · −{money(g.money.outKopecks)}
                      </span>
                    </div>
                    <ul className="mt-2 space-y-1">
                      {g.money.items.map((p) => (
                        <li key={p.id} className="flex items-baseline justify-between gap-3">
                          <span className="label text-ink-soft min-w-0 truncate">
                            {[p.who, p.comment].filter(Boolean).join(" · ") || "без описания"}
                          </span>
                          <span className={`label shrink-0 ${p.direction === "in" ? "text-accent" : "text-muted"}`}>
                            {p.direction === "in" ? "+" : "−"}
                            {money(p.amountKopecks)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {(g.tasksDone.length > 0 || g.commitmentsDone.length > 0) && (
                  <div className="rounded-2xl bg-surface p-5">
                    <p className="label text-muted mb-2">
                      Закрыто: задач {g.tasksDone.length}
                      {g.commitmentsDone.length > 0 && `, обещаний ${g.commitmentsDone.length}`}
                      {g.tasksCreated > 0 && ` · поставлено ${g.tasksCreated}`}
                    </p>
                    <ul className="space-y-1">
                      {[...g.tasksDone, ...g.commitmentsDone].map((t) => (
                        <li key={t.id} className="label text-ink-soft">
                          {t.title}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {g.events.length > 0 && (
                  <div className="rounded-2xl bg-surface p-5">
                    <p className="label text-muted mb-2">События</p>
                    <ul className="space-y-1">
                      {g.events.map((e, i) => (
                        <li key={i} className="label text-ink-soft">
                          {e.entityType === "order" ? (
                            <Link href={`/admin/crm/orders/${e.entityId}`} className="hover:text-accent">
                              {e.message}
                            </Link>
                          ) : (
                            e.message
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {(g.tasksOpenOverdue > 0 || g.commitmentsOverdue > 0) && (
            <p className="label text-muted">
              Осталось незакрытым: задач {g.tasksOpenOverdue}
              {g.commitmentsOverdue > 0 && `, обещаний ${g.commitmentsOverdue}`}
            </p>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <p className="section-title mb-3">Как прошёл день</p>
            <textarea
              className={`${field} min-h-[140px] resize-y`}
              placeholder="Что получилось, что нет, что мешало. Своими словами — это для себя, а не для отчётности."
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              onBlur={saveReflection}
            />
            <div className="mt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={saveReflection}
                disabled={busy}
                className="pill label bg-accent text-bg hover:bg-accent-soft disabled:bg-line disabled:text-muted"
              >
                Сохранить
              </button>
              {saved && <span className="label text-muted">Записано</span>}
            </div>
          </div>

          <div>
            <p className="section-title mb-1">Выводы</p>
            <p className="label text-muted mb-3">
              Пока вывод лежит текстом, он ни на что не влияет. Превратите его в задачу — тогда он вернётся.
            </p>

            <form onSubmit={addConclusion} className="flex flex-wrap gap-2">
              <input
                className={`${field} flex-1 min-w-[200px]`}
                placeholder="Что стоит поменять"
                value={conclusion}
                onChange={(e) => setConclusion(e.target.value)}
              />
              <button
                type="submit"
                disabled={busy || !conclusion.trim()}
                className="pill label bg-accent text-bg hover:bg-accent-soft disabled:bg-line disabled:text-muted"
              >
                Добавить
              </button>
            </form>

            {data.conclusions.length > 0 && (
              <ul className="mt-4 divide-y divide-line border-t border-line">
                {data.conclusions.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2.5">
                    <span className={`label ${c.status === "done" ? "text-muted line-through" : "text-ink"}`}>
                      {c.text}
                    </span>
                    <span className="flex shrink-0 gap-3">
                      {c.task_id ? (
                        <Link href="/admin/crm/tasks" className="label text-muted hover:text-accent">
                          стал задачей →
                        </Link>
                      ) : (
                        c.status === "open" && (
                          <>
                            <button
                              type="button"
                              onClick={() => send({ action: "to_task", id: c.id })}
                              disabled={busy}
                              className="label text-accent hover:underline"
                            >
                              В задачу
                            </button>
                            <button
                              type="button"
                              onClick={() => send({ action: "close", id: c.id })}
                              disabled={busy}
                              className="label text-muted hover:text-ink"
                            >
                              Закрыть
                            </button>
                          </>
                        )
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
