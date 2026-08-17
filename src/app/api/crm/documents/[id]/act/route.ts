import { NextRequest, NextResponse } from "next/server";
import { createActFromInvoice } from "@/lib/crm/db";
import { getCurrentActor } from "@/lib/crm/current-user";

/** Акт по счёту: те же позиции, своя нумерация, ссылка на счёт-источник */
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const actor = await getCurrentActor();

  const act = createActFromInvoice(id, actor);
  if (!act) {
    return NextResponse.json({ error: "Счёт не найден" }, { status: 404 });
  }
  return NextResponse.json({ document: act });
}
