"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface PipelineStage {
  id: string;
  tenant_id: string;
  name: string;
  position: number;
  color: string;
  created_at: string;
}

export interface Deal {
  id: string;
  tenant_id: string;
  contact_id: string;
  stage_id: string;
  assigned_to: string | null;
  title: string;
  value: number;
  expected_close_date: string | null;
  lost_reason: string | null;
  won_at: string | null;
  lost_at: string | null;
  created_at: string;
  updated_at: string;
  contact: {
    id: string;
    name: string;
    company_name: string | null;
    email: string | null;
    phone: string | null;
  };
}

/** @deprecated Use Deal instead */
export type PipelineEntry = Deal;

// ---------------------------------------------------------------------------
// List pipeline stages ordered by position
// ---------------------------------------------------------------------------
export async function getStages(): Promise<PipelineStage[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("pipeline_stages")
    .select("*")
    .order("position", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

// ---------------------------------------------------------------------------
// List deals with contact info
// ---------------------------------------------------------------------------
export async function getEntries(): Promise<Deal[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("deals")
    .select(
      `
      *,
      contact:contacts!contact_id (
        id,
        name,
        company_name,
        email,
        phone
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data as unknown as Deal[]) ?? [];
}

// ---------------------------------------------------------------------------
// Create deal
// ---------------------------------------------------------------------------
export async function createEntry(formData: FormData) {
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

  const contact_id = formData.get("contact_id") as string;
  const stage_id = formData.get("stage_id") as string;
  const value = formData.get("value");
  const title = (formData.get("title") as string) || "Novo deal";

  if (!contact_id || !stage_id) {
    throw new Error("Contato e estágio são obrigatórios.");
  }

  const { error } = await supabase.from("deals").insert({
    tenant_id: dbUser.tenant_id,
    contact_id,
    stage_id,
    title,
    value: value ? Number(value) : 0,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/pipeline");
}

// ---------------------------------------------------------------------------
// Move deal to different stage
// ---------------------------------------------------------------------------
export async function moveEntry(entryId: string, newStageId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("deals")
    .update({
      stage_id: newStageId,
    })
    .eq("id", entryId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/pipeline");
}

// ---------------------------------------------------------------------------
// Delete deal
// ---------------------------------------------------------------------------
export async function deleteEntry(entryId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("deals")
    .delete()
    .eq("id", entryId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/pipeline");
}

// ---------------------------------------------------------------------------
// Update stage name/color
// ---------------------------------------------------------------------------
export async function updateStage(
  stageId: string,
  data: { name?: string; color?: string }
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("pipeline_stages")
    .update(data)
    .eq("id", stageId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/pipeline");
}

// ---------------------------------------------------------------------------
// Search contacts not already in pipeline (for add-deal dialog)
// ---------------------------------------------------------------------------
export async function searchAvailableContacts(search: string) {
  const supabase = await createClient();

  // Get contact IDs already in pipeline
  const { data: existingEntries } = await supabase
    .from("deals")
    .select("contact_id");

  const existingIds = (existingEntries ?? []).map((e) => e.contact_id);

  let query = supabase
    .from("contacts")
    .select("id, name, company_name, email")
    .order("name", { ascending: true })
    .limit(20);

  if (search) {
    const term = `%${search}%`;
    query = query.or(
      `name.ilike.${term},company_name.ilike.${term},email.ilike.${term}`
    );
  }

  if (existingIds.length > 0) {
    query = query.not("id", "in", `(${existingIds.join(",")})`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}
