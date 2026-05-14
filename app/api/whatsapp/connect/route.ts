import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// POST /api/whatsapp/connect
// Receives auth code from Facebook Embedded Signup (CoEx flow)
// Exchanges code → access_token → fetches WABA + phone info → saves to tenant
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { success: false, error: "Missing authorization code" },
        { status: 400 }
      );
    }

    // ── Verify user is authenticated ──
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "Nao autenticado" },
        { status: 401 }
      );
    }

    const { data: dbUser } = await supabase
      .from("users")
      .select("tenant_id")
      .eq("auth_id", authUser.id)
      .single();

    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: "Usuario nao encontrado" },
        { status: 404 }
      );
    }

    // ── Step 1: Exchange code for access token ──
    const appId = process.env.META_APP_ID || "960340353406385";
    const appSecret = process.env.META_APP_SECRET;

    if (!appSecret) {
      return NextResponse.json(
        { success: false, error: "META_APP_SECRET nao configurado no servidor" },
        { status: 500 }
      );
    }

    const tokenUrl = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
    tokenUrl.searchParams.set("client_id", appId);
    tokenUrl.searchParams.set("client_secret", appSecret);
    tokenUrl.searchParams.set("code", code);

    const tokenRes = await fetch(tokenUrl.toString());
    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || tokenData.error) {
      console.error("Token exchange failed:", tokenData);
      return NextResponse.json(
        {
          success: false,
          error: tokenData.error?.message || "Falha ao trocar codigo por token",
        },
        { status: 400 }
      );
    }

    const accessToken = tokenData.access_token;

    // ── Step 2: Debug token to find shared WABA IDs ──
    const debugUrl = `https://graph.facebook.com/v21.0/debug_token?input_token=${accessToken}&access_token=${appId}|${appSecret}`;
    const debugRes = await fetch(debugUrl);
    const debugData = await debugRes.json();

    let wabaId: string | null = null;

    // Find WABA ID from granular_scopes
    if (debugData.data?.granular_scopes) {
      const waScope = debugData.data.granular_scopes.find(
        (s: { scope: string; target_ids?: string[] }) =>
          s.scope === "whatsapp_business_management"
      );
      if (waScope?.target_ids?.length) {
        wabaId = waScope.target_ids[0];
      }
    }

    if (!wabaId) {
      console.error("No WABA found in debug_token:", debugData);
      return NextResponse.json(
        {
          success: false,
          error: "Nenhuma conta WhatsApp Business encontrada na autorizacao.",
        },
        { status: 400 }
      );
    }

    // ── Step 3: Get phone numbers from the WABA ──
    const phonesRes = await fetch(
      `https://graph.facebook.com/v21.0/${wabaId}/phone_numbers?access_token=${accessToken}`
    );
    const phonesData = await phonesRes.json();

    if (!phonesData.data?.length) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Nenhum numero de telefone encontrado. Certifique-se de parear via QR Code.",
        },
        { status: 400 }
      );
    }

    const phone = phonesData.data[0];
    const phoneNumberId = phone.id;
    const displayPhoneNumber = phone.display_phone_number;
    const verifiedName = phone.verified_name;

    // ── Step 4: Subscribe our app to the WABA for webhooks ──
    await fetch(
      `https://graph.facebook.com/v21.0/${wabaId}/subscribed_apps?access_token=${accessToken}`,
      { method: "POST" }
    );

    // ── Step 5: Save to tenant ──
    const { error: updateError } = await supabase
      .from("tenants")
      .update({
        whatsapp_phone_id: phoneNumberId,
        whatsapp_token: accessToken,
        whatsapp_coex_enabled: true,
      })
      .eq("id", dbUser.tenant_id);

    if (updateError) {
      console.error("Tenant update error:", updateError);
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      phone_number_id: phoneNumberId,
      display_phone_number: displayPhoneNumber,
      verified_name: verifiedName,
      waba_id: wabaId,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal error";
    console.error("WhatsApp connect error:", error);
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
