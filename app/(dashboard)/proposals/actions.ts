"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type ProposalStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "accepted"
  | "rejected"
  | "expired";

export interface ProposalItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Proposal {
  id: string;
  tenant_id: string;
  contact_id: string;
  title: string;
  status: ProposalStatus;
  valid_until: string | null;
  items: ProposalItem[];
  total: number;
  notes: string | null;
  sent_at: string | null;
  viewed_at: string | null;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
  contacts?: {
    id: string;
    name: string;
    company_name: string | null;
    email: string | null;
  };
}

// ---------------------------------------------------------------------------
// List proposals (with optional status filter)
// ---------------------------------------------------------------------------
export async function getProposals(status?: string) {
  const supabase = await createClient();

  let query = supabase
    .from("proposals")
    .select("*, contacts(id, name, company_name, email)")
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Proposal[];
}

// ---------------------------------------------------------------------------
// Get single proposal
// ---------------------------------------------------------------------------
export async function getProposal(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("proposals")
    .select("*, contacts(id, name, company_name, email, phone)")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Proposal & {
    contacts: {
      id: string;
      name: string;
      company_name: string | null;
      email: string | null;
      phone: string | null;
    };
  };
}

// ---------------------------------------------------------------------------
// Create proposal
// ---------------------------------------------------------------------------
export async function createProposal(formData: FormData) {
  const supabase = await createClient();

  const itemsRaw = formData.get("items");
  const items: ProposalItem[] = itemsRaw ? JSON.parse(String(itemsRaw)) : [];
  const total = items.reduce((sum, item) => sum + item.total, 0);

  const fields = {
    contact_id: String(formData.get("contact_id")),
    title: String(formData.get("title")),
    valid_until: formData.get("valid_until")
      ? String(formData.get("valid_until"))
      : null,
    items,
    total,
    notes: formData.get("notes") ? String(formData.get("notes")) : null,
    status: "draft" as const,
  };

  const { data, error } = await supabase
    .from("proposals")
    .insert(fields)
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/proposals");
  return data;
}

// ---------------------------------------------------------------------------
// Update proposal
// ---------------------------------------------------------------------------
export async function updateProposal(id: string, formData: FormData) {
  const supabase = await createClient();

  const itemsRaw = formData.get("items");
  const items: ProposalItem[] = itemsRaw ? JSON.parse(String(itemsRaw)) : [];
  const total = items.reduce((sum, item) => sum + item.total, 0);

  const fields = {
    contact_id: String(formData.get("contact_id")),
    title: String(formData.get("title")),
    valid_until: formData.get("valid_until")
      ? String(formData.get("valid_until"))
      : null,
    items,
    total,
    notes: formData.get("notes") ? String(formData.get("notes")) : null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("proposals")
    .update(fields)
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/proposals");
  revalidatePath(`/proposals/${id}`);
}

// ---------------------------------------------------------------------------
// Delete proposal
// ---------------------------------------------------------------------------
export async function deleteProposal(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("proposals").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/proposals");
}

// ---------------------------------------------------------------------------
// Update proposal status
// ---------------------------------------------------------------------------
export async function updateProposalStatus(id: string, status: ProposalStatus) {
  const supabase = await createClient();

  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  // Set timestamp fields based on status
  if (status === "sent") {
    updates.sent_at = new Date().toISOString();
  } else if (status === "viewed") {
    updates.viewed_at = new Date().toISOString();
  } else if (status === "accepted") {
    updates.accepted_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("proposals")
    .update(updates)
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/proposals");
  revalidatePath(`/proposals/${id}`);
}

// ---------------------------------------------------------------------------
// Search contacts (for the contact selector in the sheet)
// ---------------------------------------------------------------------------
export async function searchContacts(term: string) {
  const supabase = await createClient();

  const search = `%${term}%`;
  const { data, error } = await supabase
    .from("contacts")
    .select("id, name, company_name, email")
    .or(
      `name.ilike.${search},company_name.ilike.${search},email.ilike.${search}`
    )
    .order("name")
    .limit(20);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}
