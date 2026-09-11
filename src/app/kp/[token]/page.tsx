import { notFound } from "next/navigation";
import {
  getContractorById,
  getOrderById,
  getOrderItems,
  getProposalBlocks,
  getProposalByToken,
  markProposalViewed,
} from "@/lib/crm/db";
import { ProposalDocument, type ProposalDocumentData } from "@/components/proposal/ProposalDocument";
import { AcceptBar } from "@/components/proposal/AcceptBar";

export const dynamic = "force-dynamic";

export default async function ProposalPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ internal?: string }>;
}) {
  const { token } = await params;
  const { internal } = await searchParams;
  const proposal = getProposalByToken(token);
  if (!proposal) notFound();

  const order = getOrderById(proposal.order_id);
  const contractor = order ? getContractorById(order.contractor_id) : undefined;
  if (!order || !contractor) notFound();

  // ?internal=1 — рендер для собственного экспорта в PDF, а не реальный просмотр клиентом
  if (!internal) markProposalViewed(proposal.id);
  const items = getOrderItems(order.id);

  const data: ProposalDocumentData = {
    template: proposal.template,
    status: proposal.status,
    intro: proposal.intro,
    solution: proposal.solution,
    terms: proposal.terms,
    validUntil: proposal.valid_until,
    orderId: order.id,
    orderTitle: order.title,
    orderDescription: order.description,
    contractorName: contractor.name,
    contractorCompany: contractor.company,
    items,
    totalKopecks: order.amount_kopecks,
    blocks: getProposalBlocks(proposal),
  };

  return (
    <div className="min-h-screen bg-bg pb-24">
      <ProposalDocument data={data} />
      {!internal && (
        <AcceptBar token={token} initialStatus={proposal.status === "accepted" ? "accepted" : "pending"} />
      )}
    </div>
  );
}
