#!/usr/bin/env node
/**
 * Заводит юрлица и их расчётные счета. Идемпотентно: повторный запуск
 * ничего не дублирует, ориентируется на ИНН.
 *
 *   node scripts/seed-legal-entities.mjs
 *   DB_PATH=/var/www/svoboda-merch/data/leads.db node scripts/seed-legal-entities.mjs
 */
import Database from "better-sqlite3";
import path from "path";

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "data", "leads.db");
const db = new Database(DB_PATH);

const ENTITIES = [
  {
    name: "Индивидуальный предприниматель Лялин Андрей Сергеевич",
    short_name: "ИП Лялин А. С.",
    inn: "543306833220",
    address: "630559, Россия, Новосибирская обл, Кольцово рп., дом 14, кв 72",
    signer_name: "Лялин Андрей Сергеевич",
    tax_regime: "usn_income",
    tax_rate: 7,
    is_default: 1,
    account: {
      bank_name: 'ООО "Банк Точка"',
      bik: "044525104",
      corr_account: "30101810745374525104",
      account_number: "40802810020001054387",
    },
  },
  {
    name: "Индивидуальный предприниматель Остапович Юрий Валерьевич",
    short_name: "ИП Остапович Ю. В.",
    inn: "771602410190",
    address:
      "Город Москва столица Российской Федерации город федерального значения, Северо-Восточный административный округ, район Ростокино",
    signer_name: "Остапович Юрий Валерьевич",
    tax_regime: "usn_income_minus_expense",
    tax_rate: 15,
    is_default: 0,
    account: {
      bank_name: 'ООО "Банк Точка"',
      bik: "044525104",
      corr_account: "30101810745374525104",
      account_number: "40802810601500041414",
    },
  },
];

for (const e of ENTITIES) {
  let row = db.prepare("SELECT * FROM legal_entities WHERE inn = ?").get(e.inn);
  if (row) {
    console.log(`= уже есть: ${e.short_name} (id ${row.id})`);
  } else {
    row = db
      .prepare(
        `INSERT INTO legal_entities (name, short_name, inn, address, signer_name, tax_regime, tax_rate, is_default)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
      )
      .get(e.name, e.short_name, e.inn, e.address, e.signer_name, e.tax_regime, e.tax_rate, e.is_default);
    console.log(`+ создано: ${e.short_name} (id ${row.id})`);
  }

  const acc = db
    .prepare("SELECT * FROM bank_accounts WHERE legal_entity_id = ? AND account_number = ?")
    .get(row.id, e.account.account_number);
  if (acc) {
    console.log(`  = счёт уже есть: ...${e.account.account_number.slice(-6)}`);
  } else {
    db.prepare(
      `INSERT INTO bank_accounts (legal_entity_id, bank_name, bik, corr_account, account_number, is_default, is_active)
       VALUES (?, ?, ?, ?, ?, 1, 1)`,
    ).run(row.id, e.account.bank_name, e.account.bik, e.account.corr_account, e.account.account_number);
    console.log(`  + счёт добавлен: ...${e.account.account_number.slice(-6)}`);
  }
}

console.log(`\nГотово: ${DB_PATH}`);
