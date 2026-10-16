import { NextRequest, NextResponse } from "next/server";
import { acceptProposal, dismissProposal } from "@/lib/crm/settlements";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string; pid: string }> }) {
  const { pid } = await params;
  const { action } = await request.json();
  if (action === "dismiss") {
    dismissProposal(Number(pid));
    return NextResponse.json({ ok: true });
  }
  if (action === "accept") {
    return acceptProposal(Number(pid))
      ? NextResponse.json({ ok: true })
      : NextResponse.json({ error: "Уже обработано или не найдено" }, { status: 404 });
  }
  return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });
}
