/**
 * Общие типы медиа — без обращения к файловой системе.
 *
 * Отдельный файл нужен, чтобы клиентские компоненты могли их
 * импортировать: в lib/media есть чтение файла через fs,
 * а модулю с fs в браузерном бандле не место.
 */

export interface MediaItem {
  src: string;
  caption?: string;
}

export const isVideo = (src: string) => /\.(mp4|mov|webm)$/i.test(src);
