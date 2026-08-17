import { NextRequest, NextResponse } from "next/server";
import {
  getActivity,
  getContractorBalance,
  getContractorById,
  getContractorContacts,
  getContractorServices,
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
    services: getContractorServices(id),
    contacts: getContractorContacts(id),
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
    kpp: body.kpp,
    ogrn: body.ogrn,
    legal_address: body.legalAddress,
    actual_address: body.actualAddress,
    bank_name: body.bankName,
    bank_account: body.bankAccount,
    bank_bik: body.bankBik,
    bank_corr_account: body.bankCorrAccount,
    contract_number: body.contractNumber,
    contract_date: body.contractDate,
    contract_basis: body.contractBasis,
    phone: body.phone,
    telegram: body.telegram,
    email: body.email,
    address: body.address,
    notes: body.notes,
  });

  return NextResponse.json({ contractor: getContractorById(id) });
}
