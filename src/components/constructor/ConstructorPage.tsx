"use client";

import dynamic from "next/dynamic";
import { useRef, useState, type FormEvent } from "react";
import { Container } from "@/components/ui/Container";
import { defaultConstructorProduct, type ViewId } from "@/lib/constructor-products";
import type { DesignerCanvasHandle } from "./DesignerCanvas";

// Konva рисует в <canvas> — на сервере рендерить нечем, поэтому только клиент.
const DesignerCanvas = dynamic(
  () => import("./DesignerCanvas").then((m) => m.DesignerCanvas),
  { ssr: false, loading: () => <CanvasSkeleton /> },
);

function CanvasSkeleton() {
  return (
    <div className="mx-auto flex aspect-[650/760] max-w-[640px] items-center justify-center rounded-2xl bg-surface">
      <p className="label text-muted">Загружаем редактор…</p>
    </div>
  );
}

type SubmitState = "idle" | "sending" | "done" | "error" | "empty";

export function ConstructorPage() {
  const product = defaultConstructorProduct;
  const canvasRefs = useRef<Record<ViewId, DesignerCanvasHandle | null>>({
    front: null,
    back: null,
    side: null,
  });

  const [activeView, setActiveView] = useState<ViewId>(product.views[0].id);
  const [colorId, setColorId] = useState(product.colors[0].id);
  const color = product.colors.find((c) => c.id === colorId) ?? product.colors[0];

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [telegram, setTelegram] = useState("");
  const [comment, setComment] = useState("");
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [state, setState] = useState<SubmitState>("idle");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !rightsConfirmed) return;

    const designs = product.views
      .map((v) => {
        const handle = canvasRefs.current[v.id];
        if (!handle?.hasLayers()) return null;
        const image = handle.exportPng();
        return image ? { view: v.id, label: v.label, image } : null;
      })
      .filter((d): d is { view: ViewId; label: string; image: string } => d !== null);

    if (designs.length === 0) {
      setState("empty");
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
          colorLabel: color.label,
          designs,
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
        <div className="mx-auto mb-10 max-w-2xl rounded-2xl border border-line bg-tint px-6 py-5 text-center">
          <p className="label-lg text-ink">Раздел в стадии разработки</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Сейчас уже принимаем заказы: быстро делаем макет по вашему дизайну вручную и присылаем на
            согласование — без ожидания автоматики.
          </p>
        </div>

        <div className="mb-6 flex justify-center gap-2">
          {product.views.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setActiveView(v.id)}
              className={`pill label px-5 py-2 transition-colors ${
                activeView === v.id ? "bg-accent text-bg" : "bg-surface text-ink hover:bg-line"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        {product.views.map((v) => (
          <div key={v.id} className={activeView === v.id ? "" : "hidden"}>
            <DesignerCanvas
              ref={(handle) => {
                canvasRefs.current[v.id] = handle;
              }}
              view={v}
              colorHex={color.hex}
            />
          </div>
        ))}

        <div className="mx-auto mt-8 flex max-w-md flex-col items-center gap-3">
          <div className="flex flex-wrap justify-center gap-2">
            {product.colors.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setColorId(c.id)}
                title={c.label}
                aria-label={c.label}
                aria-pressed={colorId === c.id}
                className="h-8 w-8 rounded-full border-2 transition-transform"
                style={{
                  backgroundColor: c.hex ?? "#efe7da",
                  borderColor: colorId === c.id ? "var(--color-accent)" : "var(--color-line)",
                  transform: colorId === c.id ? "scale(1.12)" : "scale(1)",
                }}
              />
            ))}
          </div>
          <p className="label text-muted text-center">
            {color.label} · цвет ориентировочный — финальный согласуем с вами перед печатью
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-md">
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
                  Добавьте текст или фото хотя бы на один из видов (перед/спина/бок) перед отправкой
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
