"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  generateGmbDescricao,
  generateGmbPost,
  generateGmbReviewReply,
  type EscritorioProfile,
  type GmbPostTema,
  type GmbPostCtaType,
} from "@crm-contabil/copywriter-core";

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
  const tenantId = await getTenantId();

  // 1. Carrega post + conexão GMB do tenant
  const [postRes, connRes] = await Promise.all([
    supabase.from("gmb_posts").select("*").eq("id", id).single(),
    supabase
      .from("gmb_connections")
      .select("*")
      .eq("tenant_id", tenantId)
      .maybeSingle(),
  ]);

  const post = postRes.data;
  const conn = connRes.data;
  if (!post) throw new Error("Post não encontrado");
  if (!conn || !conn.google_account_id || !conn.google_location_id) {
    throw new Error(
      "Perfil GMB não conectado ao Google. Conecte em /gmb/connect antes de publicar."
    );
  }

  // 2. Importa wrapper e chama API real
  const { createLocalPost, GmbApiError } = await import("@/lib/google/gmb");
  const { getValidToken } = await import("@/lib/google/tokens");

  // Reaproveita conexão do Google Calendar (mesmo OAuth/refresh token)
  const { data: googleConn } = await supabase
    .from("google_calendar_connections")
    .select("*")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (!googleConn) {
    throw new Error("Google não conectado. Vá em Configurações → Conectar Google.");
  }

  const accessToken = await getValidToken(googleConn);

  // CTA mapping
  const ctaActionTypeMap: Record<string, string> = {
    learn_more: "LEARN_MORE",
    book: "BOOK",
    call: "CALL",
    sign_up: "SIGN_UP",
    none: "",
  };

  const ctaActionType = ctaActionTypeMap[post.cta_type as string] || "";

  try {
    const created = await createLocalPost(
      accessToken,
      conn.google_account_id,
      conn.google_location_id,
      {
        languageCode: "pt-BR",
        summary: post.content,
        callToAction: ctaActionType
          ? { actionType: ctaActionType, url: post.cta_url || undefined }
          : undefined,
        topicType: "STANDARD",
      }
    );

    await supabase
      .from("gmb_posts")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
        google_post_id: created.name,
      })
      .eq("id", id);
  } catch (err) {
    // Marca como failed e propaga mensagem amigável
    await supabase.from("gmb_posts").update({ status: "failed" }).eq("id", id);

    if (err instanceof GmbApiError) {
      if (err.status === 403) {
        throw new Error(
          "Acesso à API do Google Business Profile não aprovado. Solicite acesso em https://support.google.com/business/contact/api_default."
        );
      }
      throw new Error(`Erro Google (${err.status}): ${err.message}`);
    }
    throw err;
  }

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

export async function replyToReview(
  id: string,
  reply: string,
  repliedBy: "ai" | "manual" = "manual"
) {
  const supabase = await createClient();
  const tenantId = await getTenantId();

  // 1. Carrega review + conexão
  const [reviewRes, connRes] = await Promise.all([
    supabase.from("gmb_reviews").select("*").eq("id", id).single(),
    supabase
      .from("gmb_connections")
      .select("google_account_id, google_location_id")
      .eq("tenant_id", tenantId)
      .maybeSingle(),
  ]);

  const review = reviewRes.data;
  const conn = connRes.data;
  if (!review) throw new Error("Avaliação não encontrada");

  // 2. Se conectado ao Google, posta a resposta de verdade
  if (conn?.google_account_id && conn?.google_location_id && review.google_review_id) {
    try {
      const { replyToGoogleReview, GmbApiError } = await import("@/lib/google/gmb");
      const { getValidToken } = await import("@/lib/google/tokens");

      const { data: googleConn } = await supabase
        .from("google_calendar_connections")
        .select("*")
        .eq("tenant_id", tenantId)
        .maybeSingle();

      if (googleConn) {
        const accessToken = await getValidToken(googleConn);
        await replyToGoogleReview(
          accessToken,
          conn.google_account_id,
          conn.google_location_id,
          review.google_review_id,
          reply
        );
      }
    } catch (err) {
      const { GmbApiError } = await import("@/lib/google/gmb");
      if (err instanceof GmbApiError && err.status === 403) {
        throw new Error(
          "Acesso à API Reviews não aprovado pelo Google. A resposta foi salva, mas não publicada."
        );
      }
      throw err;
    }
  }

  // 3. Atualiza DB
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

  await supabase.from("gmb_optimization_log").insert({
    tenant_id: tenantId,
    action: "review_replied",
    details: { review_id: id, replied_by: repliedBy, posted_to_google: !!conn?.google_account_id },
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
// IA REAL — usa o copywriter-core para gerar com voz especializada
// em contabilidade (nichos, frameworks, anti-clichês).
// ---------------------------------------------------------------------------

/**
 * Constrói um EscritorioProfile mínimo a partir dos dados disponíveis
 * no tenant + gmb_connection. Campos em branco recebem placeholders
 * inteligentes para que o LLM tenha contexto suficiente.
 */
async function buildProfileFromTenant(): Promise<EscritorioProfile> {
  const supabase = await createClient();
  const tenantId = await getTenantId();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("name, settings")
    .eq("id", tenantId)
    .single();

  const { data: gmb } = await supabase
    .from("gmb_connections")
    .select("*")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  const nome = (gmb?.office_name_gmb || tenant?.name || "Escritório").toString();
  const settings = (tenant?.settings || {}) as Record<string, unknown>;
  const cidade = (settings.cidade as string) || "sua cidade";
  const estado = (settings.estado_atuacao as string) || "BR";

  // Mapeia post_tone (formal/friendly/casual) → tomDeVoz do copywriter-core
  const tomMap: Record<string, EscritorioProfile["tomDeVoz"]> = {
    formal: "formal-consultivo",
    friendly: "proximo-direto",
    casual: "informal-tecnologico",
  };
  const tomDeVoz =
    tomMap[(gmb?.post_tone as string) || "friendly"] || "proximo-direto";

  return {
    nome,
    cidade,
    atendeRemoto: false,
    estadoAtuacao: estado,
    crcUf: estado,
    crcNumero: "—",
    anosMercado: 0,
    faixaClientes: "1-50",
    nichos: [],
    servicos: ["contabil", "fiscal", "folha"],
    modeloPreco: "sob-consulta",
    diferenciais: [
      "Atendimento próximo e direto",
      "Resposta rápida a dúvidas fiscais",
      "Plataforma digital",
    ],
    persona:
      "Empresário(a) que busca um contador parceiro, com atendimento próximo e domínio do regime tributário ideal para o seu porte.",
    doresPrincipais: [
      "Empresa pagando imposto a mais por estar no regime tributário errado",
      "Contador atual demora dias para responder",
      "Falta de orientação sobre prazos fiscais que geram multa",
    ],
    cases: [],
    tomDeVoz,
    ctaPrimario: "diagnostico-gratuito",
  };
}

/**
 * Gera conteúdo via copywriter-core para o GMB.
 * Substitui a função antiga "mockada" que retornava texto genérico.
 */
export async function generateAiContent(
  type: "description" | "post" | "review_reply",
  context?: {
    officeName?: string;
    rating?: number;
    reviewComment?: string;
    reviewerName?: string;
    category?: string;
    tema?: GmbPostTema;
    ctaType?: GmbPostCtaType;
    ctaUrl?: string;
  }
): Promise<string> {
  const profile = await buildProfileFromTenant();

  // Sobrescreve nome se vier no contexto (vindo da UI no momento da geração)
  if (context?.officeName) profile.nome = context.officeName;

  if (type === "description") {
    const result = await generateGmbDescricao(profile, { maxChars: 750 });
    if (result.output.tipo !== "gmb-descricao") return "";
    return result.output.conteudo.descricao;
  }

  if (type === "post") {
    const result = await generateGmbPost(profile, {
      tema: context?.tema || "educativo",
      ctaType: context?.ctaType,
      ctaUrl: context?.ctaUrl,
    });
    if (result.output.tipo !== "gmb-post") return "";
    return result.output.conteudo.conteudo;
  }

  if (type === "review_reply") {
    const rating = context?.rating ?? 5;
    const result = await generateGmbReviewReply(profile, {
      rating,
      comentario: context?.reviewComment || "",
      nomeAvaliador: context?.reviewerName || "Cliente",
    });
    if (result.output.tipo !== "gmb-review-reply") return "";
    return result.output.conteudo.resposta;
  }

  return "";
}

// ---------------------------------------------------------------------------
// Geração completa (com metadados — para a UI usar)
// ---------------------------------------------------------------------------

export async function generateGmbDescricaoFull() {
  const profile = await buildProfileFromTenant();
  const result = await generateGmbDescricao(profile, { maxChars: 750 });
  if (result.output.tipo !== "gmb-descricao") {
    throw new Error("Erro inesperado na geração de descrição");
  }
  return result.output.conteudo;
}

export async function generateGmbPostFull(tema: GmbPostTema, ctaType?: GmbPostCtaType, ctaUrl?: string) {
  const profile = await buildProfileFromTenant();
  const result = await generateGmbPost(profile, { tema, ctaType, ctaUrl });
  if (result.output.tipo !== "gmb-post") {
    throw new Error("Erro inesperado na geração de post");
  }
  return result.output.conteudo;
}

export async function generateGmbReviewReplyFull(reviewId: string) {
  const supabase = await createClient();
  const { data: review } = await supabase
    .from("gmb_reviews")
    .select("rating, comment, reviewer_name")
    .eq("id", reviewId)
    .single();

  if (!review) throw new Error("Avaliação não encontrada");

  const profile = await buildProfileFromTenant();
  const result = await generateGmbReviewReply(profile, {
    rating: review.rating,
    comentario: review.comment || "",
    nomeAvaliador: review.reviewer_name,
  });
  if (result.output.tipo !== "gmb-review-reply") {
    throw new Error("Erro inesperado na geração de resposta");
  }
  return result.output.conteudo;
}
