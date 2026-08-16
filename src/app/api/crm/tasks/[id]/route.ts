import { NextRequest, NextResponse } from "next/server";
import { completeTask, reopenTask } from "@/lib/crm/db";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const body = await request.json();

  const task = body.status === "done" ? completeTask(id) : reopenTask(id);
  if (!task) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }
  return NextResponse.json({ task });
}
