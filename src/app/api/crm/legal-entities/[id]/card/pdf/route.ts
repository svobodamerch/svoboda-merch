import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { getBankAccounts, getLegalEntity } from "@/lib/crm/db";

const regimeLabel: Record<string, string> = {
  usn_income: "УСН «Доходы»",
  usn_income_minus_expense: "УСН «Доходы минус расходы»",
};

/**
 * Карточка организации — стандартный документ для передачи реквизитов
 * контрагенту. Отдельная простая HTML-вёрстка (не общий сайт-шаблон),
 * потому что этот документ живёт вне бренд-стиля КП — только факты.
 */
function buildHtml(entity: ReturnType<typeof getLegalEntity>, accounts: ReturnType<typeof getBankAccounts>): string {
  if (!entity) return "<p>Не найдено</p>";
  const account = accounts.find((a) => a.is_default) || accounts[0];

  const row = (label: string, value: string | null | undefined) =>
    value ? `<tr><td class="label">${label}</td><td class="value">${value}</td></tr>` : "";

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body { font-family: Arial, sans-serif; color: #22304F; padding: 40px; }
  h1 { font-size: 20px; margin-bottom: 4px; }
  .subtitle { color: #6B7280; font-size: 13px; margin-bottom: 24px; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 8px 0; border-bottom: 1px solid #E5E7EB; font-size: 13px; }
  td.label { color: #6B7280; width: 40%; }
  td.value { color: #22304F; font-weight: 600; }
  .section { margin-top: 24px; font-size: 12px; color: #C05B3E; text-transform: uppercase; letter-spacing: 0.05em; }
</style></head>
<body>
  <h1>Карточка организации</h1>
  <p class="subtitle">${entity.short_name}</p>

  <table>
    ${row("Полное название", entity.name)}
    ${row("ИНН", entity.inn)}
    ${row("КПП", entity.kpp)}
    ${row("ОГРНИП", entity.ogrnip)}
    ${row("Юридический адрес", entity.address)}
    ${row("Подписант", entity.signer_name)}
    ${row("Система налогообложения", `${regimeLabel[entity.tax_regime] || entity.tax_regime}, ${entity.tax_rate}%`)}
  </table>

  ${
    account
      ? `<p class="section">Банковские реквизиты</p>
  <table>
    ${row("Банк", account.bank_name)}
    ${row("Расчётный счёт", account.account_number)}
    ${row("БИК", account.bik)}
    ${row("Корр. счёт", account.corr_account)}
  </table>`
      : ""
  }
</body></html>`;
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entity = getLegalEntity(Number(id));
  if (!entity) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  const accounts = getBankAccounts(Number(id));

  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  try {
    const page = await browser.newPage();
    await page.setContent(buildHtml(entity, accounts), { waitUntil: "load" });
    const pdf = await page.pdf({ format: "A4", printBackground: true, margin: { top: "20px", bottom: "20px" } });

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="card-${entity.id}.pdf"`,
      },
    });
  } finally {
    await browser.close();
  }
}
