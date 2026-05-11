import { getProposals } from "./actions";
import { ProposalsTable } from "./proposals-table";

interface ProposalsPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function ProposalsPage({
  searchParams,
}: ProposalsPageProps) {
  const params = await searchParams;
  const status = params.status ?? "all";

  const proposals = await getProposals(status || undefined);

  return (
    <div className="p-6">
      <ProposalsTable proposals={proposals} status={status} />
    </div>
  );
}
