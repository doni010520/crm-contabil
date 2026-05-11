"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface TenantSettings {
  id: string;
  name: string;
  slug: string;
  cnpj: string | null;
  plan: string;
  whatsapp_phone_id: string | null;
  whatsapp_token: string | null;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url: string | null;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Get current user + tenant
// ---------------------------------------------------------------------------
export async function getTenantSettings(): Promise<{
  tenant: TenantSettings;
  user: UserProfile;
}> {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    throw new Error("Nao autenticado.");
  }

  const { data: dbUser, error: userError } = await supabase
    .from("users")
    .select("id, tenant_id, name, email, role, avatar_url")
    .eq("auth_id", authUser.id)
    .single();

  if (userError || !dbUser) {
    throw new Error("Usuario nao encontrado.");
  }

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id, name, slug, cnpj, plan, whatsapp_phone_id, whatsapp_token")
    .eq("id", dbUser.tenant_id)
    .single();

  if (tenantError || !tenant) {
    throw new Error("Escritorio nao encontrado.");
  }

  return {
    tenant: tenant as TenantSettings,
    user: {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      avatar_url: dbUser.avatar_url,
    },
  };
}

// ---------------------------------------------------------------------------
// Update tenant settings
// ---------------------------------------------------------------------------
export async function updateTenantSettings(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    throw new Error("Nao autenticado.");
  }

  const { data: dbUser } = await supabase
    .from("users")
    .select("tenant_id, role")
    .eq("auth_id", authUser.id)
    .single();

  if (!dbUser) {
    throw new Error("Usuario nao encontrado.");
  }

  const name = formData.get("name") as string;
  const cnpj = formData.get("cnpj") as string;

  const { error } = await supabase
    .from("tenants")
    .update({
      name: name || null,
      cnpj: cnpj || null,
    })
    .eq("id", dbUser.tenant_id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/settings");
}

// ---------------------------------------------------------------------------
// Update user profile
// ---------------------------------------------------------------------------
export async function updateUserProfile(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    throw new Error("Nao autenticado.");
  }

  const { data: dbUser } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", authUser.id)
    .single();

  if (!dbUser) {
    throw new Error("Usuario nao encontrado.");
  }

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;

  const { error } = await supabase
    .from("users")
    .update({
      name: name || null,
      email: email || null,
    })
    .eq("id", dbUser.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/settings");
}

// ---------------------------------------------------------------------------
// Update WhatsApp settings
// ---------------------------------------------------------------------------
export async function updateWhatsAppSettings(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    throw new Error("Nao autenticado.");
  }

  const { data: dbUser } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("auth_id", authUser.id)
    .single();

  if (!dbUser) {
    throw new Error("Usuario nao encontrado.");
  }

  const whatsapp_phone_id = formData.get("whatsapp_phone_id") as string;
  const whatsapp_token = formData.get("whatsapp_token") as string;

  const { error } = await supabase
    .from("tenants")
    .update({
      whatsapp_phone_id: whatsapp_phone_id || null,
      whatsapp_token: whatsapp_token || null,
    })
    .eq("id", dbUser.tenant_id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/settings");
}

// ---------------------------------------------------------------------------
// Get team members
// ---------------------------------------------------------------------------
export async function getTeamMembers(): Promise<TeamMember[]> {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    throw new Error("Nao autenticado.");
  }

  const { data: dbUser } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("auth_id", authUser.id)
    .single();

  if (!dbUser) {
    throw new Error("Usuario nao encontrado.");
  }

  const { data, error } = await supabase
    .from("users")
    .select("id, name, email, role, avatar_url, created_at")
    .eq("tenant_id", dbUser.tenant_id)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as TeamMember[];
}

// ---------------------------------------------------------------------------
// Invite team member (simplified: insert into users table)
// ---------------------------------------------------------------------------
export async function inviteTeamMember(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    throw new Error("Nao autenticado.");
  }

  const { data: dbUser } = await supabase
    .from("users")
    .select("tenant_id, role")
    .eq("auth_id", authUser.id)
    .single();

  if (!dbUser) {
    throw new Error("Usuario nao encontrado.");
  }

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const role = (formData.get("role") as string) || "user";

  if (!name || !email) {
    throw new Error("Nome e e-mail sao obrigatorios.");
  }

  const { error } = await supabase.from("users").insert({
    tenant_id: dbUser.tenant_id,
    name,
    email,
    role,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/settings");
}
