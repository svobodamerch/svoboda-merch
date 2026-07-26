"use client";

import { isVideo, type MediaItem } from "@/lib/mediaShared";

/**
 * Стопка вертикальных роликов в первом экране.
 *
 * Карточки намеренно повёрнуты на разные углы и слегка перекрываются —
 * так блок читается как живая пачка рилсов, а не как аккуратная сетка.
 * Плавное покачивание задано в globals.css (анимация float).
 *
 * Углы и сдвиги заданы вручную: случайные значения на каждый рендер
 * дали бы разную картинку на сервере и в браузере.
 */

const LAYOUT = [
  { rotate: -7, x: 0, y: 18, z: 1, delay: "0s" },
  { rotate: 4, x: 96, y: 0, z: 3, delay: "1.1s" },
  { rotate: -2.5, x: 188, y: 34, z: 2, delay: "2.2s" },
];

export function HeroReels({ items: heroReels }: { items: MediaItem[] }) {
  const cards = LAYOUT.map((pos, i) => ({ pos, item: heroReels[i] }));

  return (
    <div
      className="relative mx-auto hidden h-[420px] w-[300px] lg:block"
      aria-hidden={heroReels.length === 0}
    >
      {cards.map(({ pos, item }, i) => (
        <div
          key={i}
          className="absolute h-[300px] w-[168px] overflow-hidden rounded-2xl bg-surface shadow-[0_18px_40px_-24px_rgba(34,48,79,0.45)]"
          style={{
            transform: `translate(${pos.x}px, ${pos.y}px) rotate(${pos.rotate}deg)`,
            zIndex: pos.z,
            animation: `float 7s ease-in-out ${pos.delay} infinite`,
          }}
        >
          {item && isVideo(item.src) ? (
            <video
              src={item.src}
              className="h-full w-full object-cover"
              muted
              loop
              autoPlay
              playsInline
              preload="metadata"
            />
          ) : item ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={item.src} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="label text-muted">видео</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
