import { NextResponse } from "next/server";
import { getBankAccounts, getLegalEntities, getLegalEntityDocuments } from "@/lib/crm/db";

export async function GET() {
  const entities = getLegalEntities();
  return NextResponse.json({
    entities: entities.map((e) => ({
      ...e,
      bankAccounts: getBankAccounts(e.id),
      documents: getLegalEntityDocuments(e.id),
    })),
  });
}
