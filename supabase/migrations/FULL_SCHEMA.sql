-- ============================================================
-- CRM Contábil — SCHEMA COMPLETO
-- Cole este arquivo inteiro no SQL Editor do Supabase e clique RUN.
-- ============================================================
-- Este arquivo consolida os 4 migrations em um só para conveniência.
-- Arquivos individuais: 0001_initial_schema.sql, 0002_rls_policies.sql,
-- 0003_indexes.sql, 0004_seed_pipeline.sql
-- ============================================================


-- ============================================================
-- 1/4 — ENUMS + TABELAS
-- ============================================================

CREATE TYPE plan_type AS ENUM ('free', 'basic', 'pro');
CREATE TYPE user_role AS ENUM ('owner', 'admin', 'user');
CREATE TYPE contact_type AS ENUM ('lead', 'client');
CREATE TYPE tax_regime AS ENUM ('simples', 'presumido', 'real', 'mei', 'unknown');
CREATE TYPE company_size AS ENUM ('mei', 'me', 'epp', 'medium', 'large', 'unknown');
CREATE TYPE lead_source AS ENUM ('google_ads', 'meta_ads', 'referral', 'organic', 'manual');
CREATE TYPE activity_type AS ENUM (
  'stage_change', 'note', 'reminder', 'call', 'meeting',
  'email', 'whatsapp', 'proposal_sent', 'contract_sent', 'auto_followup'
);
CREATE TYPE conversation_status AS ENUM ('open', 'closed');
CREATE TYPE message_direction AS ENUM ('inbound', 'outbound');
CREATE TYPE message_sender_type AS ENUM ('contact', 'user', 'bot');
CREATE TYPE message_type AS ENUM ('text', 'image', 'document', 'audio', 'video', 'template', 'interactive');
CREATE TYPE message_status AS ENUM ('sent', 'delivered', 'read', 'failed');
CREATE TYPE proposal_status AS ENUM ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired');
CREATE TYPE contract_status AS ENUM ('draft', 'sent', 'signed', 'cancelled');
CREATE TYPE followup_channel AS ENUM ('whatsapp', 'email');
CREATE TYPE followup_status AS ENUM ('pending', 'sent', 'cancelled', 'failed');
CREATE TYPE wa_template_category AS ENUM ('marketing', 'utility', 'authentication');
CREATE TYPE wa_template_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  cnpj text,
  phone text,
  whatsapp_phone_id text,
  whatsapp_token text,
  whatsapp_coex_enabled boolean NOT NULL DEFAULT false,
  plan plan_type NOT NULL DEFAULT 'free',
  settings jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  avatar_url text,
  auth_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  email text,
  type contact_type NOT NULL DEFAULT 'lead',
  cnpj text,
  company_name text,
  trade_name text,
  cnae_code text,
  cnae_description text,
  tax_regime tax_regime NOT NULL DEFAULT 'unknown',
  company_size company_size NOT NULL DEFAULT 'unknown',
  state text,
  city text,
  address text,
  founding_date date,
  has_branches boolean NOT NULL DEFAULT false,
  monthly_revenue numeric(14,2),
  employee_count integer,
  monthly_invoices integer,
  niche text,
  source lead_source NOT NULL DEFAULT 'manual',
  tags text[] NOT NULL DEFAULT '{}',
  notes text,
  enriched_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE pipeline_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  position integer NOT NULL,
  color text NOT NULL DEFAULT '#3B82F6',
  is_default boolean NOT NULL DEFAULT false,
  auto_reminder_days integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  stage_id uuid NOT NULL REFERENCES pipeline_stages(id) ON DELETE RESTRICT,
  assigned_to uuid REFERENCES users(id) ON DELETE SET NULL,
  title text NOT NULL,
  value numeric(14,2) NOT NULL DEFAULT 0,
  expected_close_date date,
  lost_reason text,
  won_at timestamptz,
  lost_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE deal_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  deal_id uuid NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  type activity_type NOT NULL,
  description text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  whatsapp_conversation_id text,
  status conversation_status NOT NULL DEFAULT 'open',
  last_message_at timestamptz,
  unread_count integer NOT NULL DEFAULT 0,
  assigned_to uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  whatsapp_message_id text,
  direction message_direction NOT NULL,
  sender_type message_sender_type NOT NULL,
  sender_id text,
  type message_type NOT NULL DEFAULT 'text',
  content text,
  media_url text,
  media_mime_type text,
  status message_status NOT NULL DEFAULT 'sent',
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  deal_id uuid NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  packages jsonb NOT NULL DEFAULT '[]',
  selected_package text,
  valid_until date NOT NULL,
  status proposal_status NOT NULL DEFAULT 'draft',
  sent_at timestamptz,
  viewed_at timestamptz,
  responded_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  proposal_id uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  deal_id uuid NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  content text NOT NULL,
  status contract_status NOT NULL DEFAULT 'draft',
  signed_at timestamptz,
  signature_data jsonb,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE followup_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  stage_id uuid NOT NULL REFERENCES pipeline_stages(id) ON DELETE CASCADE,
  name text NOT NULL,
  message text NOT NULL,
  delay_days integer NOT NULL DEFAULT 3,
  channel followup_channel NOT NULL DEFAULT 'whatsapp',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE followup_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  deal_id uuid NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES followup_templates(id) ON DELETE CASCADE,
  scheduled_for timestamptz NOT NULL,
  status followup_status NOT NULL DEFAULT 'pending',
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE whatsapp_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  meta_template_name text NOT NULL,
  category wa_template_category NOT NULL,
  language text NOT NULL DEFAULT 'pt_BR',
  content text NOT NULL,
  variables text[] NOT NULL DEFAULT '{}',
  status wa_template_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON deals FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON proposals FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================================
-- 2/4 — RLS POLICIES
-- ============================================================

CREATE OR REPLACE FUNCTION auth_user_tenant_id()
RETURNS uuid AS $$
  SELECT tenant_id FROM users WHERE auth_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_select" ON tenants FOR SELECT USING (id = auth_user_tenant_id());
CREATE POLICY "tenant_update" ON tenants FOR UPDATE USING (id = auth_user_tenant_id());

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select" ON users FOR SELECT USING (tenant_id = auth_user_tenant_id());
CREATE POLICY "users_insert" ON users FOR INSERT WITH CHECK (tenant_id = auth_user_tenant_id());
CREATE POLICY "users_update" ON users FOR UPDATE USING (tenant_id = auth_user_tenant_id());
CREATE POLICY "users_delete" ON users FOR DELETE USING (tenant_id = auth_user_tenant_id());

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contacts_select" ON contacts FOR SELECT USING (tenant_id = auth_user_tenant_id());
CREATE POLICY "contacts_insert" ON contacts FOR INSERT WITH CHECK (tenant_id = auth_user_tenant_id());
CREATE POLICY "contacts_update" ON contacts FOR UPDATE USING (tenant_id = auth_user_tenant_id());
CREATE POLICY "contacts_delete" ON contacts FOR DELETE USING (tenant_id = auth_user_tenant_id());

ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stages_select" ON pipeline_stages FOR SELECT USING (tenant_id = auth_user_tenant_id());
CREATE POLICY "stages_insert" ON pipeline_stages FOR INSERT WITH CHECK (tenant_id = auth_user_tenant_id());
CREATE POLICY "stages_update" ON pipeline_stages FOR UPDATE USING (tenant_id = auth_user_tenant_id());
CREATE POLICY "stages_delete" ON pipeline_stages FOR DELETE USING (tenant_id = auth_user_tenant_id());

ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deals_select" ON deals FOR SELECT USING (tenant_id = auth_user_tenant_id());
CREATE POLICY "deals_insert" ON deals FOR INSERT WITH CHECK (tenant_id = auth_user_tenant_id());
CREATE POLICY "deals_update" ON deals FOR UPDATE USING (tenant_id = auth_user_tenant_id());
CREATE POLICY "deals_delete" ON deals FOR DELETE USING (tenant_id = auth_user_tenant_id());

ALTER TABLE deal_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activities_select" ON deal_activities FOR SELECT USING (tenant_id = auth_user_tenant_id());
CREATE POLICY "activities_insert" ON deal_activities FOR INSERT WITH CHECK (tenant_id = auth_user_tenant_id());

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conversations_select" ON conversations FOR SELECT USING (tenant_id = auth_user_tenant_id());
CREATE POLICY "conversations_insert" ON conversations FOR INSERT WITH CHECK (tenant_id = auth_user_tenant_id());
CREATE POLICY "conversations_update" ON conversations FOR UPDATE USING (tenant_id = auth_user_tenant_id());

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages_select" ON messages FOR SELECT USING (tenant_id = auth_user_tenant_id());
CREATE POLICY "messages_insert" ON messages FOR INSERT WITH CHECK (tenant_id = auth_user_tenant_id());
CREATE POLICY "messages_update" ON messages FOR UPDATE USING (tenant_id = auth_user_tenant_id());

ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "proposals_select" ON proposals FOR SELECT USING (tenant_id = auth_user_tenant_id());
CREATE POLICY "proposals_insert" ON proposals FOR INSERT WITH CHECK (tenant_id = auth_user_tenant_id());
CREATE POLICY "proposals_update" ON proposals FOR UPDATE USING (tenant_id = auth_user_tenant_id());

ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contracts_select" ON contracts FOR SELECT USING (tenant_id = auth_user_tenant_id());
CREATE POLICY "contracts_insert" ON contracts FOR INSERT WITH CHECK (tenant_id = auth_user_tenant_id());
CREATE POLICY "contracts_update" ON contracts FOR UPDATE USING (tenant_id = auth_user_tenant_id());

ALTER TABLE followup_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "followup_tpl_select" ON followup_templates FOR SELECT USING (tenant_id = auth_user_tenant_id());
CREATE POLICY "followup_tpl_insert" ON followup_templates FOR INSERT WITH CHECK (tenant_id = auth_user_tenant_id());
CREATE POLICY "followup_tpl_update" ON followup_templates FOR UPDATE USING (tenant_id = auth_user_tenant_id());
CREATE POLICY "followup_tpl_delete" ON followup_templates FOR DELETE USING (tenant_id = auth_user_tenant_id());

ALTER TABLE followup_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "followup_q_select" ON followup_queue FOR SELECT USING (tenant_id = auth_user_tenant_id());
CREATE POLICY "followup_q_insert" ON followup_queue FOR INSERT WITH CHECK (tenant_id = auth_user_tenant_id());
CREATE POLICY "followup_q_update" ON followup_queue FOR UPDATE USING (tenant_id = auth_user_tenant_id());

ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wa_tpl_select" ON whatsapp_templates FOR SELECT USING (tenant_id = auth_user_tenant_id());
CREATE POLICY "wa_tpl_insert" ON whatsapp_templates FOR INSERT WITH CHECK (tenant_id = auth_user_tenant_id());
CREATE POLICY "wa_tpl_update" ON whatsapp_templates FOR UPDATE USING (tenant_id = auth_user_tenant_id());


-- ============================================================
-- 3/4 — ÍNDICES
-- ============================================================

CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_contacts_tenant ON contacts(tenant_id);
CREATE INDEX idx_pipeline_stages_tenant ON pipeline_stages(tenant_id);
CREATE INDEX idx_deals_tenant ON deals(tenant_id);
CREATE INDEX idx_deal_activities_tenant ON deal_activities(tenant_id);
CREATE INDEX idx_conversations_tenant ON conversations(tenant_id);
CREATE INDEX idx_messages_tenant ON messages(tenant_id);
CREATE INDEX idx_proposals_tenant ON proposals(tenant_id);
CREATE INDEX idx_contracts_tenant ON contracts(tenant_id);
CREATE INDEX idx_followup_templates_tenant ON followup_templates(tenant_id);
CREATE INDEX idx_followup_queue_tenant ON followup_queue(tenant_id);
CREATE INDEX idx_whatsapp_templates_tenant ON whatsapp_templates(tenant_id);
CREATE INDEX idx_tenants_whatsapp_phone ON tenants(whatsapp_phone_id) WHERE whatsapp_phone_id IS NOT NULL;
CREATE INDEX idx_contacts_phone ON contacts(tenant_id, phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_contacts_cnpj ON contacts(tenant_id, cnpj) WHERE cnpj IS NOT NULL;
CREATE INDEX idx_deals_stage ON deals(tenant_id, stage_id);
CREATE INDEX idx_deals_assigned ON deals(tenant_id, assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_conversations_last_msg ON conversations(tenant_id, last_message_at DESC);
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX idx_followup_pending ON followup_queue(scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_activities_deal ON deal_activities(deal_id, created_at DESC);
CREATE INDEX idx_proposals_deal ON proposals(deal_id);
CREATE INDEX idx_users_auth ON users(auth_id) WHERE auth_id IS NOT NULL;
CREATE INDEX idx_stages_position ON pipeline_stages(tenant_id, position);


-- ============================================================
-- 4/4 — SEED: auto-criar estágios e templates ao criar tenant
-- ============================================================

CREATE OR REPLACE FUNCTION seed_tenant_defaults(p_tenant_id uuid)
RETURNS void AS $$
DECLARE
  stage_proposta uuid;
  stage_followup uuid;
  stage_diag_agendado uuid;
BEGIN
  INSERT INTO pipeline_stages (id, tenant_id, name, position, color, is_default, auto_reminder_days) VALUES
    (gen_random_uuid(), p_tenant_id, 'Lead Novo',              1,  '#3B82F6', true,  NULL),
    (gen_random_uuid(), p_tenant_id, 'Enriquecido',            2,  '#60A5FA', false, NULL),
    (gen_random_uuid(), p_tenant_id, 'Qualificado',            3,  '#EAB308', false, NULL),
    (gen_random_uuid(), p_tenant_id, 'Diagnóstico Agendado',   4,  '#F97316', false, NULL),
    (gen_random_uuid(), p_tenant_id, 'Diagnóstico Realizado',  5,  '#EA580C', false, NULL),
    (gen_random_uuid(), p_tenant_id, 'Proposta Enviada',       6,  '#8B5CF6', false, NULL),
    (gen_random_uuid(), p_tenant_id, 'Follow-up',              7,  '#EC4899', false, 5),
    (gen_random_uuid(), p_tenant_id, 'Negociação',             8,  '#EF4444', false, NULL),
    (gen_random_uuid(), p_tenant_id, 'Contrato Assinado',      9,  '#22C55E', false, NULL),
    (gen_random_uuid(), p_tenant_id, 'Perdido',                10, '#6B7280', false, NULL);

  SELECT id INTO stage_proposta      FROM pipeline_stages WHERE tenant_id = p_tenant_id AND name = 'Proposta Enviada';
  SELECT id INTO stage_followup      FROM pipeline_stages WHERE tenant_id = p_tenant_id AND name = 'Follow-up';
  SELECT id INTO stage_diag_agendado FROM pipeline_stages WHERE tenant_id = p_tenant_id AND name = 'Diagnóstico Agendado';

  INSERT INTO followup_templates (tenant_id, stage_id, name, message, delay_days, channel) VALUES
    (p_tenant_id, stage_proposta,      'Proposta — 3 dias',               'Olá {{contact_name}}, enviei a proposta para {{company_name}} há alguns dias. Conseguiu analisar? Fico à disposição pra tirar qualquer dúvida.', 3, 'whatsapp'),
    (p_tenant_id, stage_proposta,      'Proposta — 7 dias',               '{{contact_name}}, tudo bem? Só passando pra saber se surgiu alguma dúvida sobre nossa proposta. Posso te ligar pra explicar melhor?', 7, 'whatsapp'),
    (p_tenant_id, stage_followup,      'Follow-up — 5 dias',              '{{contact_name}}, entendo que o momento pode não ser o ideal. Fico à disposição quando quiser retomar. Enquanto isso, preparei um material sobre economia tributária pra empresas do seu setor. Posso enviar?', 5, 'whatsapp'),
    (p_tenant_id, stage_followup,      'Follow-up — 15 dias (último)',    '{{contact_name}}, passando pra dar um último oi. Se precisar de contabilidade no futuro, estamos aqui. Boa sorte com os negócios!', 15, 'whatsapp'),
    (p_tenant_id, stage_diag_agendado, 'Confirmação de diagnóstico',      'Olá {{contact_name}}, confirmando nosso diagnóstico tributário amanhã. Vai ser uma conversa de 30 minutos onde vamos analisar a situação fiscal da {{company_name}}. Pode confirmar?', 1, 'whatsapp');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION on_tenant_created()
RETURNS trigger AS $$
BEGIN
  PERFORM seed_tenant_defaults(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER seed_new_tenant
  AFTER INSERT ON tenants
  FOR EACH ROW EXECUTE FUNCTION on_tenant_created();
