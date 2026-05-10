# CRM Contábil

CRM SaaS multi-tenant especializado em escritórios de contabilidade. Pipeline de vendas, WhatsApp Cloud API integrado, geração de propostas e contratos digitais.

> **Status:** v0.1 — fundação. Veja [docs/PLANO_TECNICO.md](docs/PLANO_TECNICO.md) para o roadmap completo (9 fases).

## Stack

- **Next.js 16** (App Router) + React 19 + TypeScript
- **Tailwind CSS 4** + Shadcn/UI
- **Supabase** (Postgres + Auth + RLS + Realtime + Storage)
- **n8n** (orquestração de workflows: webhooks, follow-ups, SDR de IA)
- **WhatsApp Cloud API** (Meta) com CoEx
- **GPT-4.1-mini** (SDR de IA — somente nível 2)

## Pré-requisitos

- Node.js 22+
- npm 10+
- Conta Supabase (free tier suficiente pra começar)
- Meta Business Manager + número WhatsApp aprovado (Cloud API)
- Easypanel + VPS (deploy)

## Setup local

```bash
git clone <repo>
cd crm-contabil
cp .env.example .env.local
# preencha as variaveis (NEXT_PUBLIC_SUPABASE_URL, etc.)
npm install
npm run dev
```

Abra http://localhost:3000.

### Variáveis de ambiente

Veja [.env.example](.env.example). As principais:

| Variável | Onde obter |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → Project Settings → API (segredo) |
| `WHATSAPP_VERIFY_TOKEN` | Você define (string aleatória; usada na verificação do webhook) |
| `ENCRYPTION_KEY` | Você define (32+ chars; usada pra criptografar tokens WhatsApp no banco) |

## Aviso: OneDrive e node_modules

Se você clonar este repo dentro de uma pasta sincronizada pelo OneDrive/Dropbox/iCloud, o `node_modules` (30k+ arquivos) vai sincronizar na nuvem e gastar CPU + banda. **Recomendado:** clonar em `C:/Users/<seu-usuario>/Code/` ou similar, fora de pastas sincronizadas.

Se já está em pasta sincronizada, exclua `node_modules` do sync:

- **OneDrive:** Configurações → Sincronização e backup → Configurações avançadas → Excluir pastas → adicionar `node_modules`.

## Estrutura

```
.
├── app/                  # rotas Next.js (App Router)
├── components/           # componentes React (ui/ recebe Shadcn)
├── lib/
│   ├── supabase/         # clients (browser, server, middleware)
│   └── utils.ts          # helpers (cn, etc.)
├── supabase/
│   └── migrations/       # SQL migrations (vem no PR #2)
├── docs/
│   └── PLANO_TECNICO.md  # plano técnico completo
├── public/
├── middleware.ts         # auth middleware (Supabase session)
├── Dockerfile            # build de produção (standalone)
└── next.config.ts        # output: 'standalone'
```

## Roadmap (resumo)

- **PR #1 — Fundação (atual):** scaffold + Supabase client + Docker + auth middleware skeleton
- **PR #2 — Banco:** schema completo, RLS policies, seed data
- **PR #3 — Auth + Onboarding:** login, registro, criar tenant, layout shell
- **PR #4 — Contatos:** CRUD + enriquecimento CNPJ via Brasil API
- **PR #5+ — Pipeline, WhatsApp, Propostas, Contratos, Follow-ups, Dashboard**

Detalhes em [docs/PLANO_TECNICO.md](docs/PLANO_TECNICO.md).

## Deploy (Easypanel)

1. **No Easypanel** → Create Service → App
2. **Source:** GitHub → conecta este repo
3. **Build:** Dockerfile (já incluso na raiz)
4. **Environment:** copie as variáveis do `.env.example` e preencha com valores de produção
5. **Domains:** `crm.<seu-dominio>.com`
6. **Deploy** — push pra `main` redeploya automaticamente

### Variáveis de produção

Use uma instância Supabase separada da de dev. Gere `WHATSAPP_VERIFY_TOKEN` e `ENCRYPTION_KEY` aleatórios e fortes (`openssl rand -hex 32`).

### Webhook WhatsApp

Após deploy, no Meta Business Manager → Configuração do app → Webhooks:

- **Callback URL:** `https://crm.<seu-dominio>.com/api/webhooks/whatsapp`
- **Verify Token:** o mesmo de `WHATSAPP_VERIFY_TOKEN`
- **Subscriptions:** `messages`, `message_status`

## Licença

Privado — sem licença pública.
