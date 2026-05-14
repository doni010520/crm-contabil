import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// POST /api/whatsapp/connect
// Receives auth code or access token from Facebook Embedded Signup
// Exchanges for long-lived token, fetches WABA + phone info, saves to tenant
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, accessToken } = body;

    if (!code && !accessToken) {
      return NextResponse.json(
        { success: false, error: "Missing code or accessToken" },
        { status: 400 }
      );
    }

    // Get current user's tenant
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

    let userAccessToken = accessToken;

    // If we received a code, exchange it for an access token
    if (code) {
      const appId = process.env.META_APP_ID || "960340353406385";
      const appSecret = process.env.META_APP_SECRET;

      if (!appSecret) {
        return NextResponse.json(
          { success: false, error: "META_APP_SECRET not configured on server" },
          { status: 500 }
        );
      }

      const tokenRes = await fetch(
        `https://graph.facebook.com/v21.0/oauth/access_token?` +
          `client_id=${appId}&client_secret=${appSecret}&code=${code}`
      );
      const tokenData = await tokenRes.json();

      if (!tokenRes.ok || tokenData.error) {
        return NextResponse.json(
          {
            success: false,
            error: tokenData.error?.message || "Failed to exchange code",
          },
          { status: 400 }
        );
      }

      userAccessToken = tokenData.access_token;
    }

    // Get the WABA (WhatsApp Business Account) shared with the app
    const wabaRes = await fetch(
      `https://graph.facebook.com/v21.0/debug_token?input_token=${userAccessToken}&access_token=${userAccessToken}`
    );
    const wabaData = await wabaRes.json();

    // Fetch the user's WhatsApp Business Accounts
    const sharedWabaRes = await fetch(
      `https://graph.facebook.com/v21.0/me/businesses?fields=id,name&access_token=${userAccessToken}`
    );

    // Try to get the WABA directly from the token's granular scopes
    // or fetch phone numbers linked to the WABA
    const wabaListRes = await fetch(
      `https://graph.facebook.com/v21.0/me?fields=id,name&access_token=${userAccessToken}`
    );

    // Get WABA ID from the embedded signup session
    // The embedded signup provides WABA ID in the response
    // Let's try getting phone numbers from the business
    const businessRes = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?fields=whatsapp_business_account&access_token=${userAccessToken}`
    );

    // The safest approach: use the token to list WABAs the user has access to
    const wabaAccountsRes = await fetch(
      `https://graph.facebook.com/v21.0/me?fields=businesses{owned_whatsapp_business_accounts{id,name,phone_numbers{id,display_phone_number,verified_name}}}&access_token=${userAccessToken}`
    );
    const wabaAccountsData = await wabaAccountsRes.json();

    // Extract phone number info
    let phoneNumberId: string | null = null;
    let displayPhoneNumber: string | null = null;
    let verifiedName: string | null = null;
    let wabaId: string | null = null;

    // Navigate the nested response to find phone numbers
    const businesses = wabaAccountsData?.businesses?.data || [];
    for (const biz of businesses) {
      const wabas = biz?.owned_whatsapp_business_accounts?.data || [];
      for (const waba of wabas) {
        const phones = waba?.phone_numbers?.data || [];
        if (phones.length > 0) {
          phoneNumberId = phones[0].id;
          displayPhoneNumber = phones[0].display_phone_number;
          verifiedName = phones[0].verified_name;
          wabaId = waba.id;
          break;
        }
      }
      if (phoneNumberId) break;
    }

    // If nested approach didn't work, try direct WABA endpoint
    if (!phoneNumberId && wabaData?.data?.granular_scopes) {
      // Look for whatsapp_business_management scope with target IDs (WABA IDs)
      const waScope = wabaData.data.granular_scopes.find(
        (s: any) => s.scope === "whatsapp_business_management"
      );
      if (waScope?.target_ids?.length) {
        const targetWabaId = waScope.target_ids[0];
        wabaId = targetWabaId;

        // Fetch phone numbers from this WABA
        const phonesRes = await fetch(
          `https://graph.facebook.com/v21.0/${targetWabaId}/phone_numbers?access_token=${userAccessToken}`
        );
        const phonesData = await phonesRes.json();

        if (phonesData.data?.length) {
          phoneNumberId = phonesData.data[0].id;
          displayPhoneNumber = phonesData.data[0].display_phone_number;
          verifiedName = phonesData.data[0].verified_name;
        }
      }
    }

    if (!phoneNumberId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Nenhum numero de WhatsApp encontrado. Certifique-se de selecionar um numero durante a autorizacao.",
        },
        { status: 400 }
      );
    }

    // Save to tenant
    const { error: updateError } = await supabase
      .from("tenants")
      .update({
        whatsapp_phone_id: phoneNumberId,
        whatsapp_token: userAccessToken,
        whatsapp_coex_enabled: true,
      })
      .eq("id", dbUser.tenant_id);

    if (updateError) {
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
  } catch (error: any) {
    console.error("WhatsApp connect error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal error" },
      { status: 500 }
    );
  }
}
