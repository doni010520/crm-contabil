"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface Task {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  due_time: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  status: "todo" | "in_progress" | "done" | "cancelled";
  contact_id: string | null;
  deal_id: string | null;
  assigned_to: string | null;
  created_by: string | null;
  completed_at: string | null;
  created_at: string;
  contact?: { id: string; name: string } | null;
  deal?: { id: string; title: string } | null;
  assignee?: { id: string; name: string } | null;
}

export interface TaskFilters {
  status?: string;
  priority?: string;
  assignedTo?: string;
  contactId?: string;
  dealId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
async function getUserTenant() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nao autenticado.");

  const { data: dbUser } = await supabase
    .from("users")
    .select("id, tenant_id")
    .eq("auth_id", user.id)
    .single();
  if (!dbUser) throw new Error("Usuario nao encontrado.");

  return { supabase, userId: dbUser.id, tenantId: dbUser.tenant_id };
}

// ---------------------------------------------------------------------------
// Get tasks (with filters)
// ---------------------------------------------------------------------------
export async function getTasks(filters?: TaskFilters): Promise<Task[]> {
  const { supabase } = await getUserTenant();

  let query = supabase
    .from("tasks")
    .select(
      `
      *,
      contact:contacts!contact_id(id, name),
      deal:deals!deal_id(id, title),
      assignee:users!assigned_to(id, name)
    `
    )
    .order("due_date", { ascending: true, nullsFirst: false });

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }
  if (filters?.priority && filters.priority !== "all") {
    query = query.eq("priority", filters.priority);
  }
  if (filters?.assignedTo && filters.assignedTo !== "all") {
    query = query.eq("assigned_to", filters.assignedTo);
  }
  if (filters?.contactId) {
    query = query.eq("contact_id", filters.contactId);
  }
  if (filters?.dealId) {
    query = query.eq("deal_id", filters.dealId);
  }
  if (filters?.dateFrom) {
    query = query.gte("due_date", filters.dateFrom);
  }
  if (filters?.dateTo) {
    query = query.lte("due_date", filters.dateTo);
  }
  if (filters?.search) {
    query = query.ilike("title", `%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map((t) => ({
    ...t,
    contact: Array.isArray(t.contact) ? t.contact[0] : t.contact,
    deal: Array.isArray(t.deal) ? t.deal[0] : t.deal,
    assignee: Array.isArray(t.assignee) ? t.assignee[0] : t.assignee,
  })) as Task[];
}

// ---------------------------------------------------------------------------
// Get tasks for calendar (by date range)
// ---------------------------------------------------------------------------
export async function getTasksForCalendar(
  startDate: string,
  endDate: string
): Promise<Task[]> {
  const { supabase } = await getUserTenant();

  const { data, error } = await supabase
    .from("tasks")
    .select(
      `
      *,
      contact:contacts!contact_id(id, name),
      assignee:users!assigned_to(id, name)
    `
    )
    .gte("due_date", startDate)
    .lte("due_date", endDate)
    .neq("status", "cancelled")
    .order("due_time", { ascending: true, nullsFirst: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((t) => ({
    ...t,
    contact: Array.isArray(t.contact) ? t.contact[0] : t.contact,
    assignee: Array.isArray(t.assignee) ? t.assignee[0] : t.assignee,
  })) as Task[];
}

// ---------------------------------------------------------------------------
// Create task
// ---------------------------------------------------------------------------
export async function createTask(input: {
  title: string;
  description?: string;
  dueDate?: string;
  dueTime?: string;
  priority?: string;
  contactId?: string;
  dealId?: string;
  assignedTo?: string;
}) {
  const { supabase, userId, tenantId } = await getUserTenant();

  const { error } = await supabase.from("tasks").insert({
    tenant_id: tenantId,
    title: input.title,
    description: input.description || null,
    due_date: input.dueDate || null,
    due_time: input.dueTime || null,
    priority: input.priority || "medium",
    status: "todo",
    contact_id: input.contactId || null,
    deal_id: input.dealId || null,
    assigned_to: input.assignedTo || null,
    created_by: userId,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/tasks");
  revalidatePath("/calendar");
}

// ---------------------------------------------------------------------------
// Update task
// ---------------------------------------------------------------------------
export async function updateTask(
  id: string,
  input: Partial<{
    title: string;
    description: string | null;
    due_date: string | null;
    due_time: string | null;
    priority: string;
    status: string;
    contact_id: string | null;
    deal_id: string | null;
    assigned_to: string | null;
  }>
) {
  const { supabase } = await getUserTenant();

  // If marking as done, set completed_at
  const updateData: Record<string, unknown> = { ...input };
  if (input.status === "done") {
    updateData.completed_at = new Date().toISOString();
  } else if (input.status && input.status !== "done") {
    updateData.completed_at = null;
  }

  const { error } = await supabase.from("tasks").update(updateData).eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/tasks");
  revalidatePath("/calendar");
}

// ---------------------------------------------------------------------------
// Delete task
// ---------------------------------------------------------------------------
export async function deleteTask(id: string) {
  const { supabase } = await getUserTenant();

  const { error } = await supabase.from("tasks").delete().eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/tasks");
  revalidatePath("/calendar");
}

// ---------------------------------------------------------------------------
// Get team members (for assignee dropdown)
// ---------------------------------------------------------------------------
export async function getTeamMembers(): Promise<TeamMember[]> {
  const { supabase } = await getUserTenant();

  const { data, error } = await supabase
    .from("users")
    .select("id, name, email, role")
    .order("name");

  if (error) throw new Error(error.message);
  return (data ?? []) as TeamMember[];
}

// ---------------------------------------------------------------------------
// Get contacts for select dropdown (lightweight)
// ---------------------------------------------------------------------------
export async function getContactsForSelect(): Promise<
  { id: string; name: string }[]
> {
  const { supabase } = await getUserTenant();

  const { data, error } = await supabase
    .from("contacts")
    .select("id, name")
    .order("name")
    .limit(200);

  if (error) throw new Error(error.message);
  return (data ?? []) as { id: string; name: string }[];
}

// ---------------------------------------------------------------------------
// Get deals for select dropdown (lightweight)
// ---------------------------------------------------------------------------
export async function getDealsForSelect(): Promise<
  { id: string; title: string }[]
> {
  const { supabase } = await getUserTenant();

  const { data, error } = await supabase
    .from("deals")
    .select("id, title")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw new Error(error.message);
  return (data ?? []) as { id: string; title: string }[];
}
