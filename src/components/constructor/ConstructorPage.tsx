"use client";

import dynamic from "next/dynamic";
import { useRef, useState, type FormEvent } from "react";
import { Container } from "@/components/ui/Container";
import { defaultConstructorProduct } from "@/lib/constructor-products";
import type { DesignerCanvasHandle } from "./DesignerCanvas";

// Konva рисует в <canvas> — на сервере рендерить нечем, поэтому только клиент.
const DesignerCanvas = dynamic(
  () => import("./DesignerCanvas").then((m) => m.DesignerCanvas),
  { ssr: false, loading: () => <CanvasSkeleton /> },
);

function CanvasSkeleton() {
  return (
    <div className="mx-auto flex aspect-[520/620] max-w-[760px] items-center justify-center rounded-2xl bg-surface">
      <p className="label text-muted">Загружаем редактор…</p>
    </div>
  );
}

type SubmitState = "idle" | "sending" | "done" | "error" | "empty";

export function ConstructorPage() {
  const canvasRef = useRef<DesignerCanvasHandle>(null);
  const product = defaultConstructorProduct;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [telegram, setTelegram] = useState("");
  const [comment, setComment] = useState("");
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [state, setState] = useState<SubmitState>("idle");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !rightsConfirmed) return;

    if (!canvasRef.current?.hasLayers()) {
      setState("empty");
      return;
    }

    const designImage = canvasRef.current.exportPng();
    if (!designImage) {
      setState("error");
      return;
    }

    setState("sending");
    try {
      const res = await fetch("/api/design-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          telegram: telegram.trim(),
          comment: comment.trim(),
          productName: product.name,
          colorLabel: product.colorLabel,
          designImage,
        }),
      });
      if (!res.ok) throw new Error();
      setState("done");
    } catch {
      setState("error");
    }
  };

  const inputClass =
    "w-full rounded-xl border border-line bg-bg px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-accent";

  return (
    <section className="pb-24">
      <Container>
        <div className="mb-10 text-center">
          <p className="label text-muted">{product.name} · {product.colorLabel}</p>
        </div>

        <DesignerCanvas ref={canvasRef} product={product} />

        <div className="mx-auto mt-16 max-w-md">
          {state === "done" ? (
            <div className="rounded-2xl bg-tint p-7 text-center">
              <p className="label-lg text-ink mb-3">Заявка принята</p>
              <p className="label text-ink-soft leading-relaxed">
                Дизайн получили, свяжемся в течение рабочего дня и обсудим детали.
              </p>
            </div>
          ) : (
            <form onSubmit={submit} noValidate>
              <h2 className="mb-1 text-ink" style={{ fontWeight: 600, fontSize: "1.2rem" }}>
                Отправить дизайн на просчёт
              </h2>
              <p className="mb-5 text-muted text-sm">
                Пришлём цену за тираж и поможем довести макет до печати.
              </p>

              <div className="space-y-3">
                <input
                  className={inputClass}
                  placeholder="Имя *"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <input
                  className={inputClass}
                  type="tel"
                  placeholder="Телефон *"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
                <input
                  className={inputClass}
                  placeholder="Телеграм — @username"
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                />
                <textarea
                  className={`${inputClass} resize-none`}
                  rows={3}
                  placeholder="Тираж, сроки, пожелания…"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>

              <label className="mt-4 flex items-start gap-2.5 text-xs text-muted leading-relaxed">
                <input
                  type="checkbox"
                  checked={rightsConfirmed}
                  onChange={(e) => setRightsConfirmed(e.target.checked)}
                  className="mt-0.5"
                  required
                />
                <span>
                  Подтверждаю, что имею права на загруженные изображения и текст, и
                  соглашаюсь с{" "}
                  <a href="/legal/privacy" className="underline hover:text-ink">
                    политикой конфиденциальности
                  </a>
                </span>
              </label>

              {state === "empty" && (
                <p className="label mt-3 rounded-xl bg-surface px-4 py-3 text-ink">
                  Добавьте текст или фото на футболку перед отправкой
                </p>
              )}
              {state === "error" && (
                <p className="label mt-3 rounded-xl bg-surface px-4 py-3 text-ink">
                  Не отправилось. Напишите на mail@svoboda.site
                </p>
              )}

              <button
                type="submit"
                disabled={state === "sending" || !name.trim() || !phone.trim() || !rightsConfirmed}
                className="pill label mt-4 w-full justify-center bg-accent py-4 text-bg transition-colors hover:bg-accent-soft disabled:bg-surface disabled:text-muted"
              >
                {state === "sending" ? "Отправляем…" : "Отправить заявку"}
              </button>
            </form>
          )}
        </div>
      </Container>
    </section>
  );
}
