import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { PublicBooking } from "./public-booking";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export default async function BookingPage({
  params,
}: {
  params: Promise<{ tenantSlug: string; bookingSlug: string }>;
}) {
  const { tenantSlug, bookingSlug } = await params;
  const supabase = getAdminClient();

  // Find tenant
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, name")
    .eq("slug", tenantSlug)
    .single();

  if (!tenant) return notFound();

  // Find booking link
  const { data: link } = await supabase
    .from("booking_links")
    .select("*")
    .eq("tenant_id", tenant.id)
    .eq("slug", bookingSlug)
    .eq("is_active", true)
    .single();

  if (!link) return notFound();

  return (
    <PublicBooking
      tenantName={tenant.name}
      bookingLink={{
        id: link.id,
        title: link.title,
        description: link.description,
        durationMinutes: link.duration_minutes,
        timezone: link.timezone,
        maxDaysAhead: link.max_days_ahead,
        availability: link.availability as Record<
          string,
          { start: string; end: string }[]
        >,
      }}
    />
  );
}
