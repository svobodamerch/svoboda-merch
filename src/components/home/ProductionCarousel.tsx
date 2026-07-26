"use client";

import { productionPhotos, isVideo } from "@/lib/media";

/**
 * Карусель кадров с производства под плитками в блоке «О нас».
 *
 * Прокрутка с примагничиванием: кадр всегда останавливается ровно
 * по краю. Следующий подглядывает справа — видно, что лента длиннее
 * экрана, и её хочется листать.
 */
export function ProductionCarousel() {
  if (productionPhotos.length === 0) {
    return (
      <div className="mt-4 flex h-[120px] items-center justify-center rounded-2xl bg-bg">
        <span className="label text-muted">здесь будут кадры с производства</span>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="scrollbar-hide flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1">
        {productionPhotos.map((item, i) => (
          <figure
            key={i}
            className="relative h-[150px] w-[200px] shrink-0 snap-start overflow-hidden rounded-2xl bg-bg"
          >
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
              <img src={item.src} alt={item.caption ?? ""} className="h-full w-full object-cover" />
            )}

            {item.caption && (
              <figcaption className="label absolute inset-x-0 bottom-0 bg-ink/55 px-2 py-1 text-[9px] text-bg">
                {item.caption}
              </figcaption>
            )}
          </figure>
        ))}
      </div>

      <p className="label text-muted mt-2">← листается вбок</p>
    </div>
  );
}
