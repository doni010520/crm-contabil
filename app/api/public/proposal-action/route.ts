import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  try {
    const { token, action, reason } = await request.json();

    if (!token || !action) {
      return NextResponse.json({ error: "Missing token or action" }, { status: 400 });
    }

    const supabase = getAdminClient();

    // Find proposal by token
    const { data: proposal, error: findError } = await supabase
      .from("proposals")
      .select("id, status, tenant_id")
      .eq("public_token", token)
      .single();

    if (findError || !proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    // Only allow action on sent/viewed proposals
    if (!["sent", "viewed"].includes(proposal.status)) {
      return NextResponse.json({ error: "Proposal cannot be modified" }, { status: 400 });
    }

    if (action === "accept") {
      const { error } = await supabase
        .from("proposals")
        .update({
          status: "accepted",
          accepted_at: new Date().toISOString(),
        })
        .eq("id", proposal.id);

      if (error) throw error;

      return NextResponse.json({ success: true, status: "accepted" });
    }

    if (action === "reject") {
      const { error } = await supabase
        .from("proposals")
        .update({
          status: "rejected",
          rejected_at: new Date().toISOString(),
          rejection_reason: reason || null,
        })
        .eq("id", proposal.id);

      if (error) throw error;

      return NextResponse.json({ success: true, status: "rejected" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Proposal action error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
