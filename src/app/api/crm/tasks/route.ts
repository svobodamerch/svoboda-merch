import { NextRequest, NextResponse } from "next/server";
import { createTask, getTasks, type TaskStatus } from "@/lib/crm/db";
import { getCurrentActor } from "@/lib/crm/current-user";

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status") as TaskStatus | null;
  return NextResponse.json({ tasks: getTasks(status || undefined) });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const title = String(body.title || "").trim();
  if (!title) {
    return NextResponse.json({ error: "Укажите название задачи" }, { status: 400 });
  }

  const actor = await getCurrentActor();
  const task = createTask(
    {
      title,
      description: String(body.description || "").trim() || undefined,
      due_at: String(body.dueAt || "").trim() || undefined,
      source: "manual",
    },
    actor,
  );

  return NextResponse.json({ task });
}
