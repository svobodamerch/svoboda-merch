import fs from "fs";
import path from "path";

/**
 * Бизнес-доходы/расходы из Money Treker (отдельный сервис, PostgreSQL
 * в docker, наружу не торчит). Раз в сутки cron на сервере выгружает
 * агрегаты в JSON тем же приёмом, что бот пишет media.json/admins.json —
 * читаем файл при каждом запросе, ничего не кэшируем в билде.
 */

const MONEY_TREKER_FILE =
  process.env.MONEY_TREKER_FILE || path.join(process.cwd(), "data", "money-treker.json");

export type MoneyTrekerRow = {
  month: string; // "2026-08"
  type: "income" | "expense";
  category: string;
  total: number;
};

export type MoneyTrekerData = {
  generatedAt: string | null;
  byMonth: MoneyTrekerRow[];
};

export function getMoneyTrekerData(): MoneyTrekerData {
  try {
    const raw = JSON.parse(fs.readFileSync(MONEY_TREKER_FILE, "utf8"));
    return {
      generatedAt: raw.generatedAt ?? null,
      byMonth: Array.isArray(raw.byMonth) ? raw.byMonth : [],
    };
  } catch {
    return { generatedAt: null, byMonth: [] };
  }
}
