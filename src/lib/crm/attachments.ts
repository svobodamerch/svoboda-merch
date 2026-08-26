import { mkdir, writeFile, unlink, readFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

/**
 * Файлы заказа лежат вне git, рядом с базой (data/uploads) — тот же диск,
 * что и leads.db, поэтому деплой их не трогает и не затирает.
 */
const UPLOAD_ROOT = process.env.UPLOAD_DIR || path.join(process.cwd(), "data", "uploads", "orders");

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/zip",
]);

export function isAllowedAttachmentType(mimeType: string): boolean {
  return ALLOWED_MIME.has(mimeType);
}

export function isImageAttachment(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

function orderDir(orderId: number): string {
  return path.join(UPLOAD_ROOT, String(orderId));
}

/** Имя на диске — случайное, оригинальное имя (с кириллицей и т.п.) хранится отдельно в БД */
export async function saveOrderAttachment(orderId: number, originalName: string, buffer: Buffer): Promise<string> {
  const dir = orderDir(orderId);
  await mkdir(dir, { recursive: true });
  const ext = path.extname(originalName).slice(0, 10);
  const filename = `${crypto.randomUUID()}${ext}`;
  await writeFile(path.join(dir, filename), buffer);
  return filename;
}

export async function readOrderAttachment(orderId: number, filename: string): Promise<Buffer> {
  return readFile(path.join(orderDir(orderId), filename));
}

export async function deleteOrderAttachmentFile(orderId: number, filename: string): Promise<void> {
  await unlink(path.join(orderDir(orderId), filename)).catch(() => {});
}
