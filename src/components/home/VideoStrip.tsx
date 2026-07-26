"use client";

import { isVideo, type MediaItem } from "@/lib/mediaShared";

/**
 * Невысокая горизонтальная лента роликов.
 *
 * Содержимое продублировано и уезжает влево бесконечным циклом:
 * когда первая половина уходит за край, вторая оказывается ровно
 * на её месте — стык незаметен. При наведении лента замирает,
 * чтобы можно было рассмотреть.
 */
export function VideoStrip({ items: clientReel }: { items: MediaItem[] }) {
  if (clientReel.length === 0) {
    return (
      <div className="flex h-[150px] items-center justify-center rounded-2xl bg-surface">
        <span className="label text-muted">здесь будет видеоряд изделий</span>
      </div>
    );
  }

  const doubled = [...clientReel, ...clientReel];

  return (
    <div className="marquee overflow-hidden">
      <div className="marquee-track flex gap-3">
        {doubled.map((item, i) => (
          <figure
            key={i}
            className="relative h-[150px] w-[86px] shrink-0 overflow-hidden rounded-xl bg-surface"
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
              <figcaption className="label absolute inset-x-0 bottom-0 bg-ink/60 px-1.5 py-1 text-center text-[9px] text-bg">
                {item.caption}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    </div>
  );
}
