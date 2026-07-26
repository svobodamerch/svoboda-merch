import fs from "fs";

/**
 * Отправка уведомлений в Telegram.
 *
 * Список получателей ведёт бот: он пишет chat_id тех, кто прошёл
 * регистрацию через /start с кодом. Сайт этот файл только читает —
 * так не нужно прописывать chat_id руками в двух местах.
 *
 * Если файла нет, берём TELEGRAM_CHAT_IDS из окружения (через запятую).
 */

const TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const ADMINS_FILE =
  process.env.TELEGRAM_ADMINS_FILE || "/var/www/svoboda-bot/data/admins.json";

export const isTelegramConfigured = () => Boolean(TOKEN);

function recipients(): number[] {
  try {
    const raw = fs.readFileSync(ADMINS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed?.chats)) {
      return parsed.chats.map(Number).filter(Number.isFinite);
    }
  } catch {
    /* файла нет или он повреждён — падать нельзя, пробуем запасной вариант */
  }

  return (process.env.TELEGRAM_CHAT_IDS || "")
    .split(",")
    .map((s) => Number(s.trim()))
    .filter(Number.isFinite);
}

/** Экранирование под parse_mode: HTML */
export const esc = (s: string) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Шлём всем получателям. Никогда не бросает исключение:
 * упавшее уведомление не должно ломать приём заявки.
 */
export async function notifyTelegram(html: string): Promise<void> {
  if (!TOKEN) return;

  const chats = recipients();
  if (chats.length === 0) return;

  await Promise.allSettled(
    chats.map((chat_id) =>
      fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id,
          text: html,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      }),
    ),
  ).then((results) => {
    const failed = results.filter((r) => r.status === "rejected").length;
    if (failed) console.warn(`[telegram] не доставлено получателям: ${failed}`);
  });
}

interface LeadNotice {
  name: string;
  phone: string;
  telegram?: string;
  company?: string;
  productType?: string;
  quantity?: string;
  comment?: string;
  source?: string;
}

const SOURCE_LABEL: Record<string, string> = {
  website: "сайт",
  birka: "бирка на изделии",
  shop: "магазин",
};

export function notifyNewLead(lead: LeadNotice) {
  const rows: string[] = [
    `<b>Новая заявка</b>`,
    ``,
    `<b>${esc(lead.name)}</b>`,
    `📞 ${esc(lead.phone)}`,
  ];

  if (lead.telegram) rows.push(`✈️ ${esc(lead.telegram)}`);
  if (lead.company) rows.push(`🏢 ${esc(lead.company)}`);
  if (lead.productType && lead.productType !== "Не указано") {
    rows.push(`📦 ${esc(lead.productType)}`);
  }
  if (lead.quantity && lead.quantity !== "1") rows.push(`🔢 ${esc(lead.quantity)}`);
  if (lead.comment) rows.push(``, esc(lead.comment));

  rows.push(``, `<i>Источник: ${esc(SOURCE_LABEL[lead.source ?? ""] ?? "сайт")}</i>`);

  return notifyTelegram(rows.join("\n"));
}
