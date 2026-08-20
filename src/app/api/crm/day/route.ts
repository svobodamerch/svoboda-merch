import { NextRequest, NextResponse } from "next/server";
import {
  addConclusion,
  closeConclusion,
  conclusionToTask,
  deleteConclusion,
  getDayReport,
  saveReflection,
  todayMsk,
} from "@/lib/crm/daily";
import { getCurrentActor } from "@/lib/crm/current-user";

export async function GET(request: NextRequest) {
  const day = request.nextUrl.searchParams.get("day") || todayMsk();
  return NextResponse.json(getDayReport(day));
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const day = String(body.day || todayMsk());

  if (body.action === "reflection") {
    saveReflection(day, String(body.reflection ?? ""));
    return NextResponse.json(getDayReport(day));
  }

  if (body.action === "conclusion") {
    const text = String(body.text || "").trim();
    if (!text) return NextResponse.json({ error: "Нужен текст вывода" }, { status: 400 });
    addConclusion(day, text);
    return NextResponse.json(getDayReport(day));
  }

  // Вывод, превращённый в задачу, начинает влиять на работу — в этом весь смысл
  if (body.action === "to_task") {
    conclusionToTask(Number(body.id), await getCurrentActor());
    return NextResponse.json(getDayReport(day));
  }

  if (body.action === "close") {
    closeConclusion(Number(body.id));
    return NextResponse.json(getDayReport(day));
  }

  if (body.action === "delete") {
    deleteConclusion(Number(body.id));
    return NextResponse.json(getDayReport(day));
  }

  return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });
}
