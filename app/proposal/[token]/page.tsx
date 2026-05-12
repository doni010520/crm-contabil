import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { PublicProposalView } from "./public-proposal-view";

// Use service role to bypass RLS for public access
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export default async function PublicProposalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = getAdminClient();

  const { data: proposal } = await supabase
    .from("proposals")
    .select("*, proposal_views(id, viewed_at)")
    .eq("public_token", token)
    .single();

  if (!proposal) notFound();

  // Get tenant info for branding
  const { data: tenant } = await supabase
    .from("tenants")
    .select("name, email, phone")
    .eq("id", proposal.tenant_id)
    .single();

  // Record view
  if (proposal.status === "sent" || proposal.status === "viewed") {
    await supabase.from("proposal_views").insert({
      proposal_id: proposal.id,
    });

    if (proposal.status === "sent") {
      await supabase
        .from("proposals")
        .update({ status: "viewed", viewed_at: new Date().toISOString() })
        .eq("id", proposal.id);
    }
  }

  return (
    <PublicProposalView
      proposal={proposal}
      tenant={tenant}
      token={token}
    />
  );
}
