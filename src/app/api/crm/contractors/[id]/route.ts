import { NextRequest, NextResponse } from "next/server";
import {
  getActivity,
  getContractorBalance,
  getContractorById,
  getOrdersByContractor,
  getPaymentsByContractor,
  updateContractor,
} from "@/lib/crm/db";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const contractor = getContractorById(id);
  if (!contractor) {
    return NextResponse.json({ error: "Не найден" }, { status: 404 });
  }

  return NextResponse.json({
    contractor,
    balanceKopecks: getContractorBalance(id),
    orders: getOrdersByContractor(id),
    payments: getPaymentsByContractor(id),
    activity: getActivity("contractor", id),
  });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const contractor = getContractorById(id);
  if (!contractor) {
    return NextResponse.json({ error: "Не найден" }, { status: 404 });
  }

  const body = await request.json();
  updateContractor(id, {
    type: body.type,
    name: body.name,
    company: body.company,
    inn: body.inn,
    phone: body.phone,
    telegram: body.telegram,
    email: body.email,
    address: body.address,
    notes: body.notes,
  });

  return NextResponse.json({ contractor: getContractorById(id) });
}
