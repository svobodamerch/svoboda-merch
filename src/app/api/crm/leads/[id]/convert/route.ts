import { NextRequest, NextResponse } from "next/server";
import { getLeadById, linkLeadConversion } from "@/lib/db";
import { createContractor, createOrder } from "@/lib/crm/db";
import { getCurrentActor } from "@/lib/crm/current-user";

/**
 * Заявка → контрагент + сделка. Сумма неизвестна из формы (там только тип
 * продукции и тираж, без цены) — заводим сделку с нулевой суммой, сумму
 * проставляют вручную после расчёта.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const lead = getLeadById(id);
  if (!lead) return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });
  if (lead.converted_order_id) {
    return NextResponse.json({ error: "Уже превращена в сделку" }, { status: 400 });
  }

  const actor = await getCurrentActor();

  const contractor = createContractor(
    {
      type: "client",
      name: lead.name,
      company: lead.company || undefined,
      phone: lead.phone,
      telegram: lead.telegram || undefined,
      notes: `Заявка с сайта №${lead.id} от ${lead.created_at.slice(0, 10)}`,
    },
    actor,
  );

  const order = createOrder(
    {
      contractor_id: contractor.id,
      title: `${lead.product_type} — заявка с сайта №${lead.id}`,
      description: [`Тираж: ${lead.quantity}`, lead.comment].filter(Boolean).join("\n"),
      amount_kopecks: 0,
      deadline: lead.deadline || undefined,
      source: "lead",
    },
    actor,
  );

  linkLeadConversion(lead.id, contractor.id, order.id);

  return NextResponse.json({ contractorId: contractor.id, orderId: order.id });
}
