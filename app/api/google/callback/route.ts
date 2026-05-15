import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import {
  exchangeCodeForTokens,
  getGoogleUserEmail,
} from "@/lib/google/calendar";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  if (error) {
    return NextResponse.redirect(
      `${appUrl}/settings?tab=integracoes&google=error&reason=${error}`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${appUrl}/settings?tab=integracoes&google=error&reason=missing_params`
    );
  }

  try {
    // Decode state
    const stateData = JSON.parse(
      Buffer.from(state, "base64url").toString("utf-8")
    );
    const tenantId = stateData.tenantId;

    if (!tenantId) {
      throw new Error("Invalid state: no tenantId");
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    if (!tokens.refresh_token) {
      throw new Error("No refresh token received. Try disconnecting and reconnecting.");
    }

    // Get user email
    const googleEmail = await getGoogleUserEmail(tokens.access_token);

    // Calculate expiry
    const tokenExpiresAt = new Date(
      Date.now() + tokens.expires_in * 1000
    ).toISOString();

    // Upsert connection
    const supabase = getAdminClient();

    const { error: dbError } = await supabase
      .from("google_calendar_connections")
      .upsert(
        {
          tenant_id: tenantId,
          google_email: googleEmail,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: tokenExpiresAt,
          calendar_id: "primary",
          timezone: "America/Sao_Paulo",
        },
        { onConflict: "tenant_id" }
      );

    if (dbError) {
      throw new Error(`DB error: ${dbError.message}`);
    }

    return NextResponse.redirect(
      `${appUrl}/settings?tab=integracoes&google=connected`
    );
  } catch (err) {
    console.error("[Google Callback] Error:", err);
    return NextResponse.redirect(
      `${appUrl}/settings?tab=integracoes&google=error&reason=exchange_failed`
    );
  }
}
