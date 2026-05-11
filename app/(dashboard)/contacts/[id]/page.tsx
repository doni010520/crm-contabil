import { notFound } from "next/navigation";
import { getContact } from "../actions";
import { ContactDetailClient } from "./contact-detail-client";

interface ContactDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ContactDetailPage({ params }: ContactDetailPageProps) {
  const { id } = await params;

  let contact;
  try {
    contact = await getContact(id);
  } catch {
    notFound();
  }

  if (!contact) {
    notFound();
  }

  return <ContactDetailClient contact={contact} />;
}
