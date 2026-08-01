/**
 * Конфиг товаров конструктора дизайна.
 *
 * Координаты workArea/guideZone — в пикселях самого фото (image px), не в
 * мм и не в CSS px экрана. Проставлены на глаз по реальным фото
 * (public/images/constructor/tee-*.jpg) — если зона на экране выглядит
 * смещённой, поправить числа здесь, ничего больше трогать не нужно.
 *
 * realMm — предположительный реальный размер guideZone на изделии, нужен
 * только для приблизительного светофора разрешения загружаемых картинок
 * (см. DesignerCanvas). Это не калибровка под печать, финальный макет
 * всё равно готовит печатник вручную.
 */

export type PrintZone = { x: number; y: number; width: number; height: number };

export type ViewId = "front" | "back" | "side";

export type PrintView = {
  id: ViewId;
  label: string;
  image: string;
  imageWidth: number;
  imageHeight: number;
  /** Область, в которой можно свободно двигать слои — не только фикс. рамка. */
  workArea: PrintZone;
  /** Рекомендованный размер принта — показывается как пунктирная подсказка внутри workArea. */
  guideZone: PrintZone;
  realMm: { width: number; height: number };
  /**
   * CSS clip-path (полигон в % от workArea), которым обрезается цветная
   * тонировка — чтобы цвет не заливал серый фон студийного фото вокруг
   * изделия. Приблизительная форма силуэта на глаз, не точная маска —
   * настоящей вырезки фона (фон и кремовая ткань слишком близки по тону
   * для автоматического chroma-key) у нас нет. Если нет — тонировка
   * заливает весь workArea целиком (используется там, где он и так весь
   * занят тканью, напр. вид "бок").
   */
  tintClipPath?: string;
};

export type ColorSwatch = {
  id: string;
  label: string;
  /** null — исходный цвет фото, без тонировки. */
  hex: string | null;
};

export type ConstructorProduct = {
  id: string;
  name: string;
  views: PrintView[];
  colors: ColorSwatch[];
};

export const constructorProducts: ConstructorProduct[] = [
  {
    id: "tee-oversize",
    name: "Футболка оверсайз",
    views: [
      {
        id: "front",
        label: "Перед",
        image: "/images/constructor/tee-front.jpg",
        imageWidth: 1024,
        imageHeight: 1024,
        workArea: { x: 250, y: 170, width: 520, height: 700 },
        guideZone: { x: 360, y: 230, width: 300, height: 360 },
        realMm: { width: 280, height: 340 },
        tintClipPath: "polygon(5% 0%, 95% 0%, 100% 12%, 88% 100%, 12% 100%, 0% 12%)",
      },
      {
        id: "back",
        label: "Спина",
        image: "/images/constructor/tee-back.jpg",
        imageWidth: 1024,
        imageHeight: 1024,
        workArea: { x: 250, y: 170, width: 520, height: 700 },
        guideZone: { x: 360, y: 210, width: 300, height: 360 },
        realMm: { width: 280, height: 340 },
        tintClipPath: "polygon(5% 0%, 95% 0%, 100% 12%, 88% 100%, 12% 100%, 0% 12%)",
      },
      {
        id: "side",
        label: "Бок",
        image: "/images/constructor/tee-side.jpg",
        imageWidth: 1024,
        imageHeight: 1024,
        // Кроп по рукаву — там ткань занимает весь прямоугольник целиком,
        // отдельная маска для тонировки не нужна.
        workArea: { x: 560, y: 180, width: 380, height: 340 },
        guideZone: { x: 660, y: 260, width: 180, height: 180 },
        realMm: { width: 100, height: 100 },
      },
    ],
    colors: [
      { id: "natural", label: "Кремовый (как на фото)", hex: null },
      { id: "white", label: "Белый", hex: "#ffffff" },
      { id: "gray", label: "Серый", hex: "#8b8d90" },
      { id: "black", label: "Чёрный", hex: "#1a1a1a" },
      { id: "red", label: "Красный", hex: "#b3271e" },
      { id: "navy", label: "Тёмно-синий", hex: "#1f2a44" },
    ],
  },
];

export const defaultConstructorProduct = constructorProducts[0];
