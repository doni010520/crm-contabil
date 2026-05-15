"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface Company {
  id: string;
  tenant_id: string;
  cnpj: string | null;
  company_name: string;
  trade_name: string | null;
  cnae_code: string | null;
  cnae_description: string | null;
  tax_regime: string | null;
  company_size: string | null;
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  founding_date: string | null;
  has_branches: boolean;
  monthly_revenue: number | null;
  employee_count: number | null;
  monthly_invoices: number | null;
  niche: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  notes: string | null;
  enriched_at: string | null;
  created_at: string;
  updated_at: string;
  contacts_count?: number;
  deals_count?: number;
}

export interface CompanyListItem {
  id: string;
  company_name: string;
  trade_name: string | null;
  cnpj: string | null;
  tax_regime: string | null;
  address_state: string | null;
  address_city: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// List companies
// ---------------------------------------------------------------------------
export async function getCompanies(
  search?: string
): Promise<CompanyListItem[]> {
  const supabase = await createClient();

  let query = supabase
    .from("companies")
    .select(
      "id, company_name, trade_name, cnpj, tax_regime, address_state, address_city, phone, email, created_at"
    )
    .order("company_name", { ascending: true });

  if (search) {
    const term = `%${search}%`;
    query = query.or(
      `company_name.ilike.${term},trade_name.ilike.${term},cnpj.ilike.${term},email.ilike.${term}`
    );
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []) as CompanyListItem[];
}

// ---------------------------------------------------------------------------
// Get single company
// ---------------------------------------------------------------------------
export async function getCompany(id: string): Promise<Company> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data as Company;
}

// ---------------------------------------------------------------------------
// Search companies (lightweight, for dropdowns)
// ---------------------------------------------------------------------------
export async function searchCompanies(
  term?: string
): Promise<{ id: string; company_name: string; cnpj: string | null }[]> {
  const supabase = await createClient();

  let query = supabase
    .from("companies")
    .select("id, company_name, cnpj")
    .order("company_name", { ascending: true })
    .limit(50);

  if (term) {
    const t = `%${term}%`;
    query = query.or(
      `company_name.ilike.${t},trade_name.ilike.${t},cnpj.ilike.${t}`
    );
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

// ---------------------------------------------------------------------------
// Helper: extract company fields from FormData
// ---------------------------------------------------------------------------
function extractCompanyFields(formData: FormData) {
  const fields: Record<string, unknown> = {};

  const textFields = [
    "company_name",
    "trade_name",
    "cnpj",
    "cnae_code",
    "cnae_description",
    "tax_regime",
    "company_size",
    "address_street",
    "address_number",
    "address_complement",
    "address_neighborhood",
    "address_city",
    "address_state",
    "address_zip",
    "niche",
    "phone",
    "email",
    "website",
    "notes",
  ];

  for (const field of textFields) {
    const value = formData.get(field);
    fields[field] = value !== null && value !== "" ? value : null;
  }

  // company_name is required
  const name = formData.get("company_name");
  fields.company_name = name ? String(name) : "";

  // Numeric fields
  const monthlyRevenue = formData.get("monthly_revenue");
  fields.monthly_revenue = monthlyRevenue ? Number(monthlyRevenue) : null;

  const employeeCount = formData.get("employee_count");
  fields.employee_count = employeeCount ? Number(employeeCount) : null;

  const monthlyInvoices = formData.get("monthly_invoices");
  fields.monthly_invoices = monthlyInvoices ? Number(monthlyInvoices) : null;

  // Date
  const foundingDate = formData.get("founding_date");
  fields.founding_date = foundingDate || null;

  // Boolean
  fields.has_branches = formData.get("has_branches") === "true";

  return fields;
}

// ---------------------------------------------------------------------------
// Create company
// ---------------------------------------------------------------------------
export async function createCompany(formData: FormData) {
  const supabase = await createClient();

  // Get tenant_id
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

  const fields = extractCompanyFields(formData);

  const { error } = await supabase.from("companies").insert({
    ...fields,
    tenant_id: dbUser.tenant_id,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/companies");
}

// ---------------------------------------------------------------------------
// Update company
// ---------------------------------------------------------------------------
export async function updateCompany(id: string, formData: FormData) {
  const supabase = await createClient();
  const fields = extractCompanyFields(formData);

  const { error } = await supabase
    .from("companies")
    .update(fields)
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/companies");
  revalidatePath(`/companies/${id}`);
}

// ---------------------------------------------------------------------------
// Delete company
// ---------------------------------------------------------------------------
export async function deleteCompany(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("companies").delete().eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/companies");
}

// ---------------------------------------------------------------------------
// Enrich company via Brasil API (CNPJ)
// ---------------------------------------------------------------------------
export async function enrichCompany(id: string) {
  const supabase = await createClient();

  const { data: company, error: fetchError } = await supabase
    .from("companies")
    .select("cnpj")
    .eq("id", id)
    .single();

  if (fetchError || !company) throw new Error("Empresa nao encontrada.");
  if (!company.cnpj) throw new Error("CNPJ nao informado para esta empresa.");

  const cnpjDigits = company.cnpj.replace(/\D/g, "");
  if (cnpjDigits.length !== 14) throw new Error("CNPJ invalido.");

  const response = await fetch(
    `https://brasilapi.com.br/api/cnpj/v1/${cnpjDigits}`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error("Nao foi possivel consultar o CNPJ na Brasil API.");
  }

  const data = await response.json();

  const updates: Record<string, unknown> = {
    company_name: data.razao_social || null,
    trade_name: data.nome_fantasia || null,
    cnae_code: data.cnae_fiscal
      ? String(data.cnae_fiscal)
      : null,
    cnae_description: data.cnae_fiscal_descricao || null,
    phone: data.ddd_telefone_1
      ? `(${data.ddd_telefone_1.substring(0, 2)}) ${data.ddd_telefone_1.substring(2)}`
      : null,
    email:
      data.email && data.email.trim()
        ? data.email.trim().toLowerCase()
        : null,
    address_street: data.logradouro || null,
    address_number: data.numero || null,
    address_complement: data.complemento || null,
    address_neighborhood: data.bairro || null,
    address_city: data.municipio || null,
    address_state: data.uf || null,
    address_zip: data.cep ? data.cep.replace(/\D/g, "") : null,
    founding_date: data.data_inicio_atividade || null,
    enriched_at: new Date().toISOString(),
  };

  // Map porte to company_size
  if (data.porte) {
    const porteMap: Record<string, string> = {
      "MICRO EMPRESA": "me",
      "EMPRESA DE PEQUENO PORTE": "epp",
      DEMAIS: "medium",
    };
    updates.company_size = porteMap[data.porte] || "unknown";
  }

  const { error: updateError } = await supabase
    .from("companies")
    .update(updates)
    .eq("id", id);

  if (updateError) throw new Error(updateError.message);

  revalidatePath("/companies");
  revalidatePath(`/companies/${id}`);

  return updates;
}

// ---------------------------------------------------------------------------
// Get contacts linked to a company
// ---------------------------------------------------------------------------
export async function getCompanyContacts(
  companyId: string
): Promise<{ id: string; name: string; email: string | null; phone: string | null; type: string }[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("contacts")
    .select("id, name, email, phone, type")
    .eq("company_id", companyId)
    .order("name");

  if (error) throw new Error(error.message);
  return data ?? [];
}

// ---------------------------------------------------------------------------
// Get deals linked to a company
// ---------------------------------------------------------------------------
export async function getCompanyDeals(
  companyId: string
): Promise<{ id: string; title: string; value: number; stage: { name: string } | null }[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("deals")
    .select("id, title, value, stage:pipeline_stages!stage_id(name)")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((d) => ({
    ...d,
    stage: Array.isArray(d.stage) ? d.stage[0] : d.stage,
  })) as { id: string; title: string; value: number; stage: { name: string } | null }[];
}
