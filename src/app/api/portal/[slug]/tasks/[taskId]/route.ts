import { NextRequest, NextResponse } from "next/server";
import { authPortal, getContractorTask, portalActor, setTaskDone } from "@/lib/crm/portal-tasks";

/** Галочка «выполнено» — можно снять обратно, тогда done_at стирается */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ slug: string; taskId: string }> }) {
  const { slug, taskId } = await params;
  const auth = authPortal(request, slug);
  if (auth.error) return auth.error;
  const task = getContractorTask(auth.contractor.id, Number(taskId));
  if (!task) return NextResponse.json({ error: "Задача не найдена" }, { status: 404 });
  const body = (await request.json().catch(() => ({}))) as { done?: boolean };
  setTaskDone(task.id, !!body.done, portalActor(auth.contractor), auth.contractor.id);
  return NextResponse.json({ ok: true });
}
