import { NextRequest, NextResponse } from "next/server";
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType } from "docx";
import { getBankAccounts, getLegalEntity } from "@/lib/crm/db";

const INK = "22304F";
const TERRACOTTA = "C05B3E";
const MUTED = "6B7280";

const regimeLabel: Record<string, string> = {
  usn_income: "УСН «Доходы»",
  usn_income_minus_expense: "УСН «Доходы минус расходы»",
};

function row(label: string, value: string | null | undefined): TableRow | null {
  if (!value) return null;
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 3600, type: WidthType.DXA },
        margins: { top: 100, bottom: 100 },
        children: [new Paragraph({ children: [new TextRun({ text: label, color: MUTED, size: 19 })] })],
      }),
      new TableCell({
        width: { size: 6000, type: WidthType.DXA },
        margins: { top: 100, bottom: 100 },
        children: [new Paragraph({ children: [new TextRun({ text: value, bold: true, color: INK, size: 19 })] })],
      }),
    ],
  });
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entity = getLegalEntity(Number(id));
  if (!entity) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  const account = getBankAccounts(Number(id)).find((a) => a.is_default) || getBankAccounts(Number(id))[0];

  const requisiteRows = [
    row("Полное название", entity.name),
    row("ИНН", entity.inn),
    row("КПП", entity.kpp),
    row("ОГРНИП", entity.ogrnip),
    row("Юридический адрес", entity.address),
    row("Подписант", entity.signer_name),
    row("Система налогообложения", `${regimeLabel[entity.tax_regime] || entity.tax_regime}, ${entity.tax_rate}%`),
  ].filter((r): r is TableRow => r !== null);

  const bankRows = account
    ? [row("Банк", account.bank_name), row("Расчётный счёт", account.account_number), row("БИК", account.bik), row("Корр. счёт", account.corr_account)].filter(
        (r): r is TableRow => r !== null,
      )
    : [];

  const doc = new Document({
    styles: { default: { document: { run: { font: "Arial", size: 20, color: INK } } } },
    sections: [
      {
        properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 900, bottom: 900, left: 900, right: 900 } } },
        children: [
          new Paragraph({ children: [new TextRun({ text: "Карточка организации", bold: true, size: 32, color: INK })] }),
          new Paragraph({ spacing: { after: 300 }, children: [new TextRun({ text: entity.short_name, size: 22, color: MUTED })] }),

          new Table({ width: { size: 9600, type: WidthType.DXA }, columnWidths: [3600, 6000], rows: requisiteRows }),

          ...(bankRows.length > 0
            ? [
                new Paragraph({
                  spacing: { before: 300, after: 100 },
                  children: [new TextRun({ text: "Банковские реквизиты", bold: true, size: 20, color: TERRACOTTA })],
                }),
                new Table({ width: { size: 9600, type: WidthType.DXA }, columnWidths: [3600, 6000], rows: bankRows }),
              ]
            : []),

          new Paragraph({ border: { top: { style: BorderStyle.SINGLE, size: 4, color: "E5E7EB" } }, spacing: { before: 400 }, children: [] }),
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { before: 150 },
            children: [new TextRun({ text: "[СВОБОДА]* · svoboda.site", size: 16, color: MUTED })],
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="card-${entity.id}.docx"`,
    },
  });
}
