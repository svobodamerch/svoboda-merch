import { NextRequest, NextResponse } from "next/server";
import { createContractorContact, getContractorContacts } from "@/lib/crm/db";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  return NextResponse.json({ contacts: getContractorContacts(id) });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const body = await request.json();
  const name = String(body.name || "").trim();
  if (!name) {
    return NextResponse.json({ error: "Укажите имя" }, { status: 400 });
  }

  const contact = createContractorContact(id, {
    name,
    role: String(body.role || "").trim() || undefined,
    phone: String(body.phone || "").trim() || undefined,
    email: String(body.email || "").trim() || undefined,
    telegram: String(body.telegram || "").trim() || undefined,
  });

  return NextResponse.json({ contact });
}
