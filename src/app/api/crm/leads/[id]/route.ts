import { NextRequest, NextResponse } from "next/server";
import { updateLeadNotes, updateLeadStatus, type LeadStatus } from "@/lib/db";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const body = await request.json();

  if (body.status) updateLeadStatus(id, body.status as LeadStatus);
  if (body.notes !== undefined) updateLeadNotes(id, String(body.notes));

  return NextResponse.json({ ok: true });
}
