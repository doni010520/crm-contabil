import { notFound } from "next/navigation";
import { getProposal } from "../actions";
import { ProposalDetailClient } from "./proposal-detail-client";

interface ProposalDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProposalDetailPage({
  params,
}: ProposalDetailPageProps) {
  const { id } = await params;

  let proposal;
  try {
    proposal = await getProposal(id);
  } catch {
    notFound();
  }

  if (!proposal) {
    notFound();
  }

  return <ProposalDetailClient proposal={proposal} />;
}
