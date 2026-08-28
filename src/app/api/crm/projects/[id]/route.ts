import { NextRequest, NextResponse } from "next/server";
import { getProjectById, logActivity, updateProject, type ProjectStage } from "@/lib/crm/db";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = getProjectById(Number(id));
  if (!project) return NextResponse.json({ error: "Не найден" }, { status: 404 });
  return NextResponse.json({ project });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const projectId = Number(id);
  const body = await request.json();

  const patch: { title?: string; description?: string; stage?: ProjectStage } = {};
  if (typeof body.title === "string") patch.title = body.title.trim();
  if (typeof body.description === "string") patch.description = body.description.trim();
  if (typeof body.stage === "string") patch.stage = body.stage as ProjectStage;

  const project = updateProject(projectId, patch);
  if (!project) return NextResponse.json({ error: "Не найден" }, { status: 404 });

  if (patch.stage) logActivity("project", projectId, "stage", `Стадия → ${patch.stage}`);
  return NextResponse.json({ project });
}
