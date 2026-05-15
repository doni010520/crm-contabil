import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUrl } from "@/lib/google/calendar";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL!));
  }

  // Get tenant_id
  const { data: dbUser } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("auth_id", user.id)
    .single();

  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // State = tenant_id (simple approach — in production use encrypted/signed token)
  const state = Buffer.from(
    JSON.stringify({ tenantId: dbUser.tenant_id, ts: Date.now() })
  ).toString("base64url");

  const url = getAuthUrl(state);
  return NextResponse.redirect(url);
}
