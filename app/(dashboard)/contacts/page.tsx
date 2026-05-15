import { getContacts } from "./actions";
import { searchCompanies } from "../companies/actions";
import { ContactsTable } from "./contacts-table";

interface ContactsPageProps {
  searchParams: Promise<{ search?: string; type?: string }>;
}

export default async function ContactsPage({ searchParams }: ContactsPageProps) {
  const params = await searchParams;
  const search = params.search ?? "";
  const type = params.type ?? "all";

  const [contacts, companies] = await Promise.all([
    getContacts(search || undefined, type || undefined),
    searchCompanies(),
  ]);

  return (
    <div className="p-6">
      <ContactsTable
        contacts={contacts}
        companies={companies}
        search={search}
        type={type}
      />
    </div>
  );
}
