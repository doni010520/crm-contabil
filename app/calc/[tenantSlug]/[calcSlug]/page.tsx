import { notFound } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { PublicCalculator } from "./public-calculator";

interface PageProps {
  params: Promise<{ tenantSlug: string; calcSlug: string }>;
}

export default async function PublicCalcPage({ params }: PageProps) {
  const { tenantSlug, calcSlug } = await params;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    }
  );

  // Lookup tenant by slug
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, name, slug")
    .eq("slug", tenantSlug)
    .single();

  if (!tenant) notFound();

  // Lookup calculator
  const { data: calculator } = await supabase
    .from("tenant_calculators")
    .select("*")
    .eq("tenant_id", tenant.id)
    .eq("slug", calcSlug)
    .eq("is_active", true)
    .single();

  if (!calculator) notFound();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <PublicCalculator
        tenant={{ id: tenant.id, name: tenant.name, slug: tenant.slug }}
        calculator={calculator}
      />
    </div>
  );
}
