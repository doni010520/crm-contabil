"use server";

import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Dashboard metrics
// ---------------------------------------------------------------------------
export interface DashboardMetrics {
  totalContacts: number;
  activeContracts: number;
  pendingProposals: number;
  monthlyRevenue: number;
  pipelineTotalValue: number;
  contactsByType: { type: string; count: number }[];
  recentContacts: {
    id: string;
    contact_name: string;
    company_name: string | null;
    type: string | null;
    created_at: string;
  }[];
  pipelineStages: {
    id: string;
    name: string;
    color: string;
    position: number;
    count: number;
    value: number;
  }[];
  expiringContracts: {
    id: string;
    title: string;
    end_date: string;
    monthly_value: number;
    contacts: {
      id: string;
      contact_name: string;
      company_name: string | null;
    } | null;
  }[];
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const supabase = await createClient();

  // Run all queries in parallel
  const [
    contactsRes,
    contractsRes,
    proposalsRes,
    pipelineStagesRes,
    pipelineEntriesRes,
    recentContactsRes,
    expiringContractsRes,
  ] = await Promise.all([
    // Total contacts
    supabase.from("contacts").select("id, type"),
    // Active contracts
    supabase.from("contracts").select("id, status, monthly_value"),
    // Pending proposals
    supabase.from("proposals").select("id, status, total"),
    // Pipeline stages
    supabase
      .from("pipeline_stages")
      .select("id, name, color, position")
      .order("position", { ascending: true }),
    // Pipeline entries
    supabase.from("pipeline_entries").select("id, stage_id, expected_value"),
    // Recent contacts (last 5)
    supabase
      .from("contacts")
      .select("id, contact_name, company_name, type, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    // Expiring contracts (next 30 days)
    supabase
      .from("contracts")
      .select("id, title, end_date, monthly_value, contacts(id, contact_name, company_name)")
      .eq("status", "active")
      .not("end_date", "is", null)
      .lte("end_date", new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
      .gte("end_date", new Date().toISOString().split("T")[0])
      .order("end_date", { ascending: true })
      .limit(5),
  ]);

  const contacts = contactsRes.data ?? [];
  const contracts = contractsRes.data ?? [];
  const proposals = proposalsRes.data ?? [];
  const stages = pipelineStagesRes.data ?? [];
  const entries = pipelineEntriesRes.data ?? [];
  const recentContacts = recentContactsRes.data ?? [];
  const expiringContracts = expiringContractsRes.data ?? [];

  // Calculate metrics
  const totalContacts = contacts.length;

  const activeContracts = contracts.filter((c) => c.status === "active").length;

  const pendingProposals = proposals.filter(
    (p) => p.status === "draft" || p.status === "sent"
  ).length;

  const monthlyRevenue = contracts
    .filter((c) => c.status === "active")
    .reduce((sum, c) => sum + (c.monthly_value ?? 0), 0);

  const pipelineTotalValue = entries.reduce(
    (sum, e) => sum + (e.expected_value ?? 0),
    0
  );

  // Contacts by type
  const typeMap = new Map<string, number>();
  for (const c of contacts) {
    const t = c.type || "lead";
    typeMap.set(t, (typeMap.get(t) ?? 0) + 1);
  }
  const contactsByType = Array.from(typeMap.entries()).map(([type, count]) => ({
    type,
    count,
  }));

  // Pipeline stages with counts
  const pipelineStages = stages.map((stage) => {
    const stageEntries = entries.filter((e) => e.stage_id === stage.id);
    return {
      ...stage,
      count: stageEntries.length,
      value: stageEntries.reduce((sum, e) => sum + (e.expected_value ?? 0), 0),
    };
  });

  return {
    totalContacts,
    activeContracts,
    pendingProposals,
    monthlyRevenue,
    pipelineTotalValue,
    contactsByType,
    recentContacts: recentContacts as DashboardMetrics["recentContacts"],
    pipelineStages,
    expiringContracts: expiringContracts as unknown as DashboardMetrics["expiringContracts"],
  };
}
