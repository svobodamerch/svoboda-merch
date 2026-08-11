#!/usr/bin/env node
/**
 * Одноразовое создание/сброс пароля сотрудника CRM.
 *
 * Использование:
 *   node scripts/create-crm-user.mjs --username andrey --password "..." --name "Андрей"
 *
 * DB_PATH можно задать env-переменной, иначе — data/leads.db как и на сайте.
 */
import Database from "better-sqlite3";
import { randomBytes, scryptSync } from "crypto";
import path from "path";

function parseArgs() {
  const args = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i].replace(/^--/, "");
    args[key] = argv[i + 1];
  }
  return args;
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const { username, password, name } = parseArgs();
if (!username || !password || !name) {
  console.error('Нужны все три аргумента: --username --password --name');
  process.exit(1);
}

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "data", "leads.db");
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.exec(`
  CREATE TABLE IF NOT EXISTS crm_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const passwordHash = hashPassword(password);
const existing = db.prepare("SELECT id FROM crm_users WHERE username = ?").get(username);

if (existing) {
  db.prepare("UPDATE crm_users SET password_hash = ?, name = ? WHERE username = ?").run(
    passwordHash,
    name,
    username,
  );
  console.log(`Пароль обновлён для «${username}» (${DB_PATH})`);
} else {
  db.prepare("INSERT INTO crm_users (username, password_hash, name) VALUES (?, ?, ?)").run(
    username,
    passwordHash,
    name,
  );
  console.log(`Создан пользователь «${username}» (${DB_PATH})`);
}
