// ---------------------------------------------------------------------------
// GET/POST /api/cron/gmb-publish
// ---------------------------------------------------------------------------
// Publica posts do GMB com status='scheduled' e scheduled_for <= NOW().
// Roda via cron externo (n8n, Easypanel cron, ou pg_cron chamando este URL).
// Autenticado via CRON_SECRET no header "Authorization: Bearer <token>".
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createLocalPost, GmbApiError } from "@/lib/google/gmb";
import { getValidToken } from "@/lib/google/tokens";

interface ScheduledPost {
  id: string;
  tenant_id: string;
  content: string;
  cta_type: string;
  cta_url: string | null;
  scheduled_for: string;
}

interface GmbConn {
  tenant_id: string;
  google_account_id: string | null;
  google_location_id: string | null;
}

const CTA_MAP: Record<string, string> = {
  learn_more: "LEARN_MORE",
  book: "BOOK",
  call: "CALL",
  sign_up: "SIGN_UP",
  none: "",
};

async function handler(req: NextRequest) {
  // Auth via bearer token
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Busca posts vencidos
  const now = new Date().toISOString();
  const { data: posts, error } = await admin
    .from("gmb_posts")
    .select("id, tenant_id, content, cta_type, cta_url, scheduled_for")
    .eq("status", "scheduled")
    .lte("scheduled_for", now)
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results: Array<{ id: string; status: "published" | "failed"; error?: string }> = [];

  for (const post of (posts || []) as ScheduledPost[]) {
    try {
      // Carrega conexão do tenant
      const { data: gmbConn } = await admin
        .from("gmb_connections")
        .select("tenant_id, google_account_id, google_location_id")
        .eq("tenant_id", post.tenant_id)
        .maybeSingle<GmbConn>();

      if (!gmbConn?.google_account_id || !gmbConn?.google_location_id) {
        await admin
          .from("gmb_posts")
          .update({ status: "failed" })
          .eq("id", post.id);
        results.push({ id: post.id, status: "failed", error: "no_gmb_connection" });
        continue;
      }

      const { data: googleConn } = await admin
        .from("google_calendar_connections")
        .select("*")
        .eq("tenant_id", post.tenant_id)
        .maybeSingle();

      if (!googleConn) {
        await admin
          .from("gmb_posts")
          .update({ status: "failed" })
          .eq("id", post.id);
        results.push({ id: post.id, status: "failed", error: "no_google_token" });
        continue;
      }

      const accessToken = await getValidToken(googleConn);

      const ctaActionType = CTA_MAP[post.cta_type] || "";

      const created = await createLocalPost(
        accessToken,
        gmbConn.google_account_id,
        gmbConn.google_location_id,
        {
          languageCode: "pt-BR",
          summary: post.content,
          callToAction: ctaActionType
            ? { actionType: ctaActionType, url: post.cta_url || undefined }
            : undefined,
          topicType: "STANDARD",
        }
      );

      await admin
        .from("gmb_posts")
        .update({
          status: "published",
          published_at: new Date().toISOString(),
          google_post_id: created.name,
        })
        .eq("id", post.id);

      await admin.from("gmb_optimization_log").insert({
        tenant_id: post.tenant_id,
        action: "posts_scheduled",
        details: { post_id: post.id, published_by: "cron" },
      });

      results.push({ id: post.id, status: "published" });
    } catch (err) {
      await admin.from("gmb_posts").update({ status: "failed" }).eq("id", post.id);
      const msg =
        err instanceof GmbApiError
          ? `${err.status}: ${err.message}`
          : err instanceof Error
            ? err.message
            : "unknown";
      results.push({ id: post.id, status: "failed", error: msg });
    }
  }

  return NextResponse.json({
    ok: true,
    processed: results.length,
    published: results.filter((r) => r.status === "published").length,
    failed: results.filter((r) => r.status === "failed").length,
    results,
  });
}

export async function GET(req: NextRequest) {
  return handler(req);
}

export async function POST(req: NextRequest) {
  return handler(req);
}
