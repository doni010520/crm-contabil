"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface TenantCalculator {
  id: string;
  tenant_id: string;
  type: string;
  is_active: boolean;
  slug: string;
  cta_text: string | null;
  cta_action: string;
  cta_url: string | null;
  leads_count: number;
  created_at: string;
  updated_at: string;
}

export interface CalculatorLead {
  id: string;
  tenant_id: string;
  calculator_id: string;
  contact_id: string | null;
  calculator_type: string;
  name: string;
  phone: string;
  email: string | null;
  company_name: string | null;
  inputs: Record<string, unknown>;
  result: Record<string, unknown>;
  score: number | null;
  score_level: string | null;
  source: string | null;
  viewed: boolean;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Calculator type metadata
// ---------------------------------------------------------------------------
const CALCULATOR_TYPES = [
  { type: "regime_simulator", slug: "simulador-regime-tributario" },
  { type: "clt_cost", slug: "custo-funcionario-clt" },
  { type: "fiscal_health", slug: "quiz-saude-fiscal" },
  { type: "opening_cost", slug: "custo-abertura-empresa" },
];

// ---------------------------------------------------------------------------
// Helper: get current user tenant_id
// ---------------------------------------------------------------------------
async function getTenantId() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) throw new Error("Não autenticado.");

  const { data: dbUser } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("auth_id", authUser.id)
    .single();

  if (!dbUser) throw new Error("Usuário não encontrado.");

  return { supabase, tenantId: dbUser.tenant_id };
}

// ---------------------------------------------------------------------------
// Init calculators for tenant (create 4 records if they don't exist)
// ---------------------------------------------------------------------------
export async function initCalculators() {
  const { supabase, tenantId } = await getTenantId();

  const { data: existing } = await supabase
    .from("tenant_calculators")
    .select("type")
    .eq("tenant_id", tenantId);

  const existingTypes = (existing ?? []).map((c) => c.type);

  const toInsert = CALCULATOR_TYPES.filter(
    (ct) => !existingTypes.includes(ct.type)
  ).map((ct) => ({
    tenant_id: tenantId,
    type: ct.type,
    slug: ct.slug,
    is_active: false,
  }));

  if (toInsert.length > 0) {
    const { error } = await supabase
      .from("tenant_calculators")
      .insert(toInsert);

    if (error) throw new Error(error.message);
  }

  revalidatePath("/calculators");
}

// ---------------------------------------------------------------------------
// List tenant's calculators
// ---------------------------------------------------------------------------
export async function getCalculators(): Promise<TenantCalculator[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tenant_calculators")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []) as TenantCalculator[];
}

// ---------------------------------------------------------------------------
// Toggle calculator active/inactive
// ---------------------------------------------------------------------------
export async function toggleCalculator(id: string, active: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("tenant_calculators")
    .update({ is_active: active })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/calculators");
}

// ---------------------------------------------------------------------------
// Update calculator CTA settings
// ---------------------------------------------------------------------------
export async function updateCalculatorCta(id: string, formData: FormData) {
  const supabase = await createClient();

  const cta_text = formData.get("cta_text") as string;
  const cta_action = formData.get("cta_action") as string;
  const cta_url = formData.get("cta_url") as string;

  const { error } = await supabase
    .from("tenant_calculators")
    .update({
      cta_text: cta_text || null,
      cta_action: cta_action || "whatsapp",
      cta_url: cta_url || null,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/calculators");
}

// ---------------------------------------------------------------------------
// Get calculator leads with optional filters
// ---------------------------------------------------------------------------
export async function getCalculatorLeads(
  calculatorType?: string,
  period?: string
): Promise<CalculatorLead[]> {
  const supabase = await createClient();

  let query = supabase
    .from("calculator_leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (calculatorType && calculatorType !== "all") {
    query = query.eq("calculator_type", calculatorType);
  }

  if (period && period !== "all") {
    const now = new Date();
    let from: Date;
    switch (period) {
      case "7d":
        from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        from = new Date(0);
    }
    query = query.gte("created_at", from.toISOString());
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  return (data ?? []) as CalculatorLead[];
}

// ---------------------------------------------------------------------------
// Get single lead detail
// ---------------------------------------------------------------------------
export async function getLeadDetail(id: string): Promise<CalculatorLead> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("calculator_leads")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);

  return data as CalculatorLead;
}

// ---------------------------------------------------------------------------
// Mark lead as viewed
// ---------------------------------------------------------------------------
export async function markLeadViewed(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("calculator_leads")
    .update({ viewed: true })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/calculators/leads");
}

// ---------------------------------------------------------------------------
// Export leads as CSV data
// ---------------------------------------------------------------------------
export async function exportLeadsCsv(): Promise<string> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("calculator_leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const leads = (data ?? []) as CalculatorLead[];

  const typeLabels: Record<string, string> = {
    regime_simulator: "Simulador de Regime",
    clt_cost: "Custo CLT",
    fiscal_health: "Saúde Fiscal",
    opening_cost: "Custo Abertura",
  };

  const headers = [
    "Nome",
    "Telefone",
    "Email",
    "Empresa",
    "Calculadora",
    "Score",
    "Nível",
    "Data",
  ];

  const rows = leads.map((lead) => [
    lead.name,
    lead.phone,
    lead.email || "",
    lead.company_name || "",
    typeLabels[lead.calculator_type] || lead.calculator_type,
    lead.score?.toString() || "",
    lead.score_level || "",
    new Date(lead.created_at).toLocaleDateString("pt-BR"),
  ]);

  const csvContent = [
    headers.join(";"),
    ...rows.map((row) =>
      row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(";")
    ),
  ].join("\n");

  return csvContent;
}

// ---------------------------------------------------------------------------
// Get tenant slug (for building public links)
// ---------------------------------------------------------------------------
export async function getTenantSlug(): Promise<string> {
  const { supabase, tenantId } = await getTenantId();

  const { data, error } = await supabase
    .from("tenants")
    .select("slug")
    .eq("id", tenantId)
    .single();

  if (error || !data) throw new Error("Escritório não encontrado.");

  return data.slug;
}
