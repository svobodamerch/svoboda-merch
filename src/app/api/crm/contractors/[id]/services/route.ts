import { NextRequest, NextResponse } from "next/server";
import { createContractorService, getContractorServices } from "@/lib/crm/db";
import { toKopecks } from "@/lib/crm/format";
import { getCurrentActor } from "@/lib/crm/current-user";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const contractorId = Number((await params).id);
  return NextResponse.json({ services: getContractorServices(contractorId) });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const contractorId = Number((await params).id);
  const body = await request.json();
  const title = String(body.title || "").trim();
  if (!title) {
    return NextResponse.json({ error: "Укажите название работы" }, { status: 400 });
  }

  const actor = await getCurrentActor();
  const service = createContractorService(
    contractorId,
    {
      title,
      description: String(body.description || "").trim() || undefined,
      cost_kopecks: toKopecks(body.cost ?? 0),
      sell_price_kopecks: body.sellPrice ? toKopecks(body.sellPrice) : undefined,
      lead_time: String(body.leadTime || "").trim() || undefined,
      notes: String(body.notes || "").trim() || undefined,
    },
    actor,
  );

  return NextResponse.json({ service });
}
