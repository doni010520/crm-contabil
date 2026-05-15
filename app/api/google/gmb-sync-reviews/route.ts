// ---------------------------------------------------------------------------
// POST /api/google/gmb-sync-reviews
// ---------------------------------------------------------------------------
// Importa avaliações novas do Google Business Profile para gmb_reviews.
// Pode ser chamado pelo usuário (botão "Sincronizar") ou por cron job.
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { listReviews, starRatingToNumber, GmbApiError } from "@/lib/google/gmb";
import { getValidToken } from "@/lib/google/tokens";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  const { data: dbUser } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("auth_id", user.id)
    .single();
  if (!dbUser) {
    return NextResponse.json({ error: "Tenant nao encontrado" }, { status: 404 });
  }

  const tenantId = dbUser.tenant_id;

  // Carrega conexões
  const [gmbConnRes, googleConnRes] = await Promise.all([
    supabase
      .from("gmb_connections")
      .select("google_account_id, google_location_id")
      .eq("tenant_id", tenantId)
      .maybeSingle(),
    supabase
      .from("google_calendar_connections")
      .select("*")
      .eq("tenant_id", tenantId)
      .maybeSingle(),
  ]);

  if (!gmbConnRes.data?.google_account_id || !gmbConnRes.data?.google_location_id) {
    return NextResponse.json(
      { error: "Perfil GMB não conectado ao Google" },
      { status: 400 }
    );
  }
  if (!googleConnRes.data) {
    return NextResponse.json(
      { error: "Google não conectado. Conecte em Configurações." },
      { status: 400 }
    );
  }

  try {
    const accessToken = await getValidToken(googleConnRes.data);
    const reviews = await listReviews(
      accessToken,
      gmbConnRes.data.google_account_id,
      gmbConnRes.data.google_location_id
    );

    // Upsert por google_review_id usando service_role (bypassa RLS para gravação em massa)
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let imported = 0;
    let updated = 0;

    for (const r of reviews) {
      const row = {
        tenant_id: tenantId,
        google_review_id: r.reviewId,
        reviewer_name: r.reviewer.displayName,
        rating: starRatingToNumber(r.starRating),
        comment: r.comment || null,
        review_date: r.createTime,
        reply: r.reviewReply?.comment || null,
        reply_status: r.reviewReply ? "replied" : "pending",
        replied_at: r.reviewReply?.updateTime || null,
      };

      const { data: existing } = await admin
        .from("gmb_reviews")
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("google_review_id", r.reviewId)
        .maybeSingle();

      if (existing) {
        await admin.from("gmb_reviews").update(row).eq("id", existing.id);
        updated++;
      } else {
        await admin.from("gmb_reviews").insert(row);
        imported++;
      }
    }

    return NextResponse.json({
      ok: true,
      imported,
      updated,
      total: reviews.length,
    });
  } catch (err) {
    if (err instanceof GmbApiError) {
      if (err.status === 403) {
        return NextResponse.json(
          {
            error:
              "Acesso à API Google Reviews não aprovado. Solicite em https://support.google.com/business/contact/api_default.",
          },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { error: `Erro Google (${err.status}): ${err.message}` },
        { status: err.status }
      );
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro desconhecido" },
      { status: 500 }
    );
  }
}
