-- ============================================================
-- Diagnóstico / Briefing de Reunião
-- ============================================================

CREATE TABLE public.meeting_briefings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  pipeline_entry_id uuid,
  name text NOT NULL,
  status text DEFAULT 'draft' CHECK (status IN ('enriching', 'draft', 'generating', 'completed', 'error')),
  cnpj text,
  enrichment_data jsonb DEFAULT '{}',
  manual_inputs jsonb DEFAULT '{}',
  content text,
  content_sections jsonb DEFAULT '{}',
  error_message text,
  generated_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.meeting_briefings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON public.meeting_briefings
  FOR ALL USING (tenant_id = auth_user_tenant_id());

CREATE INDEX idx_briefings_tenant ON public.meeting_briefings(tenant_id);
CREATE INDEX idx_briefings_contact ON public.meeting_briefings(contact_id);
CREATE INDEX idx_briefings_pipeline ON public.meeting_briefings(pipeline_entry_id);
CREATE INDEX idx_briefings_status ON public.meeting_briefings(status);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON meeting_briefings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
