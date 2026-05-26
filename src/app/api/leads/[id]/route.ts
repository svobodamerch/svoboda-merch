import { NextRequest, NextResponse } from "next/server";
import { getLeadById, updateLeadStatus, updateLeadNotes, type LeadStatus } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const leadId = Number(id);
    if (Number.isNaN(leadId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await request.json();

    if (body.status) {
      updateLeadStatus(leadId, body.status as LeadStatus);
    }
    if (typeof body.notes === "string") {
      updateLeadNotes(leadId, body.notes);
    }

    const lead = getLeadById(leadId);
    return NextResponse.json({ lead });
  } catch (error) {
    console.error("[api/leads/id] PATCH error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
