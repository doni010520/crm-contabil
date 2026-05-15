-- ============================================================
-- Native CRM Calendar + Task Management
-- ============================================================

-- Decouple calendar_events from Google (make google_event_id optional)
ALTER TABLE public.calendar_events
  DROP CONSTRAINT calendar_events_tenant_id_google_event_id_key;

ALTER TABLE public.calendar_events
  ALTER COLUMN google_event_id DROP NOT NULL;

CREATE UNIQUE INDEX uq_calendar_events_google
  ON public.calendar_events(tenant_id, google_event_id)
  WHERE google_event_id IS NOT NULL;

ALTER TABLE public.calendar_events
  ADD COLUMN google_synced boolean NOT NULL DEFAULT false;

-- Tasks table
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  due_date date,
  due_time time,
  priority text NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low','medium','high','urgent')),
  status text NOT NULL DEFAULT 'todo'
    CHECK (status IN ('todo','in_progress','done','cancelled')),
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  deal_id uuid REFERENCES deals(id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES users(id) ON DELETE SET NULL,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON public.tasks
  FOR ALL USING (tenant_id = auth_user_tenant_id());

CREATE INDEX idx_tasks_tenant ON tasks(tenant_id);
CREATE INDEX idx_tasks_due_date ON tasks(tenant_id, due_date);
CREATE INDEX idx_tasks_status ON tasks(tenant_id, status);
CREATE INDEX idx_tasks_assigned ON tasks(tenant_id, assigned_to);
CREATE INDEX idx_tasks_contact ON tasks(contact_id);
CREATE INDEX idx_tasks_deal ON tasks(deal_id);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
