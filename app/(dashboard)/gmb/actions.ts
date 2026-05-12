"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function getTenantId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const { data } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("auth_id", user.id)
    .single();

  if (!data) throw new Error("Tenant não encontrado");
  return data.tenant_id as string;
}

// ---------------------------------------------------------------------------
// Connection
// ---------------------------------------------------------------------------
export async function getGmbConnection() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("gmb_connections")
    .select("*")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function getGmbDashboard() {
  const supabase = await createClient();

  const [connectionRes, postsRes, reviewsRes, logRes] = await Promise.all([
    supabase.from("gmb_connections").select("*").maybeSingle(),
    supabase
      .from("gmb_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("gmb_reviews")
      .select("*")
      .order("review_date", { ascending: false })
      .limit(3),
    supabase
      .from("gmb_optimization_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  // Post stats for this month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const postsThisMonth =
    postsRes.data?.filter(
      (p) =>
        p.status === "published" &&
        p.published_at &&
        p.published_at >= startOfMonth
    ).length ?? 0;

  const allReviews = reviewsRes.data ?? [];
  const avgRating =
    allReviews.length > 0
      ? allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length
      : 0;

  const nextScheduled =
    postsRes.data?.find((p) => p.status === "scheduled") ?? null;

  return {
    connection: connectionRes.data,
    posts: postsRes.data ?? [],
    reviews: allReviews,
    log: logRes.data ?? [],
    stats: {
      postsThisMonth,
      totalReviews: allReviews.length,
      avgRating: Math.round(avgRating * 10) / 10,
      profileScore: connectionRes.data?.profile_score ?? 0,
    },
    nextScheduled,
  };
}

export async function saveGmbConnection(data: {
  office_name_gmb: string;
  description?: string;
  primary_category?: string;
  secondary_categories?: string[];
  services?: unknown[];
  google_account_id?: string;
  google_location_id?: string;
  verification_status?: string;
  is_new_profile?: boolean;
  auto_posts_enabled?: boolean;
  auto_reviews_enabled?: boolean;
  post_frequency?: string;
  post_tone?: string;
}) {
  const supabase = await createClient();
  const tenantId = await getTenantId();

  // Check if connection exists
  const existing = await getGmbConnection();

  if (existing) {
    const { error } = await supabase
      .from("gmb_connections")
      .update({ ...data, last_synced_at: new Date().toISOString() })
      .eq("id", existing.id);

    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("gmb_connections").insert({
      tenant_id: tenantId,
      ...data,
      last_synced_at: new Date().toISOString(),
    });

    if (error) throw new Error(error.message);

    // Set tenant gmb_connected = true
    await supabase
      .from("tenants")
      .update({ gmb_connected: true })
      .eq("id", tenantId);
  }

  revalidatePath("/gmb");
}

export async function disconnectGmb() {
  const supabase = await createClient();
  const tenantId = await getTenantId();

  const { error } = await supabase
    .from("gmb_connections")
    .delete()
    .eq("tenant_id", tenantId);

  if (error) throw new Error(error.message);

  await supabase
    .from("tenants")
    .update({ gmb_connected: false })
    .eq("id", tenantId);

  revalidatePath("/gmb");
}

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------
export async function getGmbPosts(status?: string) {
  const supabase = await createClient();

  let query = supabase
    .from("gmb_posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createGmbPost(formData: {
  content: string;
  cta_type?: string;
  cta_url?: string;
  status?: string;
  scheduled_for?: string;
  generated_by_ai?: boolean;
}) {
  const supabase = await createClient();
  const tenantId = await getTenantId();

  const { error } = await supabase.from("gmb_posts").insert({
    tenant_id: tenantId,
    content: formData.content,
    cta_type: formData.cta_type || "none",
    cta_url: formData.cta_url || null,
    status: formData.status || "draft",
    scheduled_for: formData.scheduled_for || null,
    generated_by_ai: formData.generated_by_ai ?? true,
  });

  if (error) throw new Error(error.message);

  // Log if scheduled
  if (formData.status === "scheduled") {
    await supabase.from("gmb_optimization_log").insert({
      tenant_id: tenantId,
      action: "posts_scheduled",
      details: { content_preview: formData.content.slice(0, 100) },
    });
  }

  revalidatePath("/gmb/posts");
  revalidatePath("/gmb");
}

export async function updateGmbPost(
  id: string,
  formData: {
    content?: string;
    cta_type?: string;
    cta_url?: string;
    status?: string;
    scheduled_for?: string;
  }
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("gmb_posts")
    .update(formData)
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/gmb/posts");
  revalidatePath("/gmb");
}

export async function deleteGmbPost(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("gmb_posts").delete().eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/gmb/posts");
  revalidatePath("/gmb");
}

export async function publishGmbPost(id: string) {
  const supabase = await createClient();

  // TODO: In production, call Google My Business API to publish the post
  // POST https://mybusiness.googleapis.com/v4/accounts/{accountId}/locations/{locationId}/localPosts

  const { error } = await supabase
    .from("gmb_posts")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/gmb/posts");
  revalidatePath("/gmb");
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------
export async function getGmbReviews(filter?: string) {
  const supabase = await createClient();

  let query = supabase
    .from("gmb_reviews")
    .select("*")
    .order("review_date", { ascending: false });

  if (filter === "positive") {
    query = query.gte("rating", 4);
  } else if (filter === "negative") {
    query = query.lte("rating", 3);
  } else if (filter === "pending") {
    query = query.eq("reply_status", "pending");
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function replyToReview(id: string, reply: string, repliedBy: "ai" | "manual" = "manual") {
  const supabase = await createClient();
  const tenantId = await getTenantId();

  // TODO: In production, call Google My Business API to post the reply
  // PUT https://mybusiness.googleapis.com/v4/accounts/{accountId}/locations/{locationId}/reviews/{reviewId}/reply

  const { error } = await supabase
    .from("gmb_reviews")
    .update({
      reply,
      reply_status: "replied",
      replied_at: new Date().toISOString(),
      replied_by: repliedBy,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  // Log the action
  await supabase.from("gmb_optimization_log").insert({
    tenant_id: tenantId,
    action: "review_replied",
    details: { review_id: id, replied_by: repliedBy },
  });

  revalidatePath("/gmb/reviews");
  revalidatePath("/gmb");
}

// ---------------------------------------------------------------------------
// Optimization Log
// ---------------------------------------------------------------------------
export async function getOptimizationLog() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("gmb_optimization_log")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

// ---------------------------------------------------------------------------
// Profile Score
// ---------------------------------------------------------------------------
export async function updateProfileScore(connectionId: string) {
  const supabase = await createClient();

  const { data: conn } = await supabase
    .from("gmb_connections")
    .select("*")
    .eq("id", connectionId)
    .single();

  if (!conn) return 0;

  let score = 0;
  if (conn.office_name_gmb) score += 15;
  if (conn.description && conn.description.length > 50) score += 20;
  if (conn.primary_category) score += 15;
  if (conn.secondary_categories && conn.secondary_categories.length > 0) score += 10;
  if (conn.services && (conn.services as unknown[]).length > 0) score += 15;
  if (conn.verification_status === "verified") score += 15;
  // Check if has recent posts
  const { count } = await supabase
    .from("gmb_posts")
    .select("id", { count: "exact", head: true })
    .eq("status", "published");
  if (count && count > 0) score += 10;

  await supabase
    .from("gmb_connections")
    .update({ profile_score: score })
    .eq("id", connectionId);

  revalidatePath("/gmb");
  return score;
}

// ---------------------------------------------------------------------------
// AI Content Generation (Mock)
// ---------------------------------------------------------------------------
// TODO: Replace with actual GPT-4.1-mini API call in production
// POST https://api.openai.com/v1/chat/completions with model "gpt-4.1-mini"
export async function generateAiContent(
  type: "description" | "post" | "review_reply",
  context?: { officeName?: string; rating?: number; reviewComment?: string; category?: string }
): Promise<string> {
  // Simulate a small delay to feel realistic
  await new Promise((resolve) => setTimeout(resolve, 800));

  const officeName = context?.officeName || "Escritório Contábil";

  if (type === "description") {
    return `${officeName} é referência em serviços contábeis, fiscais e de departamento pessoal. Com mais de 10 anos de experiência, oferecemos soluções personalizadas para empresas de todos os portes. Nossa equipe qualificada utiliza tecnologia de ponta para garantir conformidade fiscal, redução de custos e orientação estratégica para o crescimento do seu negócio. Atendemos MEI, Simples Nacional, Lucro Presumido e Lucro Real com excelência e dedicação.`;
  }

  if (type === "post") {
    const posts = [
      `Sabia que a organização financeira é o primeiro passo para o crescimento do seu negócio? No ${officeName}, ajudamos empresas a manterem suas obrigações em dia e a identificarem oportunidades de economia fiscal. Entre em contato e descubra como podemos ajudar a sua empresa a crescer!`,
      `Empresário, você está preparado para as mudanças fiscais de 2025? Nossa equipe está pronta para orientar sua empresa nas novas regulamentações. Agende uma consulta gratuita no ${officeName} e fique tranquilo com suas obrigações contábeis.`,
      `No ${officeName}, acreditamos que contabilidade vai além dos números. Somos parceiros estratégicos do seu negócio, oferecendo orientação fiscal, planejamento tributário e suporte completo em departamento pessoal. Venha nos conhecer!`,
    ];
    return posts[Math.floor(Math.random() * posts.length)];
  }

  if (type === "review_reply") {
    const rating = context?.rating ?? 5;
    const reviewer = context?.reviewComment ? "o comentário" : "a avaliação";

    if (rating >= 4) {
      return `Muito obrigado pela avaliação! Ficamos felizes em saber que nosso atendimento atendeu suas expectativas. No ${officeName}, trabalhamos com dedicação para oferecer o melhor serviço contábil. Estamos à disposição para continuar ajudando o seu negócio!`;
    } else {
      return `Agradecemos por compartilhar ${reviewer}. Sentimos muito que sua experiência não tenha sido a ideal. Gostaríamos de entender melhor o que aconteceu para podermos melhorar. Por favor, entre em contato conosco diretamente para que possamos resolver essa situação da melhor forma.`;
    }
  }

  return "";
}
