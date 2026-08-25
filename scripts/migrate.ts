/**
 * Прогоняет схему CRM по базе.
 *
 * Схема создаётся лениво, при первом обращении приложения к SQLite. Но
 * middleware редиректит неавторизованные запросы раньше, чем что-либо
 * коснётся базы, поэтому после деплоя новые таблицы и колонки могли не
 * появиться до первого входа сотрудника — и API падал. Этот скрипт
 * открывает базу принудительно и вызывает ту же getCrmDb(), что и сайт,
 * поэтому DDL не дублируется и не разъезжается.
 *
 *   npm run migrate
 *   DB_PATH=/var/www/svoboda-merch/data/leads.db npm run migrate
 *
 * Через tsx, а не через node --experimental-strip-types: на сервере Node 20,
 * а нативное срезание типов появилось в 22.6.
 */
import { getCrmDb } from "../src/lib/crm/db";
// leads (заявки с сайта) — отдельный модуль с собственной миграцией
// (converted_contractor_id и др.), её тоже нужно применять при деплое
import { getDb } from "../src/lib/db";

getDb();
const db = getCrmDb();

const tables = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
  .all() as { name: string }[];

console.log(`База: ${process.env.DB_PATH || "data/leads.db"}`);
console.log(`Таблиц: ${tables.length}`);
console.log(tables.map((t) => `  ${t.name}`).join("\n"));
