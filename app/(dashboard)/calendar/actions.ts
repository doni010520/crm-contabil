"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  createEvent as gcalCreateEvent,
  deleteEvent as gcalDeleteEvent,
  listEvents as gcalListEvents,
} from "@/lib/google/calendar";
import { getValidToken, type GoogleConnection } from "@/lib/google/tokens";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface CalendarEvent {
  id: string;
  google_event_id: string;
  contact_id: string | null;
  deal_id: string | null;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string;
  timezone: string;
  location: string | null;
  meet_link: string | null;
  attendees: { email: string; name?: string | null }[];
  status: string;
  source: string;
  contact?: { id: string; name: string; phone: string | null } | null;
}

export interface BookingLink {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  availability: Record<string, { start: string; end: string }[]>;
  timezone: string;
  buffer_minutes: number;
  min_notice_hours: number;
  max_days_ahead: number;
  is_active: boolean;
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
async function getUserTenant() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nao autenticado.");

  const { data: dbUser } = await supabase
    .from("users")
    .select("id, tenant_id")
    .eq("auth_id", user.id)
    .single();
  if (!dbUser) throw new Error("Usuario nao encontrado.");

  return { supabase, userId: dbUser.id, tenantId: dbUser.tenant_id };
}

// ---------------------------------------------------------------------------
// Get calendar events
// ---------------------------------------------------------------------------
export async function getCalendarEvents(
  startDate: string,
  endDate: string
): Promise<CalendarEvent[]> {
  const { supabase } = await getUserTenant();

  const { data, error } = await supabase
    .from("calendar_events")
    .select(
      `
      id, google_event_id, contact_id, deal_id, title, description,
      start_at, end_at, timezone, location, meet_link, attendees,
      status, source,
      contact:contacts!contact_id(id, name, phone)
    `
    )
    .gte("start_at", startDate)
    .lte("start_at", endDate)
    .neq("status", "cancelled")
    .order("start_at", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((e) => ({
    ...e,
    contact: Array.isArray(e.contact) ? e.contact[0] : e.contact,
  })) as CalendarEvent[];
}

// ---------------------------------------------------------------------------
// Create calendar event (from CRM)
// ---------------------------------------------------------------------------
export async function createCalendarEvent(data: {
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  contactId?: string;
  dealId?: string;
  attendeeEmails?: string[];
  createMeet?: boolean;
}) {
  const { supabase, tenantId } = await getUserTenant();

  // Get Google connection
  const { data: conn } = await supabase
    .from("google_calendar_connections")
    .select("*")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (!conn) throw new Error("Google Calendar nao conectado.");

  const gcConn = conn as unknown as GoogleConnection;
  const token = await getValidToken(gcConn);
  const tz = gcConn.timezone || "America/Sao_Paulo";

  // Build attendees
  const attendees = (data.attendeeEmails ?? []).map((email) => ({ email }));

  // Create on Google Calendar
  const gEvent = await gcalCreateEvent(token, gcConn.calendar_id, {
    summary: data.title,
    description: data.description,
    start: { dateTime: data.startAt, timeZone: tz },
    end: { dateTime: data.endAt, timeZone: tz },
    attendees,
    ...(data.createMeet !== false
      ? {
          conferenceData: {
            createRequest: {
              requestId: `crm-${Date.now()}`,
              conferenceSolutionKey: { type: "hangoutsMeet" },
            },
          },
        }
      : {}),
  });

  const meetLink =
    gEvent.hangoutLink ??
    gEvent.conferenceData?.entryPoints?.find(
      (e) => e.entryPointType === "video"
    )?.uri ??
    null;

  // Save in DB
  const { error } = await supabase.from("calendar_events").insert({
    tenant_id: tenantId,
    google_event_id: gEvent.id,
    contact_id: data.contactId ?? null,
    deal_id: data.dealId ?? null,
    title: gEvent.summary ?? data.title,
    description: gEvent.description ?? data.description ?? null,
    start_at: data.startAt,
    end_at: data.endAt,
    timezone: tz,
    meet_link: meetLink,
    attendees: gEvent.attendees?.map((a) => ({
      email: a.email,
      name: a.displayName ?? null,
    })) ?? [],
    status: "confirmed",
    source: "crm",
  });

  if (error) throw new Error(error.message);

  revalidatePath("/calendar");
  return { meetLink };
}

// ---------------------------------------------------------------------------
// Delete calendar event
// ---------------------------------------------------------------------------
export async function deleteCalendarEvent(eventId: string) {
  const { supabase, tenantId } = await getUserTenant();

  const { data: event } = await supabase
    .from("calendar_events")
    .select("google_event_id")
    .eq("id", eventId)
    .single();

  if (!event) throw new Error("Evento nao encontrado.");

  // Get Google connection
  const { data: conn } = await supabase
    .from("google_calendar_connections")
    .select("*")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (conn) {
    const gcConn = conn as unknown as GoogleConnection;
    try {
      const token = await getValidToken(gcConn);
      await gcalDeleteEvent(token, gcConn.calendar_id, event.google_event_id);
    } catch {
      // Event may already be deleted on Google
    }
  }

  await supabase.from("calendar_events").delete().eq("id", eventId);

  revalidatePath("/calendar");
}

// ---------------------------------------------------------------------------
// Sync events from Google Calendar
// ---------------------------------------------------------------------------
export async function syncCalendarEvents() {
  const { supabase, tenantId } = await getUserTenant();

  const { data: conn } = await supabase
    .from("google_calendar_connections")
    .select("*")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (!conn) throw new Error("Google Calendar nao conectado.");

  const gcConn = conn as unknown as GoogleConnection;
  const token = await getValidToken(gcConn);

  const now = new Date();
  const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const future = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

  const events = await gcalListEvents(
    token,
    gcConn.calendar_id,
    past.toISOString(),
    future.toISOString(),
    gcConn.timezone
  );

  for (const event of events) {
    if (!event.start?.dateTime || !event.end?.dateTime) continue;

    const meetLink =
      event.hangoutLink ??
      event.conferenceData?.entryPoints?.find(
        (e) => e.entryPointType === "video"
      )?.uri ??
      null;

    await supabase.from("calendar_events").upsert(
      {
        tenant_id: tenantId,
        google_event_id: event.id,
        title: event.summary ?? "(Sem titulo)",
        description: event.description ?? null,
        start_at: event.start.dateTime,
        end_at: event.end.dateTime,
        timezone: event.start.timeZone ?? gcConn.timezone,
        location: event.location ?? null,
        meet_link: meetLink,
        attendees: (event.attendees ?? []).map((a) => ({
          email: a.email,
          name: a.displayName ?? null,
        })),
        status: event.status ?? "confirmed",
        source: "google",
        synced_at: new Date().toISOString(),
      },
      { onConflict: "tenant_id,google_event_id" }
    );
  }

  revalidatePath("/calendar");
}

// ---------------------------------------------------------------------------
// Booking Links CRUD
// ---------------------------------------------------------------------------
export async function getBookingLinks(): Promise<BookingLink[]> {
  const { supabase } = await getUserTenant();

  const { data, error } = await supabase
    .from("booking_links")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as BookingLink[];
}

export async function createBookingLink(input: {
  slug: string;
  title: string;
  description?: string;
  durationMinutes?: number;
}) {
  const { supabase, userId, tenantId } = await getUserTenant();

  const { error } = await supabase.from("booking_links").insert({
    tenant_id: tenantId,
    user_id: userId,
    slug: input.slug,
    title: input.title,
    description: input.description ?? null,
    duration_minutes: input.durationMinutes ?? 30,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/calendar");
}

export async function updateBookingLink(
  id: string,
  input: Partial<{
    title: string;
    description: string | null;
    duration_minutes: number;
    availability: Record<string, { start: string; end: string }[]>;
    timezone: string;
    buffer_minutes: number;
    min_notice_hours: number;
    max_days_ahead: number;
    is_active: boolean;
  }>
) {
  const { supabase } = await getUserTenant();

  const { error } = await supabase
    .from("booking_links")
    .update(input)
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/calendar");
}

export async function deleteBookingLink(id: string) {
  const { supabase } = await getUserTenant();

  const { error } = await supabase.from("booking_links").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/calendar");
}

// ---------------------------------------------------------------------------
// Get Google Calendar connection status
// ---------------------------------------------------------------------------
export async function getGoogleCalendarStatus(): Promise<{
  connected: boolean;
  email?: string;
  calendarId?: string;
  timezone?: string;
}> {
  const { supabase, tenantId } = await getUserTenant();

  const { data } = await supabase
    .from("google_calendar_connections")
    .select("google_email, calendar_id, timezone")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (!data) return { connected: false };

  return {
    connected: true,
    email: data.google_email,
    calendarId: data.calendar_id,
    timezone: data.timezone,
  };
}

// ---------------------------------------------------------------------------
// Get tenant slug (for booking links)
// ---------------------------------------------------------------------------
export async function getCalendarTenantSlug(): Promise<string> {
  const { supabase, tenantId } = await getUserTenant();

  const { data } = await supabase
    .from("tenants")
    .select("slug")
    .eq("id", tenantId)
    .single();

  if (!data) throw new Error("Escritorio nao encontrado.");
  return data.slug;
}
