import { NextRequest, NextResponse } from "next/server";
import { createContractor, getContractors, type ContractorType } from "@/lib/crm/db";
import { getCurrentActor } from "@/lib/crm/current-user";

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type") as ContractorType | null;
  return NextResponse.json({ contractors: getContractors(type || undefined) });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const name = String(body.name || "").trim();
  if (!name) {
    return NextResponse.json({ error: "Укажите имя контрагента" }, { status: 400 });
  }

  const actor = await getCurrentActor();
  const contractor = createContractor(
    {
      type: body.type || "client",
      name,
      company: String(body.company || "").trim() || undefined,
      inn: String(body.inn || "").trim() || undefined,
      phone: String(body.phone || "").trim() || undefined,
      telegram: String(body.telegram || "").trim() || undefined,
      email: String(body.email || "").trim() || undefined,
      address: String(body.address || "").trim() || undefined,
      notes: String(body.notes || "").trim() || undefined,
    },
    actor,
  );

  return NextResponse.json({ contractor });
}
