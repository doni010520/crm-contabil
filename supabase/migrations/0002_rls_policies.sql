-- ============================================================
-- RLS Policies — isolamento multi-tenant
-- ============================================================
-- Estratégia: cada tabela com tenant_id usa RLS.
-- A função helper tenant_id_for_auth() busca o tenant do usuário logado.
-- ============================================================

CREATE OR REPLACE FUNCTION auth_user_tenant_id()
RETURNS uuid AS $$
  SELECT tenant_id FROM users WHERE auth_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ---- tenants ------------------------------------------------
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select" ON tenants
  FOR SELECT USING (id = auth_user_tenant_id());

CREATE POLICY "tenant_update" ON tenants
  FOR UPDATE USING (id = auth_user_tenant_id());

-- ---- users --------------------------------------------------
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select" ON users
  FOR SELECT USING (tenant_id = auth_user_tenant_id());

CREATE POLICY "users_insert" ON users
  FOR INSERT WITH CHECK (tenant_id = auth_user_tenant_id());

CREATE POLICY "users_update" ON users
  FOR UPDATE USING (tenant_id = auth_user_tenant_id());

CREATE POLICY "users_delete" ON users
  FOR DELETE USING (tenant_id = auth_user_tenant_id());

-- ---- contacts -----------------------------------------------
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contacts_select" ON contacts
  FOR SELECT USING (tenant_id = auth_user_tenant_id());

CREATE POLICY "contacts_insert" ON contacts
  FOR INSERT WITH CHECK (tenant_id = auth_user_tenant_id());

CREATE POLICY "contacts_update" ON contacts
  FOR UPDATE USING (tenant_id = auth_user_tenant_id());

CREATE POLICY "contacts_delete" ON contacts
  FOR DELETE USING (tenant_id = auth_user_tenant_id());

-- ---- pipeline_stages ----------------------------------------
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stages_select" ON pipeline_stages
  FOR SELECT USING (tenant_id = auth_user_tenant_id());

CREATE POLICY "stages_insert" ON pipeline_stages
  FOR INSERT WITH CHECK (tenant_id = auth_user_tenant_id());

CREATE POLICY "stages_update" ON pipeline_stages
  FOR UPDATE USING (tenant_id = auth_user_tenant_id());

CREATE POLICY "stages_delete" ON pipeline_stages
  FOR DELETE USING (tenant_id = auth_user_tenant_id());

-- ---- deals --------------------------------------------------
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deals_select" ON deals
  FOR SELECT USING (tenant_id = auth_user_tenant_id());

CREATE POLICY "deals_insert" ON deals
  FOR INSERT WITH CHECK (tenant_id = auth_user_tenant_id());

CREATE POLICY "deals_update" ON deals
  FOR UPDATE USING (tenant_id = auth_user_tenant_id());

CREATE POLICY "deals_delete" ON deals
  FOR DELETE USING (tenant_id = auth_user_tenant_id());

-- ---- deal_activities ----------------------------------------
ALTER TABLE deal_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activities_select" ON deal_activities
  FOR SELECT USING (tenant_id = auth_user_tenant_id());

CREATE POLICY "activities_insert" ON deal_activities
  FOR INSERT WITH CHECK (tenant_id = auth_user_tenant_id());

-- ---- conversations ------------------------------------------
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversations_select" ON conversations
  FOR SELECT USING (tenant_id = auth_user_tenant_id());

CREATE POLICY "conversations_insert" ON conversations
  FOR INSERT WITH CHECK (tenant_id = auth_user_tenant_id());

CREATE POLICY "conversations_update" ON conversations
  FOR UPDATE USING (tenant_id = auth_user_tenant_id());

-- ---- messages -----------------------------------------------
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_select" ON messages
  FOR SELECT USING (tenant_id = auth_user_tenant_id());

CREATE POLICY "messages_insert" ON messages
  FOR INSERT WITH CHECK (tenant_id = auth_user_tenant_id());

CREATE POLICY "messages_update" ON messages
  FOR UPDATE USING (tenant_id = auth_user_tenant_id());

-- ---- proposals ----------------------------------------------
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "proposals_select" ON proposals
  FOR SELECT USING (tenant_id = auth_user_tenant_id());

CREATE POLICY "proposals_insert" ON proposals
  FOR INSERT WITH CHECK (tenant_id = auth_user_tenant_id());

CREATE POLICY "proposals_update" ON proposals
  FOR UPDATE USING (tenant_id = auth_user_tenant_id());

-- ---- contracts ----------------------------------------------
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contracts_select" ON contracts
  FOR SELECT USING (tenant_id = auth_user_tenant_id());

CREATE POLICY "contracts_insert" ON contracts
  FOR INSERT WITH CHECK (tenant_id = auth_user_tenant_id());

CREATE POLICY "contracts_update" ON contracts
  FOR UPDATE USING (tenant_id = auth_user_tenant_id());

-- ---- followup_templates -------------------------------------
ALTER TABLE followup_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "followup_tpl_select" ON followup_templates
  FOR SELECT USING (tenant_id = auth_user_tenant_id());

CREATE POLICY "followup_tpl_insert" ON followup_templates
  FOR INSERT WITH CHECK (tenant_id = auth_user_tenant_id());

CREATE POLICY "followup_tpl_update" ON followup_templates
  FOR UPDATE USING (tenant_id = auth_user_tenant_id());

CREATE POLICY "followup_tpl_delete" ON followup_templates
  FOR DELETE USING (tenant_id = auth_user_tenant_id());

-- ---- followup_queue -----------------------------------------
ALTER TABLE followup_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "followup_q_select" ON followup_queue
  FOR SELECT USING (tenant_id = auth_user_tenant_id());

CREATE POLICY "followup_q_insert" ON followup_queue
  FOR INSERT WITH CHECK (tenant_id = auth_user_tenant_id());

CREATE POLICY "followup_q_update" ON followup_queue
  FOR UPDATE USING (tenant_id = auth_user_tenant_id());

-- ---- whatsapp_templates -------------------------------------
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wa_tpl_select" ON whatsapp_templates
  FOR SELECT USING (tenant_id = auth_user_tenant_id());

CREATE POLICY "wa_tpl_insert" ON whatsapp_templates
  FOR INSERT WITH CHECK (tenant_id = auth_user_tenant_id());

CREATE POLICY "wa_tpl_update" ON whatsapp_templates
  FOR UPDATE USING (tenant_id = auth_user_tenant_id());
