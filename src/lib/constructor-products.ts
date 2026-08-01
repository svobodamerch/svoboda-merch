/**
 * Конфиг товаров конструктора дизайна.
 *
 * Пока один товар с плейсхолдер-макетом (SVG-силуэт, см. TshirtMockupSvg).
 * Когда придёт реальное плоское фото товара — добавляем его в
 * public/images/constructor/ и меняем mockupImage, printZone здесь же.
 *
 * printZone и MOCKUP_VIEWBOX — в одной условной единице (px макета),
 * не в мм: серверного print-ready экспорта на этом этапе нет, зона нужна
 * только чтобы ограничить область редактирования на экране.
 */

export type PrintZone = { x: number; y: number; width: number; height: number };

export type ConstructorProduct = {
  id: string;
  name: string;
  colorLabel: string;
  printZone: PrintZone;
};

/** Условные единицы координат SVG-макета (viewBox). */
export const MOCKUP_VIEWBOX = { width: 520, height: 620 } as const;

/**
 * Ширина, с которой весь блок макета рендерится на экране (px), высота — по
 * пропорции viewBox. Задаёт заодно масштаб интерактивной зоны печати —
 * при 760 зона ~230×275px, комфортно для перетаскивания/ресайза слоёв.
 */
export const MOCKUP_DISPLAY_WIDTH = 760;

export const constructorProducts: ConstructorProduct[] = [
  {
    id: "tee-classic",
    name: "Тяжёлая футболка",
    colorLabel: "Белый",
    printZone: { x: 180, y: 220, width: 160, height: 190 },
  },
];

export const defaultConstructorProduct = constructorProducts[0];

/**
 * Предполагаемый реальный размер зоны печати на изделии (мм) — грубая
 * оценка для светофора разрешения загружаемых картинок, не калибровка
 * под реальное фото. Типичный принт на груди — примерно A4.
 * Когда появится реальный мокап с реальными пропорциями, поправить.
 */
export const PRINT_ZONE_REAL_MM = { width: 250, height: 300 } as const;
