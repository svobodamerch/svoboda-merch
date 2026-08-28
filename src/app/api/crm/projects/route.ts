import { NextRequest, NextResponse } from "next/server";
import { createProject, getProjects } from "@/lib/crm/db";
import { getCurrentActor } from "@/lib/crm/current-user";

export async function GET() {
  return NextResponse.json({ projects: getProjects() });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const title = String(body.title || "").trim();
  if (!title) return NextResponse.json({ error: "Укажите название проекта" }, { status: 400 });

  const actor = await getCurrentActor();
  const project = createProject({ title, description: String(body.description || "").trim() || undefined }, actor);
  return NextResponse.json({ project });
}
