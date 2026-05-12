-- ============================================================
-- Calculadoras — tabelas para calculadoras públicas de captação
-- ============================================================

CREATE TABLE public.tenant_calculators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('regime_simulator', 'clt_cost', 'fiscal_health', 'opening_cost')),
  is_active boolean DEFAULT false,
  slug text NOT NULL,
  cta_text text,
  cta_action text DEFAULT 'whatsapp' CHECK (cta_action IN ('whatsapp', 'email', 'link')),
  cta_url text,
  leads_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, type)
);

CREATE TABLE public.calculator_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  calculator_id uuid NOT NULL REFERENCES tenant_calculators(id),
  contact_id uuid REFERENCES contacts(id),
  calculator_type text NOT NULL,
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  company_name text,
  inputs jsonb DEFAULT '{}',
  result jsonb DEFAULT '{}',
  score integer,
  score_level text CHECK (score_level IN ('green', 'yellow', 'red')),
  source text,
  viewed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.tenant_calculators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calculator_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON public.tenant_calculators
  FOR ALL USING (tenant_id = auth_user_tenant_id());

CREATE POLICY "tenant_isolation" ON public.calculator_leads
  FOR ALL USING (tenant_id = auth_user_tenant_id());

CREATE INDEX idx_calc_leads_tenant ON public.calculator_leads(tenant_id);
CREATE INDEX idx_calc_leads_calc ON public.calculator_leads(calculator_id);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON tenant_calculators
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
