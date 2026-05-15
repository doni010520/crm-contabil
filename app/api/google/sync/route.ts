import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { listEvents } from "@/lib/google/calendar";
import { getValidToken, type GoogleConnection } from "@/lib/google/tokens";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST() {
  const supabase = getAdminClient();

  // Fetch all connections
  const { data: connections } = await supabase
    .from("google_calendar_connections")
    .select("*");

  if (!connections || connections.length === 0) {
    return NextResponse.json({ synced: 0 });
  }

  let syncedCount = 0;

  for (const conn of connections as GoogleConnection[]) {
    try {
      const token = await getValidToken(conn);

      // Sync next 60 days
      const now = new Date();
      const future = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

      const events = await listEvents(
        token,
        conn.calendar_id,
        now.toISOString(),
        future.toISOString(),
        conn.timezone
      );

      for (const event of events) {
        if (!event.start?.dateTime || !event.end?.dateTime) continue;

        const meetLink =
          event.hangoutLink ??
          event.conferenceData?.entryPoints?.find(
            (e) => e.entryPointType === "video"
          )?.uri ??
          null;

        const attendees = (event.attendees ?? []).map((a) => ({
          email: a.email,
          name: a.displayName ?? null,
          status: a.responseStatus ?? null,
        }));

        await supabase.from("calendar_events").upsert(
          {
            tenant_id: conn.tenant_id,
            google_event_id: event.id,
            title: event.summary ?? "(Sem titulo)",
            description: event.description ?? null,
            start_at: event.start.dateTime,
            end_at: event.end.dateTime,
            timezone: event.start.timeZone ?? conn.timezone,
            location: event.location ?? null,
            meet_link: meetLink,
            attendees,
            status: event.status ?? "confirmed",
            source: "google",
            synced_at: new Date().toISOString(),
          },
          { onConflict: "tenant_id,google_event_id" }
        );
      }

      syncedCount++;
    } catch (err) {
      console.error(
        `[Google Sync] Error for tenant ${conn.tenant_id}:`,
        err
      );
    }
  }

  return NextResponse.json({ synced: syncedCount });
}
