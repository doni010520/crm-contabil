import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getFreeBusy } from "@/lib/google/calendar";
import { getValidToken, getConnectionForTenant } from "@/lib/google/tokens";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const bookingLinkId = searchParams.get("bookingLinkId");
  const date = searchParams.get("date"); // YYYY-MM-DD

  if (!bookingLinkId || !date) {
    return NextResponse.json(
      { error: "bookingLinkId and date are required" },
      { status: 400 }
    );
  }

  const supabase = getAdminClient();

  // Fetch booking link
  const { data: link } = await supabase
    .from("booking_links")
    .select("*")
    .eq("id", bookingLinkId)
    .eq("is_active", true)
    .single();

  if (!link) {
    return NextResponse.json({ error: "Booking link not found" }, { status: 404 });
  }

  // Fetch Google Calendar connection
  const conn = await getConnectionForTenant(link.tenant_id);
  if (!conn) {
    return NextResponse.json(
      { error: "Google Calendar not connected" },
      { status: 400 }
    );
  }

  const tz = link.timezone || conn.timezone || "America/Sao_Paulo";

  // Get day of week
  const dateObj = new Date(date + "T12:00:00");
  const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const dayName = dayNames[dateObj.getUTCDay()];

  const availability =
    (link.availability as Record<string, { start: string; end: string }[]>)?.[
      dayName
    ] ?? [];

  if (availability.length === 0) {
    return NextResponse.json({ slots: [] });
  }

  // Check max_days_ahead
  const now = new Date();
  const maxDate = new Date(now.getTime() + link.max_days_ahead * 24 * 60 * 60 * 1000);
  if (dateObj > maxDate) {
    return NextResponse.json({ slots: [] });
  }

  // Check it's not in the past
  const todayStr = now.toISOString().split("T")[0];
  if (date < todayStr) {
    return NextResponse.json({ slots: [] });
  }

  try {
    const token = await getValidToken(conn);

    // Get busy slots for the day
    const dayStart = `${date}T00:00:00`;
    const dayEnd = `${date}T23:59:59`;

    // Create proper timezone-aware datetime strings
    const timeMin = new Date(`${dayStart}`).toISOString();
    const timeMax = new Date(`${dayEnd}`).toISOString();

    const busySlots = await getFreeBusy(
      token,
      conn.calendar_id,
      timeMin,
      timeMax,
      tz
    );

    // Generate available slots
    const slots: { start: string; end: string }[] = [];
    const duration = link.duration_minutes as number;
    const buffer = link.buffer_minutes as number;
    const minNotice = link.min_notice_hours as number;
    const minNoticeTime = new Date(now.getTime() + minNotice * 60 * 60 * 1000);

    for (const window of availability) {
      let [startH, startM] = window.start.split(":").map(Number);
      const [endH, endM] = window.end.split(":").map(Number);
      const windowEndMinutes = endH * 60 + endM;

      let currentMinutes = startH * 60 + startM;

      while (currentMinutes + duration <= windowEndMinutes) {
        const slotStartH = Math.floor(currentMinutes / 60);
        const slotStartM = currentMinutes % 60;
        const slotEndMinutes = currentMinutes + duration;
        const slotEndH = Math.floor(slotEndMinutes / 60);
        const slotEndM = slotEndMinutes % 60;

        const slotStart = `${String(slotStartH).padStart(2, "0")}:${String(slotStartM).padStart(2, "0")}`;
        const slotEnd = `${String(slotEndH).padStart(2, "0")}:${String(slotEndM).padStart(2, "0")}`;

        // Check min notice
        const slotDateTime = new Date(`${date}T${slotStart}:00`);
        if (slotDateTime <= minNoticeTime) {
          currentMinutes += duration + buffer;
          continue;
        }

        // Check against busy slots
        const slotStartISO = `${date}T${slotStart}:00`;
        const slotEndISO = `${date}T${slotEnd}:00`;

        const isBusy = busySlots.some((busy) => {
          const busyStart = new Date(busy.start);
          const busyEnd = new Date(busy.end);
          const sStart = new Date(slotStartISO);
          const sEnd = new Date(slotEndISO);
          return sStart < busyEnd && sEnd > busyStart;
        });

        if (!isBusy) {
          slots.push({ start: slotStart, end: slotEnd });
        }

        currentMinutes += duration + buffer;
      }
    }

    return NextResponse.json({ slots });
  } catch (err) {
    console.error("[Availability] Error:", err);
    return NextResponse.json(
      { error: "Failed to check availability" },
      { status: 500 }
    );
  }
}
