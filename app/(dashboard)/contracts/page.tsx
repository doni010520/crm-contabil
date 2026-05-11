import { getContracts } from "./actions";
import { ContractsTable } from "./contracts-table";

interface ContractsPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function ContractsPage({
  searchParams,
}: ContractsPageProps) {
  const params = await searchParams;
  const status = params.status ?? "all";

  const contracts = await getContracts(status || undefined);

  return (
    <div className="p-6">
      <ContractsTable contracts={contracts} status={status} />
    </div>
  );
}
