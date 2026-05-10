-- ============================================================
-- CRM Contábil — Schema inicial
-- ============================================================

-- Enums
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

-- ============================================================
-- tenants
-- ============================================================
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

-- ============================================================
-- users
-- ============================================================
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

-- ============================================================
-- contacts
-- ============================================================
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

-- ============================================================
-- pipeline_stages
-- ============================================================
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

-- ============================================================
-- deals
-- ============================================================
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

-- ============================================================
-- deal_activities
-- ============================================================
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

-- ============================================================
-- conversations
-- ============================================================
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

-- ============================================================
-- messages
-- ============================================================
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

-- ============================================================
-- proposals
-- ============================================================
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

-- ============================================================
-- contracts
-- ============================================================
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

-- ============================================================
-- followup_templates
-- ============================================================
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

-- ============================================================
-- followup_queue
-- ============================================================
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

-- ============================================================
-- whatsapp_templates
-- ============================================================
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

-- ============================================================
-- updated_at trigger (auto-update em todas as tabelas com updated_at)
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON proposals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
