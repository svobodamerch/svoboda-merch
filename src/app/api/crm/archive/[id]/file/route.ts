import { NextRequest, NextResponse } from "next/server";
import { getArchiveDoc, readArchiveFile } from "@/lib/crm/archive";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const doc = getArchiveDoc(Number((await params).id));
  if (!doc?.filename) return NextResponse.json({ error: "Файл не найден" }, { status: 404 });
  const buffer = await readArchiveFile(doc.filename).catch(() => null);
  if (!buffer) return NextResponse.json({ error: "Файл не найден на диске" }, { status: 404 });
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": doc.mime_type || "application/octet-stream",
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(doc.original_name || doc.title)}`,
    },
  });
}
