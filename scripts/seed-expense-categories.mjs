/**
 * Статьи накладных расходов.
 *
 * Сюда попадает только то, что нельзя отнести к конкретному проекту: подписки,
 * бухгалтерия, налоги, связь. Печать, материалы и логистика по заказу — это
 * прямые затраты, их место в затратах проекта, а не здесь.
 * См. docs/domain-model.md.
 *
 * Постоянные не зависят от объёма работы, переменные растут вместе с ним.
 */
import Database from "better-sqlite3";
import path from "path";

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "data", "leads.db");

const CATEGORIES = [
  // постоянные — платим независимо от того, есть заказы или нет
  ["Подписки и сервисы", "fixed"],
  ["Бухгалтерия и юрист", "fixed"],
  ["Связь и интернет", "fixed"],
  ["Аренда", "fixed"],
  // переменные — растут вместе с оборотом
  ["Налоги", "variable"],
  ["Банковская комиссия", "variable"],
  ["Транспорт", "variable"],
  ["Офис и хозтовары", "variable"],
  ["Реклама и продвижение", "variable"],
  ["Прочие услуги", "variable"],
];

const db = new Database(DB_PATH);
const insert = db.prepare(
  `INSERT INTO expense_categories (name, kind) VALUES (?, ?)
   ON CONFLICT(name) DO UPDATE SET kind = excluded.kind`,
);

let added = 0;
for (const [name, kind] of CATEGORIES) {
  const before = db.prepare(`SELECT id FROM expense_categories WHERE name = ?`).get(name);
  insert.run(name, kind);
  if (!before) added += 1;
}

console.log(`Статей всего: ${db.prepare(`SELECT count(*) c FROM expense_categories`).get().c}, добавлено: ${added}`);
for (const r of db.prepare(`SELECT name, kind FROM expense_categories ORDER BY kind, name`).all()) {
  console.log(`  ${r.kind === "fixed" ? "постоянная" : "переменная"}  ${r.name}`);
}
