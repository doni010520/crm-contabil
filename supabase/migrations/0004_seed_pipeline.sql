-- ============================================================
-- Seed: função para criar estágios e templates padrão ao criar tenant
-- ============================================================
-- Chamada automaticamente via trigger ao inserir novo tenant.
-- Também pode ser chamada manualmente: SELECT seed_tenant_defaults('tenant-uuid');
-- ============================================================

CREATE OR REPLACE FUNCTION seed_tenant_defaults(p_tenant_id uuid)
RETURNS void AS $$
DECLARE
  stage_lead_novo uuid;
  stage_enriquecido uuid;
  stage_qualificado uuid;
  stage_diag_agendado uuid;
  stage_diag_realizado uuid;
  stage_proposta uuid;
  stage_followup uuid;
  stage_negociacao uuid;
  stage_ganho uuid;
  stage_perdido uuid;
BEGIN
  -- Estágios do pipeline
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

  -- Buscar IDs dos estágios criados
  SELECT id INTO stage_proposta   FROM pipeline_stages WHERE tenant_id = p_tenant_id AND name = 'Proposta Enviada';
  SELECT id INTO stage_followup   FROM pipeline_stages WHERE tenant_id = p_tenant_id AND name = 'Follow-up';
  SELECT id INTO stage_diag_agendado FROM pipeline_stages WHERE tenant_id = p_tenant_id AND name = 'Diagnóstico Agendado';

  -- Templates de follow-up padrão
  INSERT INTO followup_templates (tenant_id, stage_id, name, message, delay_days, channel) VALUES
    (
      p_tenant_id, stage_proposta,
      'Proposta — 3 dias',
      'Olá {{contact_name}}, enviei a proposta para {{company_name}} há alguns dias. Conseguiu analisar? Fico à disposição pra tirar qualquer dúvida.',
      3, 'whatsapp'
    ),
    (
      p_tenant_id, stage_proposta,
      'Proposta — 7 dias',
      '{{contact_name}}, tudo bem? Só passando pra saber se surgiu alguma dúvida sobre nossa proposta. Posso te ligar pra explicar melhor?',
      7, 'whatsapp'
    ),
    (
      p_tenant_id, stage_followup,
      'Follow-up — 5 dias',
      '{{contact_name}}, entendo que o momento pode não ser o ideal. Fico à disposição quando quiser retomar. Enquanto isso, preparei um material sobre economia tributária pra empresas do seu setor. Posso enviar?',
      5, 'whatsapp'
    ),
    (
      p_tenant_id, stage_followup,
      'Follow-up — 15 dias (último contato)',
      '{{contact_name}}, passando pra dar um último oi. Se precisar de contabilidade no futuro, estamos aqui. Boa sorte com os negócios!',
      15, 'whatsapp'
    ),
    (
      p_tenant_id, stage_diag_agendado,
      'Confirmação de diagnóstico',
      'Olá {{contact_name}}, confirmando nosso diagnóstico tributário amanhã. Vai ser uma conversa de 30 minutos onde vamos analisar a situação fiscal da {{company_name}}. Pode confirmar?',
      1, 'whatsapp'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: auto-seed ao criar tenant
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
