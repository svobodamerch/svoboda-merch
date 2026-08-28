import { mkdir, writeFile, unlink, readFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

/**
 * Файлы лежат вне git, рядом с базой (data/uploads) — тот же диск,
 * что и leads.db, поэтому деплой их не трогает и не затирает.
 */
const UPLOAD_ROOT = process.env.UPLOAD_DIR || path.join(process.cwd(), "data", "uploads");

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

type Kind = "orders" | "projects";

function entityDir(kind: Kind, entityId: number): string {
  return path.join(UPLOAD_ROOT, kind, String(entityId));
}

/** Имя на диске — случайное, оригинальное имя (с кириллицей и т.п.) хранится отдельно в БД */
async function saveAttachment(kind: Kind, entityId: number, originalName: string, buffer: Buffer): Promise<string> {
  const dir = entityDir(kind, entityId);
  await mkdir(dir, { recursive: true });
  const ext = path.extname(originalName).slice(0, 10);
  const filename = `${crypto.randomUUID()}${ext}`;
  await writeFile(path.join(dir, filename), buffer);
  return filename;
}

async function readAttachment(kind: Kind, entityId: number, filename: string): Promise<Buffer> {
  return readFile(path.join(entityDir(kind, entityId), filename));
}

async function deleteAttachmentFile(kind: Kind, entityId: number, filename: string): Promise<void> {
  await unlink(path.join(entityDir(kind, entityId), filename)).catch(() => {});
}

export const saveOrderAttachment = (orderId: number, originalName: string, buffer: Buffer) =>
  saveAttachment("orders", orderId, originalName, buffer);
export const readOrderAttachment = (orderId: number, filename: string) => readAttachment("orders", orderId, filename);
export const deleteOrderAttachmentFile = (orderId: number, filename: string) =>
  deleteAttachmentFile("orders", orderId, filename);

export const saveProjectAttachment = (projectId: number, originalName: string, buffer: Buffer) =>
  saveAttachment("projects", projectId, originalName, buffer);
export const readProjectAttachment = (projectId: number, filename: string) =>
  readAttachment("projects", projectId, filename);
export const deleteProjectAttachmentFile = (projectId: number, filename: string) =>
  deleteAttachmentFile("projects", projectId, filename);
