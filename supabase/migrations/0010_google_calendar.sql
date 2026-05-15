-- ============================================================
-- Google Calendar integration tables
-- ============================================================

-- Google Calendar connection (one per tenant)
CREATE TABLE public.google_calendar_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
  google_email text NOT NULL,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  token_expires_at timestamptz NOT NULL,
  calendar_id text NOT NULL DEFAULT 'primary',
  timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  sync_token text,
  connected_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Cached calendar events (mirror of Google Calendar)
CREATE TABLE public.calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  google_event_id text NOT NULL,
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  deal_id uuid REFERENCES deals(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  location text,
  meet_link text,
  attendees jsonb NOT NULL DEFAULT '[]',
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed','tentative','cancelled')),
  source text NOT NULL DEFAULT 'crm' CHECK (source IN ('crm','google')),
  synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, google_event_id)
);

-- Public booking links (Calendly-like)
CREATE TABLE public.booking_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL DEFAULT 'Reuniao com Contador',
  description text,
  duration_minutes integer NOT NULL DEFAULT 30,
  availability jsonb NOT NULL DEFAULT '{"mon":[{"start":"09:00","end":"12:00"},{"start":"14:00","end":"18:00"}],"tue":[{"start":"09:00","end":"12:00"},{"start":"14:00","end":"18:00"}],"wed":[{"start":"09:00","end":"12:00"},{"start":"14:00","end":"18:00"}],"thu":[{"start":"09:00","end":"12:00"},{"start":"14:00","end":"18:00"}],"fri":[{"start":"09:00","end":"12:00"},{"start":"14:00","end":"18:00"}]}',
  timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  buffer_minutes integer NOT NULL DEFAULT 15,
  min_notice_hours integer NOT NULL DEFAULT 2,
  max_days_ahead integer NOT NULL DEFAULT 30,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, slug)
);

-- RLS
ALTER TABLE public.google_calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON public.google_calendar_connections
  FOR ALL USING (tenant_id = auth_user_tenant_id());

CREATE POLICY "tenant_isolation" ON public.calendar_events
  FOR ALL USING (tenant_id = auth_user_tenant_id());

CREATE POLICY "tenant_isolation" ON public.booking_links
  FOR ALL USING (tenant_id = auth_user_tenant_id());

-- Public read access for booking links (for the public booking page)
CREATE POLICY "booking_links_public_read" ON public.booking_links
  FOR SELECT TO anon USING (is_active = true);

-- Indexes
CREATE INDEX idx_gcal_conn_tenant ON google_calendar_connections(tenant_id);
CREATE INDEX idx_cal_events_tenant ON calendar_events(tenant_id);
CREATE INDEX idx_cal_events_start ON calendar_events(tenant_id, start_at);
CREATE INDEX idx_cal_events_contact ON calendar_events(contact_id);
CREATE INDEX idx_cal_events_google_id ON calendar_events(tenant_id, google_event_id);
CREATE INDEX idx_booking_links_tenant ON booking_links(tenant_id);
CREATE INDEX idx_booking_links_slug ON booking_links(tenant_id, slug);

-- Triggers
CREATE TRIGGER set_updated_at BEFORE UPDATE ON google_calendar_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON booking_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
