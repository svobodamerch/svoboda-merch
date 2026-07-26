"use client";

import { useEffect, useRef, useState } from "react";
import { isVideo, type MediaItem } from "@/lib/mediaShared";

/**
 * Карусель вертикальных роликов в первом экране.
 *
 * Прокрутка родная, с примагничиванием: на телефоне это обычный свайп,
 * на компьютере — колесо или перетаскивание. Поверх — автолистание,
 * которое замолкает, как только человек тронул ленту сам, и возвращается
 * через несколько секунд тишины. Так карусель живая, но не перебивает.
 *
 * Карточки слегка повёрнуты на разные углы — от этого лента читается
 * как стопка рилсов, а не как ровная витрина. Углы заданы списком,
 * а не случайно: случайные дали бы разную картинку на сервере и в браузере.
 */

const TILT = [-3.5, 2.5, -1.5, 3, -2.5, 1.5];

/** Пауза между листаниями и время тишины, после которого оно возвращается */
const STEP_MS = 4200;
const RESUME_MS = 7000;

export function HeroReels({ items }: { items: MediaItem[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Человек тронул ленту — молчим, пока он не отпустит и не выдержит паузу */
  const holdOff = () => {
    setPaused(true);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setPaused(false), RESUME_MS);
  };

  useEffect(() => {
    if (paused || items.length < 2) return;

    const id = setInterval(() => {
      const el = track.current;
      if (!el) return;

      const card = el.firstElementChild as HTMLElement | null;
      if (!card) return;

      // Шаг равен ширине карточки с зазором — ровно расстояние
      // между точками примагничивания, иначе прокрутку отщёлкивает назад
      const step = card.offsetWidth + 12;
      const maxLeft = el.scrollWidth - el.clientWidth;
      const next = el.scrollLeft + step;

      el.scrollTo({ left: next > maxLeft - 4 ? 0 : next, behavior: "smooth" });
    }, STEP_MS);

    return () => clearInterval(id);
  }, [paused, items.length]);

  useEffect(() => () => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
  }, []);

  if (items.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-2xl bg-surface lg:w-[340px]">
        <span className="label text-muted">здесь будут ролики</span>
      </div>
    );
  }

  return (
    <div
      className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 py-4 lg:mx-0 lg:w-[360px] lg:px-0"
      ref={track}
      onPointerDown={holdOff}
      onWheel={holdOff}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Ролики о производстве"
    >
      {items.map((item, i) => (
        <figure
          key={item.src}
          className="w-[150px] shrink-0 snap-start overflow-hidden rounded-2xl bg-surface shadow-[0_16px_36px_-24px_rgba(34,48,79,0.5)] sm:w-[170px]"
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

          {item.caption && (
            <figcaption className="label px-2 py-1.5 text-center text-muted">
              {item.caption}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}
