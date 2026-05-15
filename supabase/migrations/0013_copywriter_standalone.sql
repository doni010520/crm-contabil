-- ============================================================
-- Migration 0013 — Copywriter (Standalone)
-- ============================================================
-- O Copywriter é um produto independente do CRM. Ele compartilha
-- apenas a auth do Supabase (auth.users), mas tem suas próprias
-- contas, perfis, gerações e créditos. NÃO depende de tenants/users
-- do CRM. Um usuário pode ter conta no Copywriter sem nunca ter
-- usado o CRM.
-- ============================================================

-- ------------------------------------------------------------
-- Tabela: copywriter_accounts
-- Uma conta por usuário. Vinculada à auth.users via auth_id.
-- ------------------------------------------------------------
create table public.copywriter_accounts (
  id uuid primary key default gen_random_uuid(),
  auth_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null,
  nome text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_copywriter_accounts_auth on public.copywriter_accounts(auth_id);

-- ------------------------------------------------------------
-- Tabela: copywriter_profile
-- Perfil do escritório (1 por account).
-- ------------------------------------------------------------
create table public.copywriter_profile (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null unique references public.copywriter_accounts(id) on delete cascade,

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

  -- Bloco 3 — Diferencial e cliente
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
  updated_at timestamptz not null default now()
);

create index idx_copywriter_profile_account on public.copywriter_profile(account_id);

-- ------------------------------------------------------------
-- Tabela: copywriter_generations
-- ------------------------------------------------------------
create table public.copywriter_generations (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.copywriter_accounts(id) on delete cascade,

  modo text not null check (modo in (
    'site-home','site-lp-nicho','site-servico','google-ads','meta-ads'
  )),
  escritorio_snapshot jsonb not null,
  params jsonb not null,
  output jsonb not null,

  creditos_consumidos integer not null,
  tokens_input integer not null default 0,
  tokens_output integer not null default 0,
  modelo_ia text not null,
  avisos jsonb not null default '[]'::jsonb,

  created_at timestamptz not null default now()
);

create index idx_copywriter_generations_account on public.copywriter_generations(account_id);
create index idx_copywriter_generations_modo on public.copywriter_generations(modo);
create index idx_copywriter_generations_created on public.copywriter_generations(created_at desc);

-- ------------------------------------------------------------
-- Tabela: copywriter_credits
-- Saldo de créditos por account.
-- ------------------------------------------------------------
create table public.copywriter_credits (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null unique references public.copywriter_accounts(id) on delete cascade,

  saldo integer not null default 5, -- 5 créditos grátis no signup (trial)
  plano text not null default 'trial' check (plano in ('trial','starter','pro','agencia')),
  creditos_mensais integer not null default 0,
  reset_em timestamptz,

  -- Stripe (preenchido quando virar cliente pagante)
  stripe_customer_id text,
  stripe_subscription_id text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_copywriter_credits_account on public.copywriter_credits(account_id);

-- ------------------------------------------------------------
-- Trigger touch updated_at (reutiliza function existente do CRM)
-- ------------------------------------------------------------
create trigger trg_copywriter_accounts_updated
  before update on public.copywriter_accounts
  for each row execute function public.touch_updated_at();

create trigger trg_copywriter_profile_updated
  before update on public.copywriter_profile
  for each row execute function public.touch_updated_at();

create trigger trg_copywriter_credits_updated
  before update on public.copywriter_credits
  for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------
-- RLS — isolamento por account_id (via auth.uid())
-- ------------------------------------------------------------
alter table public.copywriter_accounts enable row level security;
alter table public.copywriter_profile enable row level security;
alter table public.copywriter_generations enable row level security;
alter table public.copywriter_credits enable row level security;

-- account
create policy "copywriter_accounts_select_own"
  on public.copywriter_accounts for select
  using (auth_id = auth.uid());

create policy "copywriter_accounts_update_own"
  on public.copywriter_accounts for update
  using (auth_id = auth.uid());

-- profile
create policy "copywriter_profile_select_own"
  on public.copywriter_profile for select
  using (account_id in (select id from public.copywriter_accounts where auth_id = auth.uid()));

create policy "copywriter_profile_insert_own"
  on public.copywriter_profile for insert
  with check (account_id in (select id from public.copywriter_accounts where auth_id = auth.uid()));

create policy "copywriter_profile_update_own"
  on public.copywriter_profile for update
  using (account_id in (select id from public.copywriter_accounts where auth_id = auth.uid()));

-- generations
create policy "copywriter_generations_select_own"
  on public.copywriter_generations for select
  using (account_id in (select id from public.copywriter_accounts where auth_id = auth.uid()));

create policy "copywriter_generations_insert_own"
  on public.copywriter_generations for insert
  with check (account_id in (select id from public.copywriter_accounts where auth_id = auth.uid()));

-- credits (apenas leitura para o usuário; insert/update só via service role)
create policy "copywriter_credits_select_own"
  on public.copywriter_credits for select
  using (account_id in (select id from public.copywriter_accounts where auth_id = auth.uid()));

-- ------------------------------------------------------------
-- Function: signup — cria account + credits trial atomicamente
-- ------------------------------------------------------------
create or replace function public.create_copywriter_account(
  p_email text,
  p_nome text default null
) returns uuid
language plpgsql security definer as $$
declare
  v_account_id uuid;
begin
  -- O Supabase trigger ja deve ter criado auth.users com auth.uid()
  -- atual. Inserimos account + credits trial.
  insert into public.copywriter_accounts (auth_id, email, nome)
  values (auth.uid(), p_email, p_nome)
  returning id into v_account_id;

  insert into public.copywriter_credits (account_id, saldo, plano, creditos_mensais)
  values (v_account_id, 5, 'trial', 0);

  return v_account_id;
end;
$$;

grant execute on function public.create_copywriter_account to authenticated;

-- ------------------------------------------------------------
-- Function: consumir créditos atomicamente
-- ------------------------------------------------------------
create or replace function public.consume_copywriter_credits(
  p_amount integer
) returns boolean
language plpgsql security definer as $$
declare
  v_account_id uuid;
  v_saldo integer;
begin
  select id into v_account_id
  from public.copywriter_accounts
  where auth_id = auth.uid();

  if v_account_id is null then
    return false;
  end if;

  select saldo into v_saldo
  from public.copywriter_credits
  where account_id = v_account_id
  for update;

  if v_saldo is null or v_saldo < p_amount then
    return false;
  end if;

  update public.copywriter_credits
  set saldo = saldo - p_amount,
      updated_at = now()
  where account_id = v_account_id;

  return true;
end;
$$;

grant execute on function public.consume_copywriter_credits to authenticated;
