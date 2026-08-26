import { NextRequest, NextResponse } from "next/server";
import { deleteOrderAttachment, getOrderAttachmentById } from "@/lib/crm/db";
import { deleteOrderAttachmentFile, readOrderAttachment } from "@/lib/crm/attachments";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string; attId: string }> }) {
  const { attId } = await params;
  const attachment = getOrderAttachmentById(Number(attId));
  if (!attachment) return NextResponse.json({ error: "Файл не найден" }, { status: 404 });

  const buffer = await readOrderAttachment(attachment.order_id, attachment.filename).catch(() => null);
  if (!buffer) return NextResponse.json({ error: "Файл не найден на диске" }, { status: 404 });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": attachment.mime_type,
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(attachment.original_name)}`,
    },
  });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string; attId: string }> }) {
  const { attId } = await params;
  const attachment = getOrderAttachmentById(Number(attId));
  if (!attachment) return NextResponse.json({ error: "Файл не найден" }, { status: 404 });

  await deleteOrderAttachmentFile(attachment.order_id, attachment.filename);
  deleteOrderAttachment(attachment.id);
  return NextResponse.json({ ok: true });
}
