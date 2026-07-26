"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

type FormState = "idle" | "submitting" | "success" | "error";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function LeadModal({ open, onClose }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [telegram, setTelegram] = useState("");
  const [comment, setComment] = useState("");
  const [state, setState] = useState<FormState>("idle");
  const overlayRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Блокируем скролл при открытии
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Фокус на первое поле при открытии
  useEffect(() => {
    if (open) setTimeout(() => firstInputRef.current?.focus(), 50);
  }, [open]);

  // Закрытие по Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const reset = () => {
    setName(""); setPhone(""); setTelegram(""); setComment(""); setState("idle");
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    setState("submitting");

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          telegram: telegram.trim(),
          productType: "Не указано",
          quantity: "1",
          comment: comment.trim(),
        }),
      });

      if (!res.ok) throw new Error();
      setState("success");
    } catch {
      setState("error");
    }
  };

  if (!open) return null;

  const inputClass =
    "w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink placeholder:text-muted outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/10";

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Оставить заявку"
      onClick={(e) => { if (e.target === overlayRef.current) handleClose(); }}
      style={{ backgroundColor: "rgba(17,17,17,0.55)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-paper shadow-2xl"
        style={{ padding: "clamp(1.5rem, 5vw, 2.5rem)" }}
      >
        {/* Закрыть */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface hover:text-ink"
          aria-label="Закрыть"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>

        {state === "success" ? (
          /* Успех */
          <div className="py-6 text-center">
            <div
              className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full"
              style={{ backgroundColor: "color-mix(in srgb, var(--color-accent) 12%, transparent)" }}
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M4 11l5 5L18 6" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="mb-2 text-ink" style={{ fontWeight: 600, fontSize: "1.2rem" }}>
              Заявка принята
            </h3>
            <p className="text-muted" style={{ fontSize: "0.9rem", lineHeight: 1.6 }}>
              Свяжемся с вами в&nbsp;течение часа. Спасибо!
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="mt-6 rounded-full px-6 py-2.5 text-sm text-paper transition-opacity hover:opacity-85"
              style={{ backgroundColor: "var(--color-accent)", fontWeight: 500 }}
            >
              Закрыть
            </button>
          </div>
        ) : (
          /* Форма */
          <form onSubmit={handleSubmit} noValidate>
            <h2 className="mb-1 text-ink" style={{ fontWeight: 600, fontSize: "1.3rem", letterSpacing: "-0.01em" }}>
              Оставить заявку
            </h2>
            <p className="mb-6 text-muted" style={{ fontSize: "0.875rem", lineHeight: 1.5 }}>
              Напишите имя и телефон — перезвоним и обсудим детали.
            </p>

            <div className="space-y-3">
              <div>
                <label htmlFor="modal-name" className="mb-1.5 block text-xs font-medium text-ink-soft">
                  Имя <span className="text-accent">*</span>
                </label>
                <input
                  ref={firstInputRef}
                  id="modal-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Алексей"
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="modal-phone" className="mb-1.5 block text-xs font-medium text-ink-soft">
                  Телефон <span className="text-accent">*</span>
                </label>
                <input
                  id="modal-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 (999) 123-45-67"
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="modal-telegram" className="mb-1.5 block text-xs font-medium text-ink-soft">
                  Телеграм
                </label>
                <input
                  id="modal-telegram"
                  type="text"
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                  placeholder="@username"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="modal-comment" className="mb-1.5 block text-xs font-medium text-ink-soft">
                  Что интересует?
                </label>
                <textarea
                  id="modal-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Футболки для команды, 50 шт, нужно к маю…"
                  rows={3}
                  className={`${inputClass} resize-none`}
                />
              </div>
            </div>

            {state === "error" && (
              <p className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">
                Не удалось отправить. Напишите нам на{" "}
                <a href="mailto:mail@svoboda.site" className="underline">mail@svoboda.site</a>
              </p>
            )}

            <button
              type="submit"
              disabled={state === "submitting" || !name.trim() || !phone.trim()}
              className="mt-5 w-full rounded-full py-3.5 text-sm text-paper transition-opacity hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: "var(--color-accent)", fontWeight: 500, letterSpacing: "0.02em" }}
            >
              {state === "submitting" ? "Отправляем…" : "Отправить заявку"}
            </button>

            <p className="mt-3 text-center text-muted" style={{ fontSize: "0.72rem", lineHeight: 1.5 }}>
              Нажимая кнопку, вы соглашаетесь на обработку персональных данных
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
