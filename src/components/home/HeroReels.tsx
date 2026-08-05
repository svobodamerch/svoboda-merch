"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isVideo, type MediaItem } from "@/lib/mediaShared";

/**
 * Карусель вертикальных роликов в первом экране.
 *
 * Лента крутится сама, без остановок — как бегущая строка. Ряд карточек
 * задублирован, поэтому в момент, когда прокрутка доходит до половины
 * ширины, её незаметно отматывает назад на ту же половину — шов не виден.
 *
 * Прокрутка остаётся родной (overflow-x scroll), так что колесо, свайп
 * и перетаскивание работают как обычно и на время останавливают автобег.
 *
 * Клик по карточке открывает ролик крупно, с управлением и звуком.
 *
 * Наклоны заданы списком, а не случайно: случайные дали бы разную
 * картинку на сервере и в браузере.
 */

const TILT = [-3.5, 2.5, -1.5, 3, -2.5, 1.5];

/** Скорость бега ленты (px/мс) и тишина после касания, после которой бег возвращается */
const SPEED_PX_MS = 0.035;
const RESUME_MS = 2500;

export function HeroReels({ items }: { items: MediaItem[] }) {
  const track = useRef<HTMLDivElement>(null);
  const paused = useRef(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [opened, setOpened] = useState<MediaItem | null>(null);

  // Дублируем ленту, чтобы бег был непрерывным и без видимого перехода
  const loopItems = items.length > 1 ? [...items, ...items] : items;

  /** Человек тронул ленту — молчим, пока не выдержит паузу */
  const holdOff = useCallback(() => {
    paused.current = true;
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      paused.current = false;
    }, RESUME_MS);
  }, []);

  useEffect(() => {
    const el = track.current;
    if (!el || items.length < 2) return;

    let raf: number;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = now - last;
      last = now;

      if (!paused.current) {
        const half = el.scrollWidth / 2;
        el.scrollLeft += SPEED_PX_MS * dt;
        if (el.scrollLeft >= half) el.scrollLeft -= half;
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [items.length]);

  useEffect(
    () => () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
    },
    [],
  );

  if (items.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-2xl bg-surface lg:w-[340px]">
        <span className="label text-muted">здесь будут ролики</span>
      </div>
    );
  }

  return (
    <>
      <div className="min-w-0 lg:w-[400px] xl:w-[560px]">
        <div
          ref={track}
          className="scrollbar-hide -mx-4 flex min-w-0 gap-3 overflow-x-auto px-4 py-4 lg:mx-0 lg:px-0"
          onPointerDown={holdOff}
          onWheel={holdOff}
          onMouseEnter={() => {
            paused.current = true;
          }}
          onMouseLeave={() => {
            paused.current = false;
          }}
          aria-label="Ролики о производстве"
        >
          {loopItems.map((item, i) => (
            <button
              key={`${item.src}-${i}`}
              type="button"
              onClick={() => setOpened(item)}
              aria-label={item.caption || "Открыть ролик"}
              className="w-[150px] shrink-0 overflow-hidden rounded-2xl bg-surface shadow-[0_16px_36px_-24px_rgba(34,48,79,0.5)] sm:w-[170px]"
              style={{ rotate: `${TILT[i % TILT.length]}deg` }}
            >
              <div className="aspect-[9/16]">
                {isVideo(item.src) ? (
                  <video
                    src={item.src}
                    className="h-full w-full object-cover"
                    muted
                    loop
                    autoPlay
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={item.src}
                    alt={item.caption ?? ""}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {opened && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90 p-4"
          onClick={() => setOpened(null)}
        >
          <button
            type="button"
            onClick={() => setOpened(null)}
            aria-label="Закрыть"
            className="absolute right-5 top-5 text-2xl text-bg"
          >
            ✕
          </button>
          <div className="max-h-full max-w-[420px]" onClick={(e) => e.stopPropagation()}>
            {isVideo(opened.src) ? (
              <video
                src={opened.src}
                className="max-h-[85vh] w-full rounded-2xl"
                controls
                autoPlay
                playsInline
              />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={opened.src}
                alt={opened.caption ?? ""}
                className="max-h-[85vh] w-full rounded-2xl object-contain"
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
