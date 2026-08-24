"use client";

import { useState } from "react";
import type { QuickAction } from "@/lib/crm/quickUpdate";

/**
 * Свободный текст → список действий → подтверждение. Разбор и применение
 * разделены нарочно: финансовые правки без подтверждения не делаем нигде
 * в системе, а здесь на входе вольный текст, а не форма — тем более нужен
 * шаг проверки перед тем, как что-то поменяется в деньгах.
 */

const actionLabel = (a: QuickAction): string => {
  if (a.type === "payment") {
    const sum = a.amount === "full" ? "весь остаток" : `${(a.amount / 100).toLocaleString("ru-RU")} ₽`;
    const dir = a.direction === "in" ? "Поступление" : "Оплата";
    return [
      `${dir}: ${sum}`,
      a.legalEntityName ? `на ${a.legalEntityName}` : null,
      a.comment || null,
    ]
      .filter(Boolean)
      .join(" · ");
  }
  if (a.type === "task") return `Задача: ${a.title}`;
  return `Заметка: ${a.text}`;
};

export function QuickUpdate({ orderId, onApplied }: { orderId: string; onApplied: () => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [actions, setActions] = useState<QuickAction[]>([]);
  const [excluded, setExcluded] = useState<Set<number>>(new Set());
  const [unparsed, setUnparsed] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setText("");
    setActions([]);
    setExcluded(new Set());
    setUnparsed(null);
    setError(null);
  };

  const parse = async () => {
    if (!text.trim()) return;
    setBusy(true);
    setError(null);
    const r = await fetch(`/api/crm/orders/${orderId}/quick-update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) {
      setError(d.error || "Не удалось разобрать");
      return;
    }
    setActions(d.actions);
    setExcluded(new Set());
    setUnparsed(d.unparsed);
  };

  const apply = async () => {
    const toApply = actions.filter((_, i) => !excluded.has(i));
    if (toApply.length === 0) return;
    setBusy(true);
    setError(null);
    const r = await fetch(`/api/crm/orders/${orderId}/quick-update`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actions: toApply }),
    });
    setBusy(false);
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      setError(d.error || "Не удалось применить");
      return;
    }
    reset();
    setOpen(false);
    onApplied();
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="pill label bg-surface text-ink-soft hover:bg-tint"
      >
        Быстрое обновление
      </button>
    );
  }

  return (
    <div className="rounded-2xl bg-surface p-5">
      <p className="section-title mb-1">Быстрое обновление</p>
      <p className="label text-muted mb-3">
        Опишите словами, что произошло — оплаты, звонки, что ещё нужно сделать. Разберу на действия
        и покажу перед тем, как что-то поменять.
      </p>

      {actions.length === 0 ? (
        <>
          <textarea
            className="w-full min-h-[90px] resize-y rounded-xl border border-line bg-bg px-3 py-2.5 text-[13px] text-ink outline-none focus:border-accent"
            placeholder="Оплачено полностью на ИП Остапович, вызвал курьера, все сдано, нужно подписать документы"
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoFocus
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={parse}
              disabled={busy || !text.trim()}
              className="pill label bg-accent text-bg hover:bg-accent-soft disabled:bg-line disabled:text-muted"
            >
              {busy ? "Разбираю…" : "Разобрать"}
            </button>
            <button
              type="button"
              onClick={() => {
                reset();
                setOpen(false);
              }}
              className="label text-muted hover:text-ink"
            >
              Отмена
            </button>
          </div>
        </>
      ) : (
        <>
          <ul className="space-y-2">
            {actions.map((a, i) => (
              <li key={i} className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={!excluded.has(i)}
                  onChange={(e) =>
                    setExcluded((prev) => {
                      const next = new Set(prev);
                      if (e.target.checked) next.delete(i);
                      else next.add(i);
                      return next;
                    })
                  }
                  className="mt-1"
                />
                <span className={`label ${excluded.has(i) ? "text-muted line-through" : "text-ink"}`}>
                  {actionLabel(a)}
                </span>
              </li>
            ))}
          </ul>

          {unparsed && (
            <p className="label text-muted mt-3 rounded-lg bg-bg px-3 py-2">Не разобрано: «{unparsed}»</p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={apply}
              disabled={busy || excluded.size === actions.length}
              className="pill label bg-accent text-bg hover:bg-accent-soft disabled:bg-line disabled:text-muted"
            >
              {busy ? "Применяю…" : "Применить"}
            </button>
            <button type="button" onClick={reset} className="label text-muted hover:text-ink">
              Заново
            </button>
            <button
              type="button"
              onClick={() => {
                reset();
                setOpen(false);
              }}
              className="label text-muted hover:text-ink"
            >
              Отмена
            </button>
          </div>
        </>
      )}

      {error && <p className="label mt-3 text-red-700">{error}</p>}
    </div>
  );
}
