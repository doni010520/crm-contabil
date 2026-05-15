import { getCompanies } from "./actions";
import { CompaniesClient } from "./companies-client";

interface CompaniesPageProps {
  searchParams: Promise<{ search?: string }>;
}

export default async function CompaniesPage({
  searchParams,
}: CompaniesPageProps) {
  const params = await searchParams;
  const search = params.search ?? "";

  const companies = await getCompanies(search || undefined);

  return (
    <div className="p-6">
      <CompaniesClient companies={companies} search={search} />
    </div>
  );
}
