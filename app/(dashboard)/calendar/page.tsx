import {
  getCalendarEvents,
  getBookingLinks,
  getGoogleCalendarStatus,
  getCalendarTenantSlug,
} from "./actions";
import { CalendarClient } from "./calendar-client";

export default async function CalendarPage() {
  // Get current week range
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const [events, bookingLinks, gcalStatus, tenantSlug] = await Promise.all([
    getCalendarEvents(startOfWeek.toISOString(), endOfWeek.toISOString()),
    getBookingLinks(),
    getGoogleCalendarStatus(),
    getCalendarTenantSlug(),
  ]);

  return (
    <CalendarClient
      initialEvents={events}
      bookingLinks={bookingLinks}
      gcalStatus={gcalStatus}
      tenantSlug={tenantSlug}
    />
  );
}
