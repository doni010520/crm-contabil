// ---------------------------------------------------------------------------
// Google Calendar API v3 wrapper (raw fetch, no SDK dependency)
// ---------------------------------------------------------------------------

const GOOGLE_API = "https://www.googleapis.com/calendar/v3";
const OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone?: string };
  end: { dateTime: string; timeZone?: string };
  location?: string;
  hangoutLink?: string;
  conferenceData?: {
    entryPoints?: { entryPointType: string; uri: string }[];
  };
  attendees?: { email: string; responseStatus?: string; displayName?: string }[];
  status: string;
  htmlLink?: string;
}

export interface CreateEventPayload {
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  location?: string;
  attendees?: { email: string; displayName?: string }[];
  conferenceData?: {
    createRequest: { requestId: string; conferenceSolutionKey: { type: string } };
  };
}

export interface BusySlot {
  start: string;
  end: string;
}

// ---------------------------------------------------------------------------
// OAuth helpers
// ---------------------------------------------------------------------------
export function getAuthUrl(state: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI!;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/business.manage",
    ].join(" "),
    access_type: "offline",
    prompt: "consent",
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string): Promise<GoogleTokens> {
  const res = await fetch(OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed: ${err}`);
  }

  return res.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<GoogleTokens> {
  const res = await fetch(OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token refresh failed: ${err}`);
  }

  return res.json();
}

export async function getGoogleUserEmail(accessToken: string): Promise<string> {
  const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) throw new Error("Failed to get user info");

  const data = await res.json();
  return data.email;
}

// ---------------------------------------------------------------------------
// Calendar API
// ---------------------------------------------------------------------------
export async function listEvents(
  token: string,
  calendarId: string,
  timeMin: string,
  timeMax: string,
  timeZone?: string
): Promise<GoogleCalendarEvent[]> {
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "250",
  });
  if (timeZone) params.set("timeZone", timeZone);

  const res = await fetch(
    `${GOOGLE_API}/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`listEvents failed: ${err}`);
  }

  const data = await res.json();
  return data.items ?? [];
}

export async function createEvent(
  token: string,
  calendarId: string,
  event: CreateEventPayload
): Promise<GoogleCalendarEvent> {
  const params = event.conferenceData ? "?conferenceDataVersion=1" : "";

  const res = await fetch(
    `${GOOGLE_API}/calendars/${encodeURIComponent(calendarId)}/events${params}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`createEvent failed: ${err}`);
  }

  return res.json();
}

export async function deleteEvent(
  token: string,
  calendarId: string,
  eventId: string
): Promise<void> {
  const res = await fetch(
    `${GOOGLE_API}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok && res.status !== 410) {
    const err = await res.text();
    throw new Error(`deleteEvent failed: ${err}`);
  }
}

export async function getFreeBusy(
  token: string,
  calendarId: string,
  timeMin: string,
  timeMax: string,
  timeZone?: string
): Promise<BusySlot[]> {
  const res = await fetch(`${GOOGLE_API}/freeBusy`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      timeMin,
      timeMax,
      timeZone: timeZone ?? "America/Sao_Paulo",
      items: [{ id: calendarId }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`getFreeBusy failed: ${err}`);
  }

  const data = await res.json();
  return data.calendars?.[calendarId]?.busy ?? [];
}

export async function listCalendars(
  token: string
): Promise<{ id: string; summary: string; primary?: boolean }[]> {
  const res = await fetch(`${GOOGLE_API}/users/me/calendarList`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`listCalendars failed: ${err}`);
  }

  const data = await res.json();
  return (data.items ?? []).map((c: Record<string, unknown>) => ({
    id: c.id as string,
    summary: c.summary as string,
    primary: c.primary as boolean | undefined,
  }));
}
