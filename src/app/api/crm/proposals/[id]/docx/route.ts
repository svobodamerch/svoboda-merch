import { NextRequest, NextResponse } from "next/server";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
  BorderStyle,
  AlignmentType,
  ImageRun,
} from "docx";
import {
  getOrderAttachmentById,
  getOrderById,
  getOrderItems,
  getProposalBlocks,
  getProposalById,
  type OrderItem,
  type ProposalBlock,
} from "@/lib/crm/db";
import { formatMoney } from "@/lib/crm/format";
import { readOrderAttachment } from "@/lib/crm/attachments";

const INK = "22304F";
const TERRACOTTA = "C05B3E";
const MUTED = "6B7280";
const LINE = "E5E7EB";
const SURFACE = "F5F4F1";

function mimeToDocxType(mime: string): "png" | "jpg" | "gif" | "bmp" | null {
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/gif") return "gif";
  return null; // webp и прочее ImageRun не поддерживает — просто пропускаем в docx
}

function lineTotal(item: OrderItem): number {
  return Math.round(item.quantity * item.unit_price_kopecks * (1 - item.discount_percent / 100));
}

function priceTable(items: OrderItem[], totalKopecks: number): (Table | Paragraph)[] {
  if (items.length === 0) {
    return [new Paragraph({ children: [new TextRun({ text: "Позиции пока не добавлены", color: MUTED, size: 20 })] })];
  }

  const cell = (text: string, opts: { width: number; bold?: boolean; color?: string; align?: (typeof AlignmentType)[keyof typeof AlignmentType]; shading?: string; header?: boolean }) =>
    new TableCell({
      width: { size: opts.width, type: WidthType.DXA },
      shading: opts.shading ? { type: ShadingType.CLEAR, fill: opts.shading } : undefined,
      margins: { top: 100, bottom: 100, left: 100, right: 100 },
      children: [
        new Paragraph({
          alignment: opts.align,
          children: [new TextRun({ text, bold: opts.bold, color: opts.color || (opts.header ? "FFFFFF" : INK), size: 19 })],
        }),
      ],
    });

  const header = new TableRow({
    tableHeader: true,
    children: [
      cell("Позиция", { width: 3800, bold: true, shading: INK, header: true }),
      cell("Кол-во", { width: 1400, bold: true, shading: INK, header: true, align: AlignmentType.CENTER }),
      cell("Цена", { width: 1400, bold: true, shading: INK, header: true, align: AlignmentType.RIGHT }),
      cell("Срок", { width: 1200, bold: true, shading: INK, header: true, align: AlignmentType.CENTER }),
      cell("Сумма", { width: 1800, bold: true, shading: INK, header: true, align: AlignmentType.RIGHT }),
    ],
  });

  const rows = items.map(
    (item, i) =>
      new TableRow({
        children: [
          cell(item.title, { width: 3800, shading: i % 2 ? SURFACE : "FFFFFF" }),
          cell(`${item.quantity} ${item.unit}`, { width: 1400, align: AlignmentType.CENTER, shading: i % 2 ? SURFACE : "FFFFFF" }),
          cell(formatMoney(item.unit_price_kopecks), { width: 1400, align: AlignmentType.RIGHT, shading: i % 2 ? SURFACE : "FFFFFF" }),
          cell(item.lead_time || "—", { width: 1200, align: AlignmentType.CENTER, shading: i % 2 ? SURFACE : "FFFFFF" }),
          cell(formatMoney(lineTotal(item)), { width: 1800, bold: true, color: TERRACOTTA, align: AlignmentType.RIGHT, shading: i % 2 ? SURFACE : "FFFFFF" }),
        ],
      }),
  );

  return [
    new Table({ width: { size: 9600, type: WidthType.DXA }, columnWidths: [3800, 1400, 1400, 1200, 1800], rows: [header, ...rows] }),
    new Paragraph({ spacing: { before: 200 }, alignment: AlignmentType.RIGHT, children: [
      new TextRun({ text: "Итого: ", size: 22, color: MUTED }),
      new TextRun({ text: formatMoney(totalKopecks), bold: true, size: 26, color: TERRACOTTA }),
    ] }),
  ];
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const proposal = getProposalById(Number(id));
  if (!proposal) return NextResponse.json({ error: "Не найдено" }, { status: 404 });

  const order = getOrderById(proposal.order_id);
  if (!order) return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });

  const items = getOrderItems(order.id);
  const blocks: ProposalBlock[] =
    getProposalBlocks(proposal) || [{ id: "cover", type: "cover", title: order.title }, { id: "table", type: "price_table" }];

  const children: (Paragraph | Table)[] = [
    new Paragraph({ children: [new TextRun({ text: "[СВОБОДА]*", bold: true, color: TERRACOTTA, size: 24 })] }),
  ];

  for (const block of blocks) {
    if (block.type === "cover") {
      children.push(
        new Paragraph({ spacing: { before: 200, after: 60 }, children: [new TextRun({ text: block.title, bold: true, size: 36, color: INK })] }),
      );
      if (block.subtitle) {
        children.push(new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: block.subtitle, size: 22, color: MUTED })] }));
      }
    } else if (block.type === "text") {
      if (block.heading) {
        children.push(new Paragraph({ spacing: { before: 200 }, children: [new TextRun({ text: block.heading, bold: true, size: 20, color: TERRACOTTA })] }));
      }
      children.push(new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: block.body, size: 20 })] }));
    } else if (block.type === "image") {
      const attachment = getOrderAttachmentById(block.attachmentId);
      const docxImageType = attachment ? mimeToDocxType(attachment.mime_type) : null;
      if (attachment && docxImageType) {
        try {
          const buffer = await readOrderAttachment(order.id, attachment.filename);
          children.push(
            new Paragraph({
              spacing: { before: 150, after: 100 },
              children: [new ImageRun({ data: buffer, type: docxImageType, transformation: { width: 500, height: 350 } })],
            }),
          );
        } catch {
          // файл не нашёлся на диске — пропускаем картинку, не валим весь документ
        }
      }
      if (block.caption) {
        children.push(new Paragraph({ spacing: { after: 150 }, children: [new TextRun({ text: block.caption, italics: true, size: 16, color: MUTED })] }));
      }
    } else if (block.type === "price_table") {
      children.push(new Paragraph({ spacing: { before: 200, after: 100 }, children: [new TextRun({ text: "Состав и стоимость", bold: true, size: 20, color: TERRACOTTA })] }));
      children.push(...priceTable(items, order.amount_kopecks));
    } else if (block.type === "terms") {
      children.push(new Paragraph({ spacing: { before: 200 }, children: [new TextRun({ text: "Условия", bold: true, size: 20, color: TERRACOTTA })] }));
      children.push(new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: block.body, size: 18, color: MUTED })] }));
    }
  }

  children.push(
    new Paragraph({ border: { top: { style: BorderStyle.SINGLE, size: 4, color: LINE } }, spacing: { before: 300 }, children: [] }),
    new Paragraph({ spacing: { before: 150 }, children: [new TextRun({ text: "ИП Лялин Андрей Сергеевич · [СВОБОДА]* · svoboda.site", size: 16, color: MUTED })] }),
  );

  const doc = new Document({
    styles: { default: { document: { run: { font: "Arial", size: 20, color: INK } } } },
    sections: [
      {
        properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 900, bottom: 900, left: 900, right: 900 } } },
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="kp-${proposal.token}.docx"`,
    },
  });
}
