import { NextRequest, NextResponse } from "next/server";
import { createTask } from "@/lib/crm/db";
import { authPortal, getPortalTasks, portalActor } from "@/lib/crm/portal-tasks";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(request: NextRequest, { params }: Ctx) {
  const auth = authPortal(request, (await params).slug);
  if (auth.error) return auth.error;
  return NextResponse.json({ tasks: getPortalTasks(auth.contractor.id) });
}

export async function POST(request: NextRequest, { params }: Ctx) {
  const auth = authPortal(request, (await params).slug);
  if (auth.error) return auth.error;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const title = String(body.title || "").trim();
  if (!title) return NextResponse.json({ error: "Напишите, что нужно сделать" }, { status: 400 });
  const task = createTask(
    {
      title: title.slice(0, 300),
      description: String(body.description || "").trim().slice(0, 2000) || undefined,
      due_at: String(body.dueAt || "").trim() || undefined,
      contractor_id: auth.contractor.id,
      source: "portal",
    },
    portalActor(auth.contractor),
  );
  return NextResponse.json({ task });
}
