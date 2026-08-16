import { notFound } from "next/navigation";
import {
  getContractorById,
  getOrderById,
  getOrderItems,
  getProposalByToken,
  markProposalViewed,
} from "@/lib/crm/db";
import { ProposalDocument, type ProposalDocumentData } from "@/components/proposal/ProposalDocument";
import { AcceptBar } from "@/components/proposal/AcceptBar";

export const dynamic = "force-dynamic";

export default async function ProposalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const proposal = getProposalByToken(token);
  if (!proposal) notFound();

  const order = getOrderById(proposal.order_id);
  const contractor = order ? getContractorById(order.contractor_id) : undefined;
  if (!order || !contractor) notFound();

  markProposalViewed(proposal.id);
  const items = getOrderItems(order.id);

  const data: ProposalDocumentData = {
    template: proposal.template,
    status: proposal.status,
    intro: proposal.intro,
    solution: proposal.solution,
    terms: proposal.terms,
    validUntil: proposal.valid_until,
    orderTitle: order.title,
    orderDescription: order.description,
    contractorName: contractor.name,
    contractorCompany: contractor.company,
    items,
    totalKopecks: order.amount_kopecks,
  };

  return (
    <div className="min-h-screen bg-bg pb-24">
      <ProposalDocument data={data} />
      <AcceptBar token={token} initialStatus={proposal.status === "accepted" ? "accepted" : "pending"} />
    </div>
  );
}
