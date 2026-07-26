"use client";

import { useState } from "react";
import { assortmentMedia, isVideo } from "@/lib/media";

/**
 * Список ассортимента с оживающей картинкой справа.
 *
 * Наведение меняет снимок в панели: все изображения лежат стопкой
 * и переключаются прозрачностью, поэтому смена происходит без
 * подгрузки и мигания.
 *
 * На телефоне наведения нет — панель скрыта, остаётся чистый список.
 */
export function AssortmentGallery({
  items,
  accentLast,
}: {
  items: string[];
  /** Мелкий кегль для второстепенного списка (сувенирка) */
  accentLast?: boolean;
}) {
  const [active, setActive] = useState(0);

  const withMedia = items.filter((i) => assortmentMedia[i]);
  const hasMedia = withMedia.length > 0;

  return (
    <div className={hasMedia ? "grid gap-8 md:grid-cols-[1fr_260px]" : ""}>
      <ul className="space-y-1" onMouseLeave={() => setActive(0)}>
        {items.map((item, i) => (
          <li key={item}>
            <button
              type="button"
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              className={`display block text-left transition-colors duration-200 ${
                active === i && hasMedia ? "text-accent" : "text-ink"
              }`}
              style={{
                fontSize: accentLast
                  ? "clamp(1.05rem, 2.6vw, 1.5rem)"
                  : "clamp(1.3rem, 4vw, 2.2rem)",
              }}
            >
              {item}
            </button>
          </li>
        ))}
      </ul>

      {hasMedia && (
        <div className="hidden md:block">
          <div className="sticky top-24 aspect-[3/4] overflow-hidden rounded-2xl bg-bg">
            {items.map((item, i) => {
              const src = assortmentMedia[item];
              if (!src) return null;

              return (
                <div
                  key={item}
                  className="absolute inset-0 transition-opacity duration-500"
                  style={{ opacity: active === i ? 1 : 0 }}
                >
                  {isVideo(src) ? (
                    <video
                      src={src}
                      className="h-full w-full object-cover"
                      muted
                      loop
                      autoPlay
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={src} alt={item} className="h-full w-full object-cover" />
                  )}
                </div>
              );
            })}

            {/* Если у наведённой позиции снимка ещё нет */}
            {!assortmentMedia[items[active]] && (
              <div className="flex h-full items-center justify-center px-4">
                <p className="label text-muted text-center">{items[active]}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
