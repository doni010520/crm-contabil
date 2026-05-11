import { getContacts } from "./actions";
import { ContactsTable } from "./contacts-table";

interface ContactsPageProps {
  searchParams: Promise<{ search?: string; type?: string }>;
}

export default async function ContactsPage({ searchParams }: ContactsPageProps) {
  const params = await searchParams;
  const search = params.search ?? "";
  const type = params.type ?? "all";

  const contacts = await getContacts(search || undefined, type || undefined);

  return (
    <div className="p-6">
      <ContactsTable contacts={contacts} search={search} type={type} />
    </div>
  );
}
