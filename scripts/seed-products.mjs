#!/usr/bin/env node
/**
 * Заводит товары и связки «кто почём делает» по тому, что уже разобрано
 * из счетов и записок. Идемпотентно по названию товара / названию работы
 * у контрагента — повторный запуск не дублирует.
 *
 *   node scripts/seed-products.mjs
 *   DB_PATH=/var/www/svoboda-merch/data/leads.db node scripts/seed-products.mjs
 */
import Database from "better-sqlite3";
import path from "path";

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "data", "leads.db");
const db = new Database(DB_PATH);

const PRODUCTS = [
  {
    category: "clothing",
    title: "Футболка оверсайз с печатью (шелкография)",
    description: "100% хлопок, шелкография. Цена продажи по счетам СГС — 1900 ₽/шт.",
    default_cost_kopecks: 93000 + 32154, // пошив (Кустикова) + печать (ТРАФАРЕТ-М, средняя)
    default_sell_price_kopecks: 190000,
    lead_time: null,
  },
  {
    category: "clothing",
    title: "Шоппер с карманом",
    description: "Пошив у Кустиковой. Цена продажи по счетам СГС — 1250 ₽/шт.",
    default_cost_kopecks: 45000,
    default_sell_price_kopecks: 125000,
    lead_time: null,
  },
  {
    category: "accessories",
    title: "Гермочехол с нанесением изображения",
    description: "Цена продажи по счёту №290 — 980 ₽/шт.",
    default_cost_kopecks: 0, // себестоимость заготовки/нанесения ещё не внесена
    default_sell_price_kopecks: 98000,
    lead_time: null,
  },
  {
    category: "clothing",
    title: "Футболка Regent (заготовка)",
    description:
      "Заготовка без печати, каталог HappyGifts. Белая/красная, размеры S–2XL. Себестоимость по счёту №46513 — 412–490 ₽/шт до скидки, ~330,83 ₽/шт со скидкой и доставкой в среднем на партию 55 шт.",
    default_cost_kopecks: 33083,
    default_sell_price_kopecks: 0,
    lead_time: null,
  },
  {
    category: "clothing",
    title: "Печать логотипа на футболке (волонтёр/спасатель)",
    description: "Печать на готовой заготовке. Продажа 1000 ₽/шт по счёту №302.",
    default_cost_kopecks: 0,
    default_sell_price_kopecks: 100000,
    lead_time: null,
  },
  {
    category: "other",
    title: "Администрирование площадки мероприятия",
    description: "Фикс за услугу, не зависит от объёма мерча. По счетам СГС — 41 400 ₽.",
    default_cost_kopecks: 0,
    default_sell_price_kopecks: 4140000,
    lead_time: null,
  },
];

const SERVICES = [
  {
    contractorInn: "любой", // сопоставляется по имени ниже
    contractorName: "Ирина Кустикова",
    productTitle: "Футболка оверсайз с печатью (шелкография)",
    title: "Пошив футболки оверсайз (работа + ткань)",
    cost_kopecks: 93000,
    notes: "По рукописной записке от 17.08.2026",
  },
  {
    contractorName: "Ирина Кустикова",
    productTitle: "Шоппер с карманом",
    title: "Пошив шоппера с карманом",
    cost_kopecks: 45000,
    notes: "По рукописной записке от 17.08.2026",
  },
  {
    contractorName: 'ООО «ТРАФАРЕТ-М» (ШелкоGraph)',
    productTitle: "Футболка оверсайз с печатью (шелкография)",
    title: "Нанесение логотипа на футболку 1+1",
    cost_kopecks: 32154,
    notes: "Счёт №47: 30 шт по 210 ₽ и 87 шт по 360 ₽ — цена разная, среднее по 117 шт. Причина разницы уточнить",
  },
  {
    contractorName: "ХеппиГифтс (Интергифт)",
    productTitle: "Футболка Regent (заготовка)",
    title: "Заготовка футболки Regent",
    cost_kopecks: 33083,
    notes: "Счёт №46513: 412–490 ₽/шт до скидки, 330,83 ₽/шт в среднем со скидкой и доставкой на партию 55 шт",
  },
];

function upsertProduct(p) {
  let row = db.prepare("SELECT * FROM products WHERE title = ?").get(p.title);
  if (row) {
    console.log(`= товар уже есть: ${p.title} (id ${row.id})`);
    return row;
  }
  row = db
    .prepare(
      `INSERT INTO products (category, title, description, default_cost_kopecks, default_sell_price_kopecks, lead_time)
       VALUES (?, ?, ?, ?, ?, ?) RETURNING *`,
    )
    .get(p.category, p.title, p.description, p.default_cost_kopecks, p.default_sell_price_kopecks, p.lead_time);
  console.log(`+ товар создан: ${p.title} (id ${row.id})`);
  return row;
}

function findContractorByName(name) {
  return db.prepare("SELECT * FROM contractors WHERE name = ?").get(name);
}

for (const p of PRODUCTS) upsertProduct(p);

for (const s of SERVICES) {
  const contractor = findContractorByName(s.contractorName);
  if (!contractor) {
    console.log(`! контрагент не найден, пропуск: ${s.contractorName}`);
    continue;
  }
  const product = db.prepare("SELECT * FROM products WHERE title = ?").get(s.productTitle);
  if (!product) {
    console.log(`! товар не найден, пропуск: ${s.productTitle}`);
    continue;
  }

  const existing = db
    .prepare("SELECT * FROM contractor_services WHERE contractor_id = ? AND title = ?")
    .get(contractor.id, s.title);
  if (existing) {
    console.log(`= связка уже есть: ${s.contractorName} → ${s.title}`);
    continue;
  }

  db.prepare(
    `INSERT INTO contractor_services (contractor_id, product_id, title, cost_kopecks, notes)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(contractor.id, product.id, s.title, s.cost_kopecks, s.notes || null);
  console.log(`+ связка создана: ${s.contractorName} → ${s.title} (${(s.cost_kopecks / 100).toLocaleString("ru-RU")} ₽)`);
}

console.log(`\nГотово: ${DB_PATH}`);
