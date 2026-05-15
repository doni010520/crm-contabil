// ---------------------------------------------------------------------------
// Google token management — refresh + DB update
// ---------------------------------------------------------------------------

import { createClient } from "@supabase/supabase-js";
import { refreshAccessToken } from "./calendar";

export interface GoogleConnection {
  id: string;
  tenant_id: string;
  google_email: string;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
  calendar_id: string;
  timezone: string;
  sync_token: string | null;
}

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Returns a valid access token, refreshing if needed.
 * Updates the DB row when a refresh occurs.
 */
export async function getValidToken(conn: GoogleConnection): Promise<string> {
  const expiresAt = new Date(conn.token_expires_at);
  const now = new Date();

  // If token expires in more than 5 minutes, it's still valid
  if (expiresAt.getTime() - now.getTime() > 5 * 60 * 1000) {
    return conn.access_token;
  }

  // Refresh the token
  const tokens = await refreshAccessToken(conn.refresh_token);

  const newExpiresAt = new Date(
    Date.now() + tokens.expires_in * 1000
  ).toISOString();

  // Update DB
  const supabase = getAdminClient();
  await supabase
    .from("google_calendar_connections")
    .update({
      access_token: tokens.access_token,
      token_expires_at: newExpiresAt,
    })
    .eq("id", conn.id);

  return tokens.access_token;
}

/**
 * Fetch the Google Calendar connection for a tenant (using service role).
 */
export async function getConnectionForTenant(
  tenantId: string
): Promise<GoogleConnection | null> {
  const supabase = getAdminClient();

  const { data } = await supabase
    .from("google_calendar_connections")
    .select("*")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  return data as GoogleConnection | null;
}
