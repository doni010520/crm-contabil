import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// GET /api/whatsapp/status
// Returns current WhatsApp connection status for the tenant
// ---------------------------------------------------------------------------
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ connected: false }, { status: 401 });
    }

    const { data: dbUser } = await supabase
      .from("users")
      .select("tenant_id")
      .eq("auth_id", authUser.id)
      .single();

    if (!dbUser) {
      return NextResponse.json({ connected: false }, { status: 404 });
    }

    const { data: tenant } = await supabase
      .from("tenants")
      .select("whatsapp_phone_id, whatsapp_token, whatsapp_coex_enabled")
      .eq("id", dbUser.tenant_id)
      .single();

    if (!tenant?.whatsapp_phone_id || !tenant?.whatsapp_token) {
      return NextResponse.json({ connected: false });
    }

    // Verify the token is still valid by calling the API
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${tenant.whatsapp_phone_id}?fields=verified_name,display_phone_number,quality_rating&access_token=${tenant.whatsapp_token}`
    );
    const data = await res.json();

    if (!res.ok || data.error) {
      return NextResponse.json({
        connected: false,
        error: data.error?.message || "Token invalid",
        token_expired: true,
      });
    }

    return NextResponse.json({
      connected: true,
      phone_number_id: tenant.whatsapp_phone_id,
      display_phone_number: data.display_phone_number,
      verified_name: data.verified_name,
      quality_rating: data.quality_rating,
      coex_enabled: tenant.whatsapp_coex_enabled,
    });
  } catch (error: any) {
    return NextResponse.json(
      { connected: false, error: error.message },
      { status: 500 }
    );
  }
}
