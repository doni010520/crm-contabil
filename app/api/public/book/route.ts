import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createEvent } from "@/lib/google/calendar";
import { getValidToken, getConnectionForTenant } from "@/lib/google/tokens";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingLinkId, date, startTime, name, email, phone, notes } = body;

    if (!bookingLinkId || !date || !startTime || !name || !phone) {
      return NextResponse.json(
        { error: "Campos obrigatorios: bookingLinkId, date, startTime, name, phone" },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    // Fetch booking link
    const { data: link } = await supabase
      .from("booking_links")
      .select("*, user:users!user_id(name, email)")
      .eq("id", bookingLinkId)
      .eq("is_active", true)
      .single();

    if (!link) {
      return NextResponse.json({ error: "Link nao encontrado" }, { status: 404 });
    }

    // Fetch tenant
    const { data: tenant } = await supabase
      .from("tenants")
      .select("id, name")
      .eq("id", link.tenant_id)
      .single();

    if (!tenant) {
      return NextResponse.json({ error: "Escritorio nao encontrado" }, { status: 404 });
    }

    // Fetch Google Calendar connection
    const conn = await getConnectionForTenant(link.tenant_id);
    if (!conn) {
      return NextResponse.json(
        { error: "Google Calendar nao conectado" },
        { status: 400 }
      );
    }

    const tz = link.timezone || conn.timezone || "America/Sao_Paulo";
    const duration = link.duration_minutes as number;

    // Build start/end times
    const [startH, startM] = startTime.split(":").map(Number);
    const endMinutes = startH * 60 + startM + duration;
    const endH = Math.floor(endMinutes / 60);
    const endM = endMinutes % 60;
    const endTime = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;

    const startDateTime = `${date}T${startTime}:00`;
    const endDateTime = `${date}T${endTime}:00`;

    // Build attendees
    const ownerUser = Array.isArray(link.user) ? link.user[0] : link.user;
    const attendees: { email: string; displayName?: string }[] = [];

    if (ownerUser?.email) {
      attendees.push({ email: ownerUser.email, displayName: ownerUser.name });
    }
    if (email) {
      attendees.push({ email, displayName: name });
    }

    // Create Google Calendar event with Meet link
    const token = await getValidToken(conn);

    const gEvent = await createEvent(token, conn.calendar_id, {
      summary: `Reuniao: ${name} - ${tenant.name}`,
      description: [
        `Nome: ${name}`,
        `Telefone: ${phone}`,
        email ? `Email: ${email}` : null,
        notes ? `\nObservacoes: ${notes}` : null,
        `\nAgendado via link de agendamento do ${tenant.name}`,
      ]
        .filter(Boolean)
        .join("\n"),
      start: { dateTime: startDateTime, timeZone: tz },
      end: { dateTime: endDateTime, timeZone: tz },
      attendees,
      conferenceData: {
        createRequest: {
          requestId: `crm-${Date.now()}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    });

    const meetLink =
      gEvent.hangoutLink ??
      gEvent.conferenceData?.entryPoints?.find(
        (e) => e.entryPointType === "video"
      )?.uri ??
      null;

    // Find or create contact
    let contactId: string | null = null;
    const { data: existingContact } = await supabase
      .from("contacts")
      .select("id")
      .eq("tenant_id", link.tenant_id)
      .eq("phone", phone)
      .maybeSingle();

    if (existingContact) {
      contactId = existingContact.id;
    } else {
      const { data: newContact } = await supabase
        .from("contacts")
        .insert({
          tenant_id: link.tenant_id,
          name,
          phone,
          email: email || null,
          type: "lead",
          source: "organic",
        })
        .select("id")
        .single();
      contactId = newContact?.id ?? null;
    }

    // Save event in DB
    await supabase.from("calendar_events").insert({
      tenant_id: link.tenant_id,
      google_event_id: gEvent.id,
      contact_id: contactId,
      title: gEvent.summary ?? `Reuniao: ${name}`,
      description: gEvent.description ?? null,
      start_at: startDateTime,
      end_at: endDateTime,
      timezone: tz,
      meet_link: meetLink,
      attendees: attendees.map((a) => ({
        email: a.email,
        name: a.displayName ?? null,
      })),
      status: "confirmed",
      source: "crm",
    });

    return NextResponse.json({
      success: true,
      meetLink,
      startTime,
      endTime,
      date,
    });
  } catch (err) {
    console.error("[Book] Error:", err);
    return NextResponse.json(
      { error: "Falha ao agendar reuniao" },
      { status: 500 }
    );
  }
}
