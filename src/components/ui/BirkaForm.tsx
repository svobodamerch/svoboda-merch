"use client";

import { useState, type FormEvent } from "react";

type State = "idle" | "sending" | "done" | "error";

type Props = {
  /** Метка источника в CRM — разные страницы шлют разные значения */
  source?: "birka" | "qr";
};

const SOURCE_LABELS: Record<NonNullable<Props["source"]>, string> = {
  birka: "БИРКА",
  qr: "QR",
};

export function BirkaForm({ source = "birka" }: Props) {
  const [form, setForm] = useState({ name: "", phone: "", telegram: "", comment: "" });
  const [state, setState] = useState<State>("idle");
  const label = SOURCE_LABELS[source];

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) return;
    setState("sending");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          telegram: form.telegram.trim(),
          source,
          productType: `Заявка с ${label}`,
          quantity: "1",
          comment: form.comment.trim()
            ? `[${label}] ${form.comment.trim()}`
            : `[${label}] Заявка со страницы ${label}`,
        }),
      });
      if (!res.ok) throw new Error();
      setState("done");
    } catch {
      setState("error");
    }
  };

  const field =
    "w-full rounded-xl border border-line bg-bg px-4 py-3.5 text-[13px] text-ink outline-none transition-colors focus:border-accent";

  if (state === "done") {
    return (
      <div className="rounded-2xl bg-tint p-7 text-center">
        <p className="label-lg text-ink mb-3">Заявка принята</p>
        <p className="label text-ink-soft leading-relaxed">
          Свяжемся с вами в течение рабочего дня
          <br />и обсудим детали.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="space-y-3">
        <input
          className={field}
          placeholder="Имя *"
          value={form.name}
          onChange={set("name")}
          required
        />
        <input
          className={field}
          type="tel"
          placeholder="Телефон *"
          value={form.phone}
          onChange={set("phone")}
          required
        />
        <input
          className={field}
          placeholder="Телеграм — @username"
          value={form.telegram}
          onChange={set("telegram")}
        />
        <textarea
          className={`${field} resize-none`}
          rows={3}
          placeholder="Что нужно? Тираж, изделие, сроки…"
          value={form.comment}
          onChange={set("comment")}
        />
      </div>

      {state === "error" && (
        <p className="label mt-3 rounded-xl bg-surface px-4 py-3 text-ink">
          Не отправилось. Напишите на mail@svoboda.site
        </p>
      )}

      <button
        type="submit"
        disabled={state === "sending" || !form.name.trim() || !form.phone.trim()}
        className="pill label mt-4 w-full justify-center bg-accent py-4 text-bg transition-colors hover:bg-accent-soft disabled:bg-surface disabled:text-muted"
      >
        {state === "sending" ? "Отправляем…" : "Отправить заявку"}
      </button>

      <p className="label text-muted mt-3 leading-relaxed">
        Нажимая кнопку, вы соглашаетесь с{" "}
        <a href="/legal/privacy" className="underline hover:text-ink">
          политикой конфиденциальности
        </a>
      </p>
    </form>
  );
}
