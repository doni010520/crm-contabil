import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
    return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 404 });
  }

  // Get connection to revoke token
  const { data: conn } = await supabase
    .from("google_calendar_connections")
    .select("access_token")
    .eq("tenant_id", dbUser.tenant_id)
    .maybeSingle();

  if (conn?.access_token) {
    // Try to revoke token (best effort)
    try {
      await fetch(
        `https://oauth2.googleapis.com/revoke?token=${conn.access_token}`,
        { method: "POST" }
      );
    } catch {
      // Ignore revoke errors
    }
  }

  // Delete connection
  await supabase
    .from("google_calendar_connections")
    .delete()
    .eq("tenant_id", dbUser.tenant_id);

  // Clean up cached events
  await supabase
    .from("calendar_events")
    .delete()
    .eq("tenant_id", dbUser.tenant_id);

  return NextResponse.json({ success: true });
}
