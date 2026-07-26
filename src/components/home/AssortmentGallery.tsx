"use client";

import { useState } from "react";
import { assortmentMedia, isVideo } from "@/lib/media";

/**
 * Список ассортимента с картинкой, которая оживает при взаимодействии.
 *
 * На большом экране — панель справа: снимки лежат стопкой и меняются
 * прозрачностью, поэтому переключение мгновенное, без подгрузки.
 *
 * На телефоне наведения нет, поэтому по нажатию картинка мягко
 * раскрывается прямо под пунктом. Высота анимируется через
 * grid-template-rows 0fr → 1fr — так не нужно знать высоту заранее
 * и не бывает рывка в конце.
 *
 * Движение намеренно сдержанное: длинная плавная кривая, небольшой
 * сдвиг и еле заметное приближение вместо резкого появления.
 */

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

function Frame({ src, alt }: { src: string; alt: string }) {
  return isVideo(src) ? (
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
    <img src={src} alt={alt} className="h-full w-full object-cover" />
  );
}

export function AssortmentGallery({
  items,
  accentLast,
}: {
  items: string[];
  /** Мелкий кегль для второстепенного списка (сувенирка) */
  accentLast?: boolean;
}) {
  const [active, setActive] = useState(0);
  const [openOnPhone, setOpenOnPhone] = useState<number | null>(null);

  const hasMedia = items.some((i) => assortmentMedia[i]);
  const fontSize = accentLast
    ? "clamp(1.05rem, 2.6vw, 1.5rem)"
    : "clamp(1.3rem, 4vw, 2.2rem)";

  return (
    <div className={hasMedia ? "grid gap-8 md:grid-cols-[1fr_240px]" : ""}>
      <ul onMouseLeave={() => setActive(0)}>
        {items.map((item, i) => {
          const src = assortmentMedia[item];
          const isActive = active === i && hasMedia;
          const isOpen = openOnPhone === i;

          return (
            <li key={item}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => {
                  setActive(i);
                  setOpenOnPhone(isOpen ? null : i);
                }}
                className="group flex w-full items-center gap-3 py-0.5 text-left"
                aria-expanded={src ? isOpen : undefined}
              >
                {/* Метка появляется у активного пункта */}
                <span
                  aria-hidden
                  className="hidden shrink-0 bg-accent md:block"
                  style={{
                    width: isActive ? "18px" : "0px",
                    height: "2px",
                    opacity: isActive ? 1 : 0,
                    transition: `width 450ms ${EASE}, opacity 300ms ease`,
                  }}
                />

                <span
                  className={`display ${isActive ? "text-accent" : "text-ink"}`}
                  style={{
                    fontSize,
                    transition: `color 300ms ease, transform 450ms ${EASE}`,
                    transform: isActive ? "translateX(2px)" : "none",
                  }}
                >
                  {item}
                </span>
              </button>

              {/* Раскрывающийся кадр — только на телефоне */}
              {src && (
                <div
                  className="grid md:hidden"
                  style={{
                    gridTemplateRows: isOpen ? "1fr" : "0fr",
                    transition: `grid-template-rows 500ms ${EASE}`,
                  }}
                >
                  <div className="overflow-hidden">
                    <div
                      className="mb-3 mt-2 aspect-[4/3] overflow-hidden rounded-xl bg-bg"
                      style={{
                        opacity: isOpen ? 1 : 0,
                        transform: isOpen ? "scale(1)" : "scale(1.04)",
                        transition: `opacity 450ms ${EASE} 60ms, transform 600ms ${EASE}`,
                      }}
                    >
                      <Frame src={src} alt={item} />
                    </div>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* Панель на большом экране */}
      {hasMedia && (
        <div className="hidden md:block">
          <div className="sticky top-24 aspect-[3/4] overflow-hidden rounded-2xl bg-bg">
            {items.map((item, i) => {
              const src = assortmentMedia[item];
              if (!src) return null;
              const shown = active === i;

              return (
                <div
                  key={item}
                  className="absolute inset-0"
                  style={{
                    opacity: shown ? 1 : 0,
                    transform: shown ? "scale(1)" : "scale(1.05)",
                    transition: `opacity 450ms ${EASE}, transform 700ms ${EASE}`,
                  }}
                >
                  <Frame src={src} alt={item} />
                </div>
              );
            })}

            {/* У наведённой позиции снимка ещё нет */}
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
