-- ============================================================
-- Migration 0013 — Copywriter
-- ============================================================
-- Cria as tabelas para a ferramenta de geração de copy especializada:
--   * escritorio_profile: perfil persistente (1 por tenant)
--   * copy_generations:   histórico de gerações (auditoria + reuso)
--   * copy_credits:       saldo de créditos por tenant (cobrança)
-- ============================================================

-- ------------------------------------------------------------
-- Tabela: escritorio_profile
-- Um registro por tenant. Alimenta todas as gerações de copy.
-- ------------------------------------------------------------
create table public.escritorio_profile (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,

  -- Bloco 1 — Identidade
  nome text not null,
  cidade text not null,
  bairro_principal text,
  atende_remoto boolean not null default false,
  estado_atuacao text not null,
  crc_uf text not null,
  crc_numero text not null,
  anos_mercado integer not null default 0,
  faixa_clientes text not null check (faixa_clientes in ('1-50','50-200','200-500','500+')),

  -- Bloco 2 — Posicionamento
  nichos text[] not null default '{}',
  servicos text[] not null default '{}',
  modelo_preco text not null check (modelo_preco in ('transparente','faixa-por-porte','sob-consulta')),
  preco_inicial_mensal numeric(10,2),

  -- Bloco 3 — Diferencial e cliente (JSONB para flexibilidade)
  diferenciais text[] not null default '{}',
  persona text not null default '',
  dores_principais text[] not null default '{}',
  cases jsonb not null default '[]'::jsonb,

  -- Bloco 4 — Conversão
  tom_de_voz text not null check (tom_de_voz in ('formal-consultivo','proximo-direto','informal-tecnologico')),
  cta_primario text not null check (cta_primario in ('diagnostico-gratuito','falar-especialista','solicitar-proposta','abrir-empresa','simular-economia')),
  whatsapp text,
  link_google_meu_negocio text,
  selos text[] not null default '{}',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Exatamente um perfil por tenant
  unique (tenant_id)
);

create index idx_escritorio_profile_tenant on public.escritorio_profile(tenant_id);

-- ------------------------------------------------------------
-- Tabela: copy_generations
-- Histórico de cada geração de copy. Permite reuso (não regenerar
-- se já existe igual recente) e auditoria de consumo de créditos.
-- ------------------------------------------------------------
create table public.copy_generations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,

  modo text not null check (modo in (
    'site-home','site-lp-nicho','site-servico','google-ads','meta-ads'
  )),

  -- Snapshot do perfil no momento da geração (auditoria)
  escritorio_snapshot jsonb not null,
  -- Parâmetros específicos do modo
  params jsonb not null,
  -- Output gerado
  output jsonb not null,

  creditos_consumidos integer not null,
  tokens_input integer not null default 0,
  tokens_output integer not null default 0,
  modelo_ia text not null,
  avisos jsonb not null default '[]'::jsonb,

  created_at timestamptz not null default now()
);

create index idx_copy_generations_tenant on public.copy_generations(tenant_id);
create index idx_copy_generations_modo on public.copy_generations(modo);
create index idx_copy_generations_created on public.copy_generations(created_at desc);

-- ------------------------------------------------------------
-- Tabela: copy_credits
-- Saldo de créditos por tenant. Recarregado via Stripe webhook
-- ou ajuste manual de admin.
-- ------------------------------------------------------------
create table public.copy_credits (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,

  saldo integer not null default 0,
  plano text not null default 'free' check (plano in ('free','starter','pro','agencia')),
  creditos_mensais integer not null default 0,
  reset_em timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (tenant_id)
);

create index idx_copy_credits_tenant on public.copy_credits(tenant_id);

-- ------------------------------------------------------------
-- Trigger: atualiza updated_at
-- ------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_escritorio_profile_updated
  before update on public.escritorio_profile
  for each row execute function public.touch_updated_at();

create trigger trg_copy_credits_updated
  before update on public.copy_credits
  for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------
-- RLS policies — isolamento multi-tenant
-- ------------------------------------------------------------
alter table public.escritorio_profile enable row level security;
alter table public.copy_generations enable row level security;
alter table public.copy_credits enable row level security;

-- Helper: tenant_id do usuário autenticado
-- (Reutiliza function existente do projeto — current_user_tenant_id())

create policy "escritorio_profile_select_own_tenant"
  on public.escritorio_profile for select
  using (tenant_id = (select tenant_id from public.users where auth_id = auth.uid()));

create policy "escritorio_profile_insert_own_tenant"
  on public.escritorio_profile for insert
  with check (tenant_id = (select tenant_id from public.users where auth_id = auth.uid()));

create policy "escritorio_profile_update_own_tenant"
  on public.escritorio_profile for update
  using (tenant_id = (select tenant_id from public.users where auth_id = auth.uid()));

create policy "copy_generations_select_own_tenant"
  on public.copy_generations for select
  using (tenant_id = (select tenant_id from public.users where auth_id = auth.uid()));

create policy "copy_generations_insert_own_tenant"
  on public.copy_generations for insert
  with check (tenant_id = (select tenant_id from public.users where auth_id = auth.uid()));

create policy "copy_credits_select_own_tenant"
  on public.copy_credits for select
  using (tenant_id = (select tenant_id from public.users where auth_id = auth.uid()));

-- Inserção/atualização de créditos só via service role (backend)
-- (sem policy de insert/update para usuário autenticado direto)

-- ------------------------------------------------------------
-- Function: consumir créditos atomicamente
-- ------------------------------------------------------------
create or replace function public.consume_copy_credits(
  p_tenant_id uuid,
  p_amount integer
) returns boolean
language plpgsql security definer as $$
declare
  v_saldo integer;
begin
  select saldo into v_saldo
  from public.copy_credits
  where tenant_id = p_tenant_id
  for update;

  if v_saldo is null or v_saldo < p_amount then
    return false;
  end if;

  update public.copy_credits
  set saldo = saldo - p_amount,
      updated_at = now()
  where tenant_id = p_tenant_id;

  return true;
end;
$$;

grant execute on function public.consume_copy_credits to authenticated;
