# Supabase

Migrations SQL e seed data do projeto.

## Estrutura prevista (PR #2)

```
supabase/
├── migrations/
│   ├── 0001_initial_schema.sql      # tenants, users, contacts, deals, ...
│   ├── 0002_rls_policies.sql        # RLS policies de isolamento por tenant
│   ├── 0003_indexes.sql             # indices de performance
│   └── 0004_seed_pipeline_stages.sql # estagios padrao + templates de followup
└── seed.sql                          # dados de exemplo p/ desenvolvimento
```

## Como rodar

Pelo Supabase CLI (a configurar):

```bash
supabase link --project-ref <ref>
supabase db push
```

Ou cole o SQL direto no SQL Editor do dashboard.
