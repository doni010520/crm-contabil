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

export interface PipelineEntry {
  id: string;
  tenant_id: string;
  contact_id: string;
  stage_id: string;
  entered_at: string;
  expected_value: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  contact: {
    id: string;
    contact_name: string;
    company_name: string | null;
    email: string | null;
    phone: string | null;
  };
}

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
// List pipeline entries with contact info
// ---------------------------------------------------------------------------
export async function getEntries(): Promise<PipelineEntry[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("pipeline_entries")
    .select(
      `
      *,
      contact:contacts!contact_id (
        id,
        contact_name,
        company_name,
        email,
        phone
      )
    `
    )
    .order("entered_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data as unknown as PipelineEntry[]) ?? [];
}

// ---------------------------------------------------------------------------
// Create pipeline entry
// ---------------------------------------------------------------------------
export async function createEntry(formData: FormData) {
  const supabase = await createClient();

  const contact_id = formData.get("contact_id") as string;
  const stage_id = formData.get("stage_id") as string;
  const expected_value = formData.get("expected_value");
  const notes = formData.get("notes") as string | null;

  if (!contact_id || !stage_id) {
    throw new Error("Contato e estágio são obrigatórios.");
  }

  const { error } = await supabase.from("pipeline_entries").insert({
    contact_id,
    stage_id,
    expected_value: expected_value ? Number(expected_value) : null,
    notes: notes || null,
    entered_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/pipeline");
}

// ---------------------------------------------------------------------------
// Move entry to different stage
// ---------------------------------------------------------------------------
export async function moveEntry(entryId: string, newStageId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("pipeline_entries")
    .update({
      stage_id: newStageId,
      entered_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", entryId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/pipeline");
}

// ---------------------------------------------------------------------------
// Delete entry
// ---------------------------------------------------------------------------
export async function deleteEntry(entryId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("pipeline_entries")
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
    .from("pipeline_entries")
    .select("contact_id");

  const existingIds = (existingEntries ?? []).map((e) => e.contact_id);

  let query = supabase
    .from("contacts")
    .select("id, contact_name, company_name, email")
    .order("contact_name", { ascending: true })
    .limit(20);

  if (search) {
    const term = `%${search}%`;
    query = query.or(
      `contact_name.ilike.${term},company_name.ilike.${term},email.ilike.${term}`
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
