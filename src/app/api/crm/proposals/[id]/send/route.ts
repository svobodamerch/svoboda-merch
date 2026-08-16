import { NextRequest, NextResponse } from "next/server";
import { getContractorById, getOrderById, getProposalById, markProposalSent } from "@/lib/crm/db";
import { sendProposalEmail } from "@/lib/email";
import { getCurrentActor } from "@/lib/crm/current-user";
import { siteContact } from "@/lib/navigation";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const proposal = getProposalById(id);
  if (!proposal) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  const order = getOrderById(proposal.order_id);
  const contractor = order ? getContractorById(order.contractor_id) : undefined;
  if (!order || !contractor) {
    return NextResponse.json({ error: "Заказ или контрагент не найден" }, { status: 404 });
  }

  const link = `${siteContact.siteHref}/kp/${proposal.token}`;
  const body = await request.json().catch(() => ({}));
  const channel = body.channel === "email" ? "email" : "link";

  if (channel === "email") {
    if (!contractor.email) {
      return NextResponse.json({ error: "У контрагента не указан email" }, { status: 400 });
    }
    const sent = await sendProposalEmail(contractor.email, contractor.name, order.title, link);
    if (!sent) {
      return NextResponse.json({ error: "Не удалось отправить письмо — проверьте настройки SMTP" }, { status: 502 });
    }
  }

  const actor = await getCurrentActor();
  markProposalSent(id, channel, actor);

  return NextResponse.json({ link, proposal: getProposalById(id) });
}
