import { NextRequest, NextResponse } from "next/server";
import { createProjectAttachment, getProjectAttachments } from "@/lib/crm/db";
import { isAllowedAttachmentType, saveProjectAttachment } from "@/lib/crm/attachments";
import { getCurrentActor } from "@/lib/crm/current-user";

const MAX_SIZE_BYTES = 40 * 1024 * 1024;

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json({ attachments: getProjectAttachments(Number(id)) });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const projectId = Number(id);

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Файл не передан" }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "Файл больше 40 МБ" }, { status: 413 });
  }
  const mimeType = file.type || "application/octet-stream";
  if (!isAllowedAttachmentType(mimeType)) {
    return NextResponse.json({ error: `Тип файла не поддерживается: ${mimeType}` }, { status: 400 });
  }

  const actor = await getCurrentActor();
  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = await saveProjectAttachment(projectId, file.name, buffer);
  const attachment = createProjectAttachment(
    { project_id: projectId, filename, original_name: file.name, mime_type: mimeType, size_bytes: file.size },
    actor,
  );
  return NextResponse.json({ attachment });
}
