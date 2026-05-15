"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type ContractStatus =
  | "draft"
  | "active"
  | "suspended"
  | "cancelled"
  | "expired";

export interface ServiceItem {
  name: string;
  value: number;
}

export interface Contract {
  id: string;
  tenant_id: string;
  contact_id: string;
  proposal_id: string | null;
  title: string;
  status: ContractStatus;
  monthly_value: number;
  start_date: string;
  end_date: string | null;
  auto_renew: boolean;
  services: ServiceItem[];
  signed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
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
// List contracts (with optional status filter)
// ---------------------------------------------------------------------------
export async function getContracts(status?: string) {
  const supabase = await createClient();

  let query = supabase
    .from("contracts")
    .select("*, contacts(id, name, company_name, email)")
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Contract[];
}

// ---------------------------------------------------------------------------
// Get single contract
// ---------------------------------------------------------------------------
export async function getContract(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("contracts")
    .select("*, contacts(id, name, company_name, email, phone)")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Contract & {
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
// Create contract
// ---------------------------------------------------------------------------
export async function createContract(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nao autenticado.");

  const { data: dbUser } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("auth_id", user.id)
    .single();
  if (!dbUser) throw new Error("Usuario nao encontrado.");

  const servicesRaw = formData.get("services");
  const services: ServiceItem[] = servicesRaw
    ? JSON.parse(String(servicesRaw))
    : [];
  const monthlyValue = services.reduce((sum, s) => sum + s.value, 0);

  const fields = {
    tenant_id: dbUser.tenant_id,
    contact_id: String(formData.get("contact_id")),
    title: String(formData.get("title")),
    monthly_value: monthlyValue,
    start_date: String(formData.get("start_date")),
    end_date: formData.get("end_date")
      ? String(formData.get("end_date"))
      : null,
    auto_renew: formData.get("auto_renew") === "true",
    services,
    notes: formData.get("notes") ? String(formData.get("notes")) : null,
    status: "draft" as const,
  };

  const { data, error } = await supabase
    .from("contracts")
    .insert(fields)
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/contracts");
  return data;
}

// ---------------------------------------------------------------------------
// Update contract
// ---------------------------------------------------------------------------
export async function updateContract(id: string, formData: FormData) {
  const supabase = await createClient();

  const servicesRaw = formData.get("services");
  const services: ServiceItem[] = servicesRaw
    ? JSON.parse(String(servicesRaw))
    : [];
  const monthlyValue = services.reduce((sum, s) => sum + s.value, 0);

  const fields = {
    contact_id: String(formData.get("contact_id")),
    title: String(formData.get("title")),
    monthly_value: monthlyValue,
    start_date: String(formData.get("start_date")),
    end_date: formData.get("end_date")
      ? String(formData.get("end_date"))
      : null,
    auto_renew: formData.get("auto_renew") === "true",
    services,
    notes: formData.get("notes") ? String(formData.get("notes")) : null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("contracts")
    .update(fields)
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/contracts");
  revalidatePath(`/contracts/${id}`);
}

// ---------------------------------------------------------------------------
// Delete contract
// ---------------------------------------------------------------------------
export async function deleteContract(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("contracts").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/contracts");
}

// ---------------------------------------------------------------------------
// Update contract status
// ---------------------------------------------------------------------------
export async function updateContractStatus(
  id: string,
  status: ContractStatus,
  reason?: string
) {
  const supabase = await createClient();

  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === "active") {
    updates.signed_at = new Date().toISOString();
  } else if (status === "cancelled") {
    updates.cancelled_at = new Date().toISOString();
    if (reason) {
      updates.cancellation_reason = reason;
    }
  }

  const { error } = await supabase
    .from("contracts")
    .update(updates)
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/contracts");
  revalidatePath(`/contracts/${id}`);
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
