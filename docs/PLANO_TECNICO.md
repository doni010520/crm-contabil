# PLANO TÉCNICO — CRM CONTÁBIL SaaS

Documento de Arquitetura e Especificação para Desenvolvimento.

## 1. VISÃO GERAL DO PRODUTO

### O que é

CRM SaaS multi-tenant especializado em escritórios de contabilidade, com foco em aquisição e conversão de clientes. Integra WhatsApp via Cloud API (CoEx), pipeline de vendas, geração de propostas, contratos digitais e dashboard.

### Dois níveis de uso

- **Nível 1 (Self-service):** contador usa o CRM manualmente. WhatsApp integrado pra receber e responder, pipeline, propostas, contratos, dashboard.
- **Nível 2 (Done for you):** tudo do nível 1 + SDR de IA automatizado no WhatsApp, campanhas configuradas, iscas montadas.

### Público-alvo

Escritórios de contabilidade brasileiros de todos os portes.

## 2. STACK TÉCNICA

### Frontend

- Next.js 14+ (App Router) — projeto inicializado com Next.js 16
- React 18+ + TypeScript
- Tailwind CSS
- Shadcn/UI (componentes base)

### Backend

- Next.js API Routes (endpoints da aplicação)
- n8n (orquestração de workflows: webhooks WhatsApp, enriquecimento CNPJ, automações de follow-up, SDR de IA no nível 2)

### Banco de Dados

- Supabase (PostgreSQL)
- Row Level Security (RLS) para isolamento multi-tenant
- Supabase Realtime para atualizações em tempo real (inbox, pipeline)

### WhatsApp

- WhatsApp Cloud API (Meta) com CoEx
- Webhook recebe mensagens → processa → exibe no CRM
- Envio via API REST da Meta
- Templates aprovados para mensagens fora da janela de 24h

### IA (Nível 2)

- GPT-4.1-mini (temp 0.3) para SDR conversacional
- GPT-4.1-mini para geração de propostas
- Orquestrado via n8n

### Integrações Externas

- API da Receita Federal / Casa dos Dados / Brasil API (enriquecimento de CNPJ)
- Meta Business Manager (WhatsApp Cloud API)

### Deploy

- Easypanel no VPS (aplicação Next.js + Supabase externo)
- n8n self-hosted no mesmo Easypanel

## 3. ARQUITETURA MULTI-TENANT

### Modelo

Single database, schema compartilhado, isolamento por `tenant_id` (UUID).
Cada tenant = 1 escritório de contabilidade.

### Isolamento

- Todas as tabelas principais possuem coluna `tenant_id`
- Supabase RLS policies em todas as tabelas
- Usuário autenticado só acessa dados do seu tenant
- Middleware de autenticação valida tenant em toda requisição

### Roles por tenant

- **owner:** dono do escritório, acesso total
- **admin:** gerente, acesso total exceto billing
- **user:** colaborador, acesso limitado (vê pipeline, conversa, mas não configura)

## 4. MODELO DE DADOS (POSTGRESQL/SUPABASE)

### Tabelas principais

```
tenants
├── id (UUID, PK)
├── name (texto — nome do escritório)
├── slug (texto, único — subdomínio ou identificador)
├── cnpj (texto)
├── phone (texto — número WhatsApp conectado)
├── whatsapp_phone_id (texto — phone_id da Cloud API)
├── whatsapp_token (texto, criptografado — token da Cloud API)
├── whatsapp_coex_enabled (boolean)
├── plan (enum: free, basic, pro)
├── settings (jsonb — configurações gerais)
├── created_at
├── updated_at

users
├── id (UUID, PK)
├── tenant_id (FK → tenants)
├── email
├── name
├── role (enum: owner, admin, user)
├── avatar_url
├── auth_id (FK → Supabase Auth)
├── created_at

contacts (leads e clientes)
├── id (UUID, PK)
├── tenant_id (FK → tenants)
├── name (texto)
├── phone (texto — número WhatsApp)
├── email (texto, opcional)
├── type (enum: lead, client)
├── cnpj (texto, opcional)
├── company_name (texto — razão social)
├── trade_name (texto — nome fantasia)
├── cnae_code (texto)
├── cnae_description (texto)
├── tax_regime (enum: simples, presumido, real, mei, unknown)
├── company_size (enum: mei, me, epp, medium, large, unknown)
├── state (texto)
├── city (texto)
├── address (texto)
├── founding_date (date)
├── has_branches (boolean)
├── monthly_revenue (decimal, opcional — informado pelo lead)
├── employee_count (integer, opcional)
├── monthly_invoices (integer, opcional — qtd notas/mês)
├── niche (texto — saúde, food service, e-commerce, tecnologia, etc.)
├── source (enum: google_ads, meta_ads, referral, organic, manual)
├── tags (text[])
├── notes (texto)
├── enriched_at (timestamp — quando CNPJ foi enriquecido)
├── created_at
├── updated_at

pipeline_stages
├── id (UUID, PK)
├── tenant_id (FK → tenants)
├── name (texto)
├── position (integer — ordem no kanban)
├── color (texto — cor do estágio)
├── is_default (boolean)
├── auto_reminder_days (integer, nullable — dias sem atividade pra lembrete)
├── created_at

deals (oportunidades no pipeline)
├── id (UUID, PK)
├── tenant_id (FK → tenants)
├── contact_id (FK → contacts)
├── stage_id (FK → pipeline_stages)
├── assigned_to (FK → users, nullable)
├── title (texto)
├── value (decimal — valor estimado do deal)
├── expected_close_date (date, nullable)
├── lost_reason (texto, nullable)
├── won_at (timestamp, nullable)
├── lost_at (timestamp, nullable)
├── created_at
├── updated_at

deal_activities (histórico do deal)
├── id (UUID, PK)
├── tenant_id (FK → tenants)
├── deal_id (FK → deals)
├── user_id (FK → users, nullable — null se automático)
├── type (enum: stage_change, note, reminder, call, meeting, email, whatsapp, proposal_sent, contract_sent, auto_followup)
├── description (texto)
├── metadata (jsonb — dados extras)
├── created_at

conversations (conversas WhatsApp)
├── id (UUID, PK)
├── tenant_id (FK → tenants)
├── contact_id (FK → contacts)
├── whatsapp_conversation_id (texto — ID da conversa na Meta)
├── status (enum: open, closed)
├── last_message_at (timestamp)
├── unread_count (integer)
├── assigned_to (FK → users, nullable)
├── created_at
├── updated_at

messages
├── id (UUID, PK)
├── tenant_id (FK → tenants)
├── conversation_id (FK → conversations)
├── whatsapp_message_id (texto — wamid da Meta)
├── direction (enum: inbound, outbound)
├── sender_type (enum: contact, user, bot)
├── sender_id (texto — user_id ou 'bot')
├── type (enum: text, image, document, audio, video, template, interactive)
├── content (texto — corpo da mensagem)
├── media_url (texto, nullable)
├── media_mime_type (texto, nullable)
├── status (enum: sent, delivered, read, failed)
├── metadata (jsonb — payload completo da Meta)
├── created_at

proposals
├── id (UUID, PK)
├── tenant_id (FK → tenants)
├── deal_id (FK → deals)
├── contact_id (FK → contacts)
├── packages (jsonb — array com os 3 pacotes)
├── selected_package (texto, nullable — qual pacote o cliente escolheu)
├── valid_until (date)
├── status (enum: draft, sent, viewed, accepted, rejected, expired)
├── sent_at (timestamp, nullable)
├── viewed_at (timestamp, nullable)
├── responded_at (timestamp, nullable)
├── notes (texto, nullable)
├── created_at
├── updated_at

contracts
├── id (UUID, PK)
├── tenant_id (FK → tenants)
├── proposal_id (FK → proposals)
├── deal_id (FK → deals)
├── contact_id (FK → contacts)
├── content (texto — HTML do contrato)
├── status (enum: draft, sent, signed, cancelled)
├── signed_at (timestamp, nullable)
├── signature_data (jsonb — dados da assinatura)
├── sent_at (timestamp, nullable)
├── created_at
├── updated_at

followup_templates
├── id (UUID, PK)
├── tenant_id (FK → tenants)
├── stage_id (FK → pipeline_stages — em qual estágio esse template se aplica)
├── name (texto)
├── message (texto — com variáveis tipo {{contact_name}}, {{company_name}})
├── delay_days (integer — dias após entrar no estágio)
├── channel (enum: whatsapp, email)
├── is_active (boolean)
├── created_at

followup_queue (follow-ups agendados)
├── id (UUID, PK)
├── tenant_id (FK → tenants)
├── deal_id (FK → deals)
├── contact_id (FK → contacts)
├── template_id (FK → followup_templates)
├── scheduled_for (timestamp)
├── status (enum: pending, sent, cancelled, failed)
├── sent_at (timestamp, nullable)
├── created_at

whatsapp_templates (templates aprovados na Meta)
├── id (UUID, PK)
├── tenant_id (FK → tenants)
├── meta_template_name (texto — nome no Meta Business Manager)
├── category (enum: marketing, utility, authentication)
├── language (texto — pt_BR)
├── content (texto — corpo do template)
├── variables (text[] — variáveis do template)
├── status (enum: pending, approved, rejected)
├── created_at
```

### Estágios padrão do pipeline (seed data)

Criados automaticamente quando um novo tenant se cadastra:

1. Lead Novo (cor: azul)
2. Enriquecido (cor: azul claro) — CNPJ consultado
3. Qualificado (cor: amarelo) — dados coletados
4. Diagnóstico Agendado (cor: laranja)
5. Diagnóstico Realizado (cor: laranja escuro)
6. Proposta Enviada (cor: roxo)
7. Follow-up (cor: rosa) — auto_reminder: 5 dias
8. Negociação (cor: vermelho)
9. Contrato Assinado (cor: verde) — won
10. Perdido (cor: cinza) — lost

### Templates de follow-up padrão (seed data)

- **Estágio "Proposta Enviada", delay 3 dias:** "Olá {{contact_name}}, enviei a proposta para {{company_name}} há alguns dias. Conseguiu analisar? Fico à disposição pra tirar qualquer dúvida."
- **Estágio "Proposta Enviada", delay 7 dias:** "{{contact_name}}, tudo bem? Só passando pra saber se surgiu alguma dúvida sobre nossa proposta. Posso te ligar pra explicar melhor?"
- **Estágio "Follow-up", delay 5 dias:** "{{contact_name}}, entendo que o momento pode não ser o ideal. Fico à disposição quando quiser retomar. Enquanto isso, preparei um material sobre economia tributária pra empresas do seu setor. Posso enviar?"
- **Estágio "Follow-up", delay 15 dias:** "{{contact_name}}, passando pra dar um último oi. Se precisar de contabilidade no futuro, estamos aqui. Boa sorte com os negócios!"
- **Estágio "Diagnóstico Agendado", delay 1 dia:** "Olá {{contact_name}}, confirmando nosso diagnóstico tributário amanhã. Vai ser uma conversa de 30 minutos onde vamos analisar a situação fiscal da {{company_name}}. Pode confirmar?"

## 5. PÁGINAS E FUNCIONALIDADES DO FRONTEND

### Autenticação

- Login / Registro (Supabase Auth)
- Criar tenant (onboarding do escritório)
- Convidar usuários (por email, com role)

### Dashboard (`/dashboard`)

- Cards: leads este mês, reuniões agendadas, propostas enviadas, contratos assinados
- Gráfico: funil de conversão (quantos em cada estágio)
- Gráfico: leads por fonte (Google Ads, Meta, indicação, orgânico)
- Gráfico: leads por nicho
- Tabela: leads com lembrete de follow-up pendente
- Filtro por período (7d, 30d, 90d, personalizado)

### Pipeline (`/pipeline`)

- Kanban drag-and-drop com os estágios
- Card do deal mostra: nome do contato, empresa, valor, dias no estágio, regime tributário, nicho
- Indicador visual de alerta quando deal está parado há mais de X dias
- Clicar no card abre drawer lateral com detalhes do deal, histórico de atividades, conversa WhatsApp, e ações rápidas (mover estágio, criar nota, agendar, gerar proposta)
- Filtros: por responsável, por nicho, por regime, por fonte

### Inbox WhatsApp (`/inbox`)

- Lista de conversas à esquerda (ordenada por última mensagem)
- Painel de conversa à direita (estilo chat)
- Indicador de não lidas
- Botão de enviar texto, mídia, template
- Botão de criar deal a partir da conversa (se ainda não existe)
- Info do contato no header (nome, empresa, CNPJ, regime)
- Botão de atribuir conversa a um usuário

### Contatos (`/contacts`)

- Tabela com todos os contatos (leads + clientes)
- Filtros: tipo, nicho, regime tributário, fonte, tags
- Busca por nome, empresa, CNPJ
- Clicar abre ficha completa com todos os dados enriquecidos
- Botão de enriquecer CNPJ (manual)
- Histórico de deals e conversas do contato

### Propostas (`/proposals`)

- Lista de propostas com status (rascunho, enviada, aceita, rejeitada)
- Criar proposta: seleciona deal → formulário com 3 pacotes pré-preenchidos (serviços contábeis) → edita preços e serviços → visualiza preview → envia por WhatsApp ou email
- Preview visual da proposta (HTML renderizado, exportável em PDF)
- Tracking: quando foi vista, quando foi respondida

### Contratos (`/contracts`)

- Lista de contratos com status
- Gerar contrato a partir de proposta aceita
- Template de contrato de prestação de serviços contábeis pré-configurado com variáveis (razão social, CNPJ, serviços contratados, valor, vigência)
- Assinatura digital (canvas de assinatura ou integração com serviço externo)
- Download em PDF

### Configurações (`/settings`)

- Dados do escritório (nome, CNPJ, logo, cores)
- Conexão WhatsApp (instruções de setup Cloud API, phone_id, token)
- Pipeline (editar estágios, cores, ordem, lembretes)
- Templates de follow-up (criar, editar, ativar/desativar)
- Pacotes de proposta (definir serviços padrão e preços base)
- Template de contrato (editar texto padrão)
- Usuários (convidar, remover, trocar role)
- Plano e billing

## 6. FLUXOS PRINCIPAIS

### Fluxo 1: Lead chega pelo WhatsApp

1. Lead envia mensagem pro número do escritório
2. Meta Cloud API envia webhook POST → endpoint do CRM
3. CRM verifica se contact existe (pelo phone)
   - Se não existe: cria contact + conversation + deal no estágio "Lead Novo"
   - Se existe: abre/atualiza conversation
4. Mensagem aparece no Inbox em tempo real (Supabase Realtime)
5. Notificação visual (badge) no menu do CRM
6. Contador responde pelo Inbox do CRM ou pelo celular (CoEx)

### Fluxo 2: Enriquecimento de CNPJ

1. Lead informa CNPJ na conversa ou contador insere manualmente
2. CRM dispara request pra Brasil API / Casa dos Dados
3. Retorno preenche automaticamente: razão social, CNAE, regime, porte, endereço, data de abertura, filiais
4. Deal move automaticamente pra estágio "Enriquecido"
5. Atividade registrada no histórico

### Fluxo 3: Geração de proposta

1. Contador clica "Gerar Proposta" no deal
2. CRM pré-preenche com dados do contato (empresa, regime, CNAE)
3. Exibe 3 pacotes com serviços pré-configurados
4. Contador ajusta preços e serviços se necessário
5. Preview visual → confirma → proposta salva como "rascunho"
6. Envia por WhatsApp (mensagem com link pra visualizar) ou gera PDF
7. Deal move pra "Proposta Enviada"
8. Tracking: quando o link foi aberto (viewed_at)

### Fluxo 4: Follow-up automatizado

1. Deal entra num estágio com templates de follow-up configurados
2. Sistema cria entrada na followup_queue com `scheduled_for = now + delay_days`
3. n8n (cron job) verifica a cada hora: tem follow-up pendente?
4. Se sim: envia mensagem via Cloud API (template aprovado se fora da janela de 24h, ou texto livre se dentro)
5. Registra atividade no deal
6. Se deal muda de estágio, cancela follow-ups pendentes do estágio anterior

### Fluxo 5: Contrato

1. Proposta aceita → botão "Gerar Contrato"
2. CRM preenche template de contrato com dados do contato + pacote selecionado
3. Contador revisa e envia por WhatsApp (link pra visualizar e assinar)
4. Cliente assina digitalmente (canvas)
5. Contrato salvo como PDF, status "signed"
6. Deal move pra "Contrato Assinado" automaticamente

### Fluxo 6: Dashboard atualiza em tempo real

1. Cada mudança de estágio, novo lead, proposta enviada → atualiza métricas
2. Dashboard consulta views agregadas no Supabase
3. Filtros de período e drill-down por nicho, fonte, regime

## 7. WEBHOOK DO WHATSAPP (CLOUD API)

### Endpoint

`POST /api/webhooks/whatsapp`

### Verificação (GET)

Meta envia GET com `hub.mode`, `hub.verify_token` e `hub.challenge`. Retornar `hub.challenge` se `verify_token` bater.

### Processamento (POST)

1. Recebe payload da Meta
2. Extrai: `phone_number_id` → identifica tenant
3. Extrai: mensagem (`from`, `type`, `text/media`, `timestamp`, `wamid`)
4. Busca ou cria contact pelo número
5. Busca ou cria conversation
6. Salva message no banco
7. Se contact é novo → cria deal no pipeline
8. Broadcast via Supabase Realtime → inbox atualiza
9. Retorna 200 OK imediatamente

### Status updates

Meta também envia status (sent, delivered, read). Atualizar coluna `status` na tabela messages.

### Multi-tenant routing

O `phone_number_id` no payload identifica qual tenant recebeu. Query: `SELECT * FROM tenants WHERE whatsapp_phone_id = ?`.

## 8. ENVIO DE MENSAGENS

### Dentro da janela de 24h (texto livre)

```
POST https://graph.facebook.com/v21.0/{phone_id}/messages
Headers: Authorization: Bearer {token}
Body: {
  messaging_product: "whatsapp",
  to: "5511999999999",
  type: "text",
  text: { body: "Mensagem aqui" }
}
```

### Fora da janela de 24h (template)

```
POST https://graph.facebook.com/v21.0/{phone_id}/messages
Body: {
  messaging_product: "whatsapp",
  to: "5511999999999",
  type: "template",
  template: {
    name: "followup_proposta",
    language: { code: "pt_BR" },
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: "João" },
          { type: "text", text: "Clínica Saúde Total" }
        ]
      }
    ]
  }
}
```

### Lógica de decisão

Antes de enviar, verificar `last_message_at` da conversation:

- Se < 24h atrás → envia texto livre
- Se > 24h atrás → envia template aprovado

## 9. ENRIQUECIMENTO DE CNPJ

### Endpoint interno

`POST /api/contacts/:id/enrich`

### Fluxo

1. Recebe CNPJ do contato
2. Chama Brasil API (`https://brasilapi.com.br/api/cnpj/v1/{cnpj}`)
3. Fallback: Casa dos Dados ou ReceitaWS
4. Mapeia retorno:
   - razão_social → company_name
   - nome_fantasia → trade_name
   - cnae_fiscal → cnae_code + cnae_description
   - opcao_pelo_simples → tax_regime
   - porte → company_size
   - uf + municipio → state + city
   - data_inicio_atividade → founding_date
   - cnaes_secundarios → metadata
5. Atualiza contact no banco
6. Marca `enriched_at = now()`
7. Se deal existe, move pra "Enriquecido"

## 10. n8n WORKFLOWS

### Workflow 1: Follow-up automático

- **Trigger:** Schedule (a cada 1 hora)
- **Ação:** Query followup_queue WHERE status = 'pending' AND scheduled_for <= now()
- Para cada: verifica janela 24h → envia via Cloud API (texto livre ou template) → atualiza status → registra deal_activity

### Workflow 2: Lembrete de deal parado

- **Trigger:** Schedule (diário, 8h)
- **Ação:** Query deals onde updated_at < now() - auto_reminder_days do estágio
- Para cada: envia notificação interna (email ou push) pro assigned_to

### Workflow 3: SDR de IA (somente Nível 2)

- **Trigger:** Webhook (nova mensagem inbound de lead não qualificado)
- **Ação:** Monta contexto (dados do contato + histórico da conversa) → GPT-4.1-mini com system prompt de SDR contábil → responde via Cloud API → se qualificado, move deal pra "Qualificado"

### Workflow 4: Geração de proposta com IA (somente Nível 2)

- **Trigger:** Webhook interno (deal movido pra "Qualificado" + todos os dados preenchidos)
- **Ação:** GPT-4.1-mini gera proposta com 3 pacotes personalizados → salva na tabela proposals → notifica contador

## 11. DEPLOY (EASYPANEL)

### Serviços

1. **crm-app** — Next.js (container Docker)
   - Variáveis: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`, `WHATSAPP_VERIFY_TOKEN`, `ENCRYPTION_KEY`
   - Porta: 3000
   - Domínio: crm.benitechlab.com (ou white-label por tenant)

2. **n8n** — já rodando no Easypanel
   - Conecta no mesmo Supabase
   - Workflows de follow-up, lembretes, SDR

3. **Supabase** — externo (supabase.com) ou self-hosted
   - Banco PostgreSQL
   - Auth
   - Realtime
   - Storage (pra mídia do WhatsApp, PDFs de propostas/contratos)

## 12. FASES DE DESENVOLVIMENTO

### Fase 1 — Base (MVP)

- Setup do projeto Next.js + Supabase
- Autenticação (login, registro, criação de tenant)
- Schema do banco (todas as tabelas, RLS policies)
- Seed data (estágios padrão, templates de follow-up)
- Página de contatos (CRUD básico)
- Enriquecimento de CNPJ

### Fase 2 — Pipeline

- Kanban drag-and-drop
- Drawer do deal com detalhes e histórico
- Atividades (notas, mudanças de estágio)
- Filtros

### Fase 3 — WhatsApp

- Webhook endpoint (receber mensagens)
- Envio de mensagens (texto livre + templates)
- Inbox com lista de conversas e chat
- Criação automática de contact + deal ao receber mensagem nova
- Multi-tenant routing por phone_number_id
- Supabase Realtime pra atualização instantânea

### Fase 4 — Propostas

- Gerador de propostas (3 pacotes)
- Pacotes pré-configurados com serviços contábeis
- Preview visual + PDF
- Envio por WhatsApp
- Tracking (visualização)

### Fase 5 — Contratos

- Template de contrato contábil
- Preenchimento automático com dados da proposta
- Canvas de assinatura digital
- Geração de PDF
- Envio por WhatsApp

### Fase 6 — Follow-up e Automações

- followup_queue e lógica de agendamento
- n8n workflow de disparo
- Lógica de janela 24h (texto livre vs template)
- Lembretes de deal parado
- Cancelamento de follow-up ao mudar estágio

### Fase 7 — Dashboard

- Métricas agregadas
- Gráficos (funil, por fonte, por nicho)
- Filtros de período
- Lista de follow-ups pendentes

### Fase 8 — Configurações

- Edição de pipeline
- Edição de templates de follow-up
- Edição de pacotes de proposta
- Edição de template de contrato
- Gestão de usuários
- Conexão WhatsApp (setup)

### Fase 9 — Nível 2 (SDR de IA)

- System prompt de SDR contábil
- n8n workflow de conversação automatizada
- Lógica de qualificação automática
- Geração de proposta com IA
- Toggle por tenant (nível 1 vs nível 2)

## 13. CONSIDERAÇÕES IMPORTANTES

### Segurança

- Tokens do WhatsApp criptografados no banco (`ENCRYPTION_KEY`)
- RLS em todas as tabelas
- Validação de webhook (verificar que veio da Meta)
- Rate limiting nos endpoints públicos
- LGPD: consentimento do lead registrado, opt-out funcional

### Performance

- Índices no banco: `tenant_id` em todas as tabelas, `phone` em contacts, `whatsapp_phone_id` em tenants, `scheduled_for` em followup_queue
- Webhook retorna 200 imediatamente e processa async
- Paginação em todas as listas
- Supabase Realtime somente nas tabelas necessárias (messages, deals)

### WhatsApp Cloud API — Limites

- Tier 1: 1.000 conversas/dia (inicial)
- Sobe com qualidade da conta
- 1.000 service conversations grátis/mês
- Templates precisam ser aprovados (24-48h)
- Janela de 24h pra texto livre

### Nomes e nomenclatura no código

- Inglês no código (variáveis, funções, componentes)
- Português na interface (labels, textos, placeholders)
- camelCase pra variáveis JS/TS
- snake_case pra colunas no banco
