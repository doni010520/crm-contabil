-- ============================================================
-- Índices de performance
-- ============================================================

-- tenant_id em todas as tabelas (queries mais frequentes)
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

-- Lookup de tenant pelo WhatsApp phone_id (webhook routing)
CREATE INDEX idx_tenants_whatsapp_phone ON tenants(whatsapp_phone_id) WHERE whatsapp_phone_id IS NOT NULL;

-- Lookup de contato pelo telefone (webhook: quem mandou mensagem?)
CREATE INDEX idx_contacts_phone ON contacts(tenant_id, phone) WHERE phone IS NOT NULL;

-- Lookup de contato pelo CNPJ
CREATE INDEX idx_contacts_cnpj ON contacts(tenant_id, cnpj) WHERE cnpj IS NOT NULL;

-- Pipeline: deals por estágio (kanban)
CREATE INDEX idx_deals_stage ON deals(tenant_id, stage_id);

-- Pipeline: deals por responsável
CREATE INDEX idx_deals_assigned ON deals(tenant_id, assigned_to) WHERE assigned_to IS NOT NULL;

-- Inbox: conversas ordenadas por última mensagem
CREATE INDEX idx_conversations_last_msg ON conversations(tenant_id, last_message_at DESC);

-- Inbox: mensagens por conversa (ordenadas por data)
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);

-- Follow-up: próximos a disparar (query do n8n cron)
CREATE INDEX idx_followup_pending ON followup_queue(scheduled_for)
  WHERE status = 'pending';

-- Deal activities: histórico por deal
CREATE INDEX idx_activities_deal ON deal_activities(deal_id, created_at DESC);

-- Proposals por deal
CREATE INDEX idx_proposals_deal ON proposals(deal_id);

-- Users: lookup por auth_id (login)
CREATE INDEX idx_users_auth ON users(auth_id) WHERE auth_id IS NOT NULL;

-- Pipeline stages: ordenação
CREATE INDEX idx_stages_position ON pipeline_stages(tenant_id, position);
