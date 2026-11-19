import { NextRequest, NextResponse } from "next/server";
import { createArchiveDoc, normalizeKind, storeArchiveFile } from "@/lib/crm/archive";
import { isAllowedAttachmentType } from "@/lib/crm/attachments";
import { authPortal, getContractorTask, portalActor } from "@/lib/crm/portal-tasks";
import { legalEntityIdForContractor } from "@/lib/crm/portal-finance";

const MAX_SIZE_BYTES = 40 * 1024 * 1024;

/** Файл к задаче ложится в общий архив документов с привязкой к контрагенту и задаче */
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string; taskId: string }> }) {
  const { slug, taskId } = await params;
  const auth = authPortal(request, slug);
  if (auth.error) return auth.error;
  const task = getContractorTask(auth.contractor.id, Number(taskId));
  if (!task) return NextResponse.json({ error: "Задача не найдена" }, { status: 404 });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || !file.size) return NextResponse.json({ error: "Файл не передан" }, { status: 400 });
  if (file.size > MAX_SIZE_BYTES) return NextResponse.json({ error: "Файл больше 40 МБ" }, { status: 413 });
  const mimeType = file.type || "application/octet-stream";
  if (!isAllowedAttachmentType(mimeType)) {
    return NextResponse.json({ error: `Тип файла не поддерживается: ${mimeType}` }, { status: 400 });
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const { filename, sha256 } = await storeArchiveFile(file.name, buffer);
  const doc = createArchiveDoc(
    {
      kind: normalizeKind(form.get("kind")),
      title: file.name.replace(/\.[^.]+$/, ""),
      contractor_id: auth.contractor.id,
      task_id: task.id,
      legal_entity_id: legalEntityIdForContractor(auth.contractor.id),
      summary: `К задаче «${task.title}»`,
      source: "portal",
      filename,
      original_name: file.name,
      mime_type: mimeType,
      size_bytes: file.size,
      sha256,
    },
    portalActor(auth.contractor),
  );
  return NextResponse.json({ file: { id: doc.id, original_name: doc.original_name } });
}
