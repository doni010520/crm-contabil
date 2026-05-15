"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// List contacts (with optional search & type filter)
// ---------------------------------------------------------------------------
export async function getContacts(search?: string, type?: string) {
  const supabase = await createClient();

  let query = supabase
    .from("contacts")
    .select("*, company:companies!company_id(id, company_name)")
    .order("created_at", { ascending: false });

  if (type && type !== "all") {
    query = query.eq("type", type);
  }

  if (search) {
    const term = `%${search}%`;
    query = query.or(
      `name.ilike.${term},email.ilike.${term},phone.ilike.${term},cnpj.ilike.${term},company_name.ilike.${term}`
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

// ---------------------------------------------------------------------------
// Get single contact
// ---------------------------------------------------------------------------
export async function getContact(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

// ---------------------------------------------------------------------------
// Helper: extract contact fields from FormData
// ---------------------------------------------------------------------------
function extractContactFields(formData: FormData) {
  const fields: Record<string, unknown> = {};

  const textFields = [
    "type",
    "person_type",
    "company_name",
    "trade_name",
    "name",
    "email",
    "phone",
    "cnpj",
    "cpf",
    "address_street",
    "address_number",
    "address_complement",
    "address_neighborhood",
    "address_city",
    "address_state",
    "address_zip",
    "tax_regime",
    "current_accountant",
    "source",
    "notes",
  ];

  for (const field of textFields) {
    const value = formData.get(field);
    if (value !== null && value !== "") {
      fields[field] = value;
    } else {
      fields[field] = null;
    }
  }

  // name is required — keep empty string rather than null
  const contactName = formData.get("name");
  fields.name = contactName ? String(contactName) : "";

  // Numeric fields
  const employeeCount = formData.get("employee_count");
  fields.employee_count = employeeCount ? Number(employeeCount) : 0;

  const monthlyRevenue = formData.get("monthly_revenue");
  fields.monthly_revenue = monthlyRevenue ? Number(monthlyRevenue) : null;

  const score = formData.get("score");
  fields.score = score ? Number(score) : 0;

  // Tags (comma-separated)
  const tagsRaw = formData.get("tags");
  if (tagsRaw && String(tagsRaw).trim()) {
    fields.tags = String(tagsRaw)
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  } else {
    fields.tags = [];
  }

  // assigned_to (uuid or empty)
  const assignedTo = formData.get("assigned_to");
  fields.assigned_to = assignedTo ? String(assignedTo) : null;

  // company_id (uuid or empty)
  const companyId = formData.get("company_id");
  fields.company_id = companyId ? String(companyId) : null;

  return fields;
}

// ---------------------------------------------------------------------------
// Create contact
// ---------------------------------------------------------------------------
export async function createContact(formData: FormData) {
  const supabase = await createClient();
  const fields = extractContactFields(formData);

  const { error } = await supabase.from("contacts").insert(fields);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/contacts");
}

// ---------------------------------------------------------------------------
// Update contact
// ---------------------------------------------------------------------------
export async function updateContact(id: string, formData: FormData) {
  const supabase = await createClient();
  const fields = extractContactFields(formData);

  const { error } = await supabase
    .from("contacts")
    .update(fields)
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/contacts");
  revalidatePath(`/contacts/${id}`);
}

// ---------------------------------------------------------------------------
// Delete contact
// ---------------------------------------------------------------------------
export async function deleteContact(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("contacts").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/contacts");
}

// ---------------------------------------------------------------------------
// Enrich contact via Brasil API (CNPJ)
// ---------------------------------------------------------------------------
export async function enrichContact(id: string) {
  const supabase = await createClient();

  // Fetch current contact to get CNPJ
  const { data: contact, error: fetchError } = await supabase
    .from("contacts")
    .select("cnpj")
    .eq("id", id)
    .single();

  if (fetchError || !contact) {
    throw new Error("Contato não encontrado.");
  }

  if (!contact.cnpj) {
    throw new Error("CNPJ não informado para este contato.");
  }

  // Strip non-digits
  const cnpjDigits = contact.cnpj.replace(/\D/g, "");

  if (cnpjDigits.length !== 14) {
    throw new Error("CNPJ inválido.");
  }

  // Call Brasil API
  const response = await fetch(
    `https://brasilapi.com.br/api/cnpj/v1/${cnpjDigits}`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error("Não foi possível consultar o CNPJ na Brasil API.");
  }

  const data = await response.json();

  // Map Brasil API fields to our schema
  const updates: Record<string, unknown> = {
    company_name: data.razao_social || null,
    trade_name: data.nome_fantasia || null,
    phone: data.ddd_telefone_1
      ? `(${data.ddd_telefone_1.substring(0, 2)}) ${data.ddd_telefone_1.substring(2)}`
      : null,
    email: data.email && data.email.trim() ? data.email.trim().toLowerCase() : null,
    address_street: data.logradouro || null,
    address_number: data.numero || null,
    address_complement: data.complemento || null,
    address_neighborhood: data.bairro || null,
    address_city: data.municipio || null,
    address_state: data.uf || null,
    address_zip: data.cep ? data.cep.replace(/\D/g, "") : null,
    enriched_at: new Date().toISOString(),
  };

  const { error: updateError } = await supabase
    .from("contacts")
    .update(updates)
    .eq("id", id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  revalidatePath("/contacts");
  revalidatePath(`/contacts/${id}`);

  return updates;
}
