import { NextRequest, NextResponse } from "next/server";
import { getArchiveDoc, readArchiveFile } from "@/lib/crm/archive";
import { authPortal } from "@/lib/crm/portal-tasks";

/** Скачивание — только файлы этого же контрагента */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string; fileId: string }> }) {
  const { slug, fileId } = await params;
  const auth = authPortal(request, slug);
  if (auth.error) return auth.error;
  const doc = getArchiveDoc(Number(fileId));
  if (!doc?.filename || doc.contractor_id !== auth.contractor.id || !doc.task_id) {
    return NextResponse.json({ error: "Файл не найден" }, { status: 404 });
  }
  const buffer = await readArchiveFile(doc.filename).catch(() => null);
  if (!buffer) return NextResponse.json({ error: "Файл не найден на диске" }, { status: 404 });
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": doc.mime_type || "application/octet-stream",
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(doc.original_name || doc.title)}`,
    },
  });
}
