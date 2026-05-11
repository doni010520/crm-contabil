import { notFound } from "next/navigation";
import { getContract } from "../actions";
import { ContractDetailClient } from "./contract-detail-client";

interface ContractDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ContractDetailPage({
  params,
}: ContractDetailPageProps) {
  const { id } = await params;

  let contract;
  try {
    contract = await getContract(id);
  } catch {
    notFound();
  }

  if (!contract) {
    notFound();
  }

  return <ContractDetailClient contract={contract} />;
}
