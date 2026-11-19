import { NextRequest, NextResponse } from "next/server";
import {
  createArchiveDoc,
  findArchiveBySha,
  listArchive,
  sha256Of,
  storeArchiveFile,
} from "@/lib/crm/archive";
import { parseArchiveFields } from "@/lib/crm/archive-fields";
import { isAllowedAttachmentType } from "@/lib/crm/attachments";
import { archiveActor, hasArchiveKey } from "@/lib/crm/archive-auth";

const MAX_SIZE_BYTES = 40 * 1024 * 1024;

const num = (v: string | null) => (v && Number(v) > 0 ? Number(v) : undefined);

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  return NextResponse.json({
    items: listArchive({
      q: sp.get("q") || undefined,
      kind: sp.get("kind") || undefined,
      contractorId: num(sp.get("contractorId")),
      orderId: num(sp.get("orderId")),
      projectId: num(sp.get("projectId")),
      from: sp.get("from") || undefined,
      to: sp.get("to") || undefined,
      limit: num(sp.get("limit")),
    }),
  });
}

/**
 * multipart/form-data: file + поля (title, kind, docDate, amount в рублях, contractorId, ...).
 * application/json: те же поля без файла — запись о бумажном документе.
 * Тот же файл (по sha256) второй раз не кладём: 409 и ссылка на существующий,
 * если только не передан force=1.
 */
export async function POST(request: NextRequest) {
  const actor = await archiveActor(request);
  const source = hasArchiveKey(request) ? "claude" : "manual";
  const ctype = request.headers.get("content-type") || "";

  if (ctype.includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("file");
    const fields = parseArchiveFields((k) => form.get(k));

    if (file instanceof File && file.size > 0) {
      if (file.size > MAX_SIZE_BYTES) return NextResponse.json({ error: "Файл больше 40 МБ" }, { status: 413 });
      const mimeType = file.type || "application/octet-stream";
      if (!isAllowedAttachmentType(mimeType)) {
        return NextResponse.json({ error: `Тип файла не поддерживается: ${mimeType}` }, { status: 400 });
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const existing = findArchiveBySha(sha256Of(buffer));
      if (existing && form.get("force") !== "1") {
        return NextResponse.json({ error: "Этот файл уже в архиве", duplicate: existing }, { status: 409 });
      }
      const { filename, sha256 } = await storeArchiveFile(file.name, buffer);
      const doc = createArchiveDoc(
        {
          ...fields,
          title: fields.title || file.name.replace(/\.[^.]+$/, ""),
          source,
          filename,
          original_name: file.name,
          mime_type: mimeType,
          size_bytes: file.size,
          sha256,
        },
        actor,
      );
      return NextResponse.json({ document: doc });
    }

    if (!fields.title) return NextResponse.json({ error: "Нужен файл или название" }, { status: 400 });
    return NextResponse.json({ document: createArchiveDoc({ ...fields, title: fields.title, source }, actor) });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const fields = parseArchiveFields((k) => body[k]);
  if (!fields.title) return NextResponse.json({ error: "Укажите название документа" }, { status: 400 });
  return NextResponse.json({ document: createArchiveDoc({ ...fields, title: fields.title, source }, actor) });
}
