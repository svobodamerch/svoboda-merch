import type { PriceRow } from "@/components/home/PriceList";

/**
 * Единственный источник реальных цен — раньше жил только в src/app/page.tsx
 * (прайс на главной), теперь его же использует и билдер позиций КП для
 * автоподсказки цены по товару и тиражу.
 *
 * Цены за единицу, ₽. Порядок соответствует PRICE_TIERS в PriceList.
 */
export const clothing: PriceRow[] = [
  {
    name: "Футболка оверсайз",
    spec: "Футер 2 нитка · 92% хлопок, 8% эластан",
    prices: [2100, 1900, 1700, 1500, 1300],
  },
  {
    name: "Худи классика",
    spec: "Футер 3 нитка диагональ · 85% хлопок, 15% полиэстер",
    prices: [4000, 3800, 3600, 3400, 3200],
  },
  {
    name: "Худи классика, начёс",
    spec: "Футер 3 нитка диагональ · 85% хлопок, 15% полиэстер",
    prices: [4200, 4000, 3800, 3600, 3400],
  },
  {
    name: "Худи оверсайз, начёс",
    spec: "Футер 3 нитка диагональ · 85% хлопок, 15% полиэстер",
    prices: [4200, 4000, 3800, 3600, 3400],
  },
  {
    name: "Кофта с замком",
    spec: "Футер 3 нитка диагональ · 85% хлопок, 15% полиэстер",
    prices: [4200, 4000, 3800, 3600, 3400],
  },
  {
    name: "Рубашка",
    spec: "Джинса или вельвет · карман на кнопке, не выцветает",
    prices: [5000, 4900, 4700, 4500, 4300],
  },
  {
    name: "Жилет",
    spec: "Софтшел · наполнитель синтепон, подкладка кулирка",
    prices: [8000, 7800, 7600, 7400, 7000],
  },
];

export const accessories: PriceRow[] = [
  { name: "Шопер", spec: "Саржа, хлопок, бязь", prices: [1000, 900, 700, 600, 550] },
  { name: "Кепка", spec: "Вышивка · one size", prices: [1300, 1200, 1000, 900, 800] },
  { name: "Шапка", spec: "Вышивка · one size", prices: [1200, 1000, 850, 840, 800] },
  { name: "Кружка", spec: "Полноцветная печать, цветная внутри", prices: [500, 480, 450, 400, 350] },
];

export const allCatalogItems: PriceRow[] = [...clothing, ...accessories];

/** Индекс тиража в PRICE_TIERS по количеству штук */
function tierIndexForQuantity(qty: number): number {
  if (qty < 10) return 0;
  if (qty < 100) return 1;
  if (qty < 500) return 2;
  if (qty < 1000) return 3;
  return 4;
}

/** Цена за штуку по названию товара и тиражу — для автоподсказки в билдере КП */
export function findCatalogPrice(name: string, quantity: number): number | null {
  const row = allCatalogItems.find((r) => r.name === name);
  if (!row) return null;
  return row.prices[tierIndexForQuantity(quantity)];
}
