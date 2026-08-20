import { NextRequest, NextResponse } from "next/server";
import { completeTask, deleteTask, reopenTask, updateTask } from "@/lib/crm/db";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const body = await request.json();

  // Смена статуса и правка полей — разные действия над одной задачей
  if (body.status === "done" || body.status === "open") {
    const task = body.status === "done" ? completeTask(id) : reopenTask(id);
    if (!task) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
    return NextResponse.json({ task });
  }

  const task = updateTask(id, {
    title: body.title !== undefined ? String(body.title).trim() : undefined,
    description: body.description !== undefined ? String(body.description).trim() || null : undefined,
    due_at: body.dueAt !== undefined ? String(body.dueAt).trim() || null : undefined,
    remind_at: body.remindAt !== undefined ? String(body.remindAt).trim() || null : undefined,
    contractor_id: body.contractorId !== undefined ? Number(body.contractorId) || null : undefined,
    order_id: body.orderId !== undefined ? Number(body.orderId) || null : undefined,
  });
  if (!task) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  return NextResponse.json({ task });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  deleteTask(Number((await params).id));
  return NextResponse.json({ ok: true });
}
