/**
 * Все фото и видео главной страницы собраны здесь.
 *
 * Куда класть файлы — два способа:
 *  1. Положить в public/media/ и указать путь «/media/имя.jpg».
 *     Файлы попадают в сборку, поэтому после добавления нужен деплой.
 *  2. Загрузить через CRM магазина и указать выданный адрес
 *     «/shop/uploads/имя.jpg». Появляется сразу, без пересборки.
 *
 * Пустой массив — не ошибка: компоненты покажут аккуратную заглушку.
 */

export interface MediaItem {
  /** Путь к файлу */
  src: string;
  /** Подпись: в галерее ассортимента показывается под снимком */
  caption?: string;
}

/**
 * Ассортимент: снимок для каждой позиции списка.
 * Ключ должен совпадать с названием в списке на главной.
 */
export const assortmentMedia: Record<string, string> = {
  // "Футболки": "/media/assortment/tee.jpg",
  // "Рубашки": "/media/assortment/shirt.jpg",
};

/** Вертикальные ролики в первом экране — как рилсы */
export const heroReels: MediaItem[] = [
  // { src: "/media/reels/1.mp4" },
];

/** Горизонтальная лента роликов рядом с клиентами */
export const clientReel: MediaItem[] = [
  // { src: "/media/clients/ngs.mp4", caption: "NGS.RU" },
];

/** Фотографии с производства в блоке «О нас» */
export const productionPhotos: MediaItem[] = [
  // { src: "/media/production/1.jpg", caption: "Раскрой" },
];

export const isVideo = (src: string) => /\.(mp4|mov|webm)$/i.test(src);
