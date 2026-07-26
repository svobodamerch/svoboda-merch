import fs from "fs";

/**
 * Медиа главной страницы.
 *
 * Список читается из файла во время запроса, а не зашивается в сборку —
 * поэтому загруженное через бота появляется сразу, без деплоя.
 * Сами файлы бот кладёт в папку загрузок магазина, её раздаёт nginx
 * по адресу /shop/uploads/.
 *
 * Если файла нет или он повреждён — возвращаем пустые списки:
 * компоненты покажут аккуратные заглушки, страница не упадёт.
 */

const MEDIA_FILE =
  process.env.MEDIA_FILE || "/var/www/svoboda-bot/data/media.json";

export interface MediaItem {
  src: string;
  caption?: string;
}

export interface SiteMedia {
  /** Снимок для каждой позиции списка ассортимента */
  assortment: Record<string, string>;
  /** Вертикальные ролики в первом экране */
  reels: MediaItem[];
  /** Горизонтальная лента рядом с клиентами */
  clients: MediaItem[];
  /** Кадры с производства в блоке «О нас» */
  production: MediaItem[];
}

const EMPTY: SiteMedia = { assortment: {}, reels: [], clients: [], production: [] };

export function getSiteMedia(): SiteMedia {
  try {
    const raw = JSON.parse(fs.readFileSync(MEDIA_FILE, "utf8"));
    return {
      assortment:
        raw.assortment && typeof raw.assortment === "object" ? raw.assortment : {},
      reels: Array.isArray(raw.reels) ? raw.reels : [],
      clients: Array.isArray(raw.clients) ? raw.clients : [],
      production: Array.isArray(raw.production) ? raw.production : [],
    };
  } catch {
    return EMPTY;
  }
}

export const isVideo = (src: string) => /\.(mp4|mov|webm)$/i.test(src);
