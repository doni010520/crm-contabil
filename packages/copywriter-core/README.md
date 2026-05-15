# @crm-contabil/copywriter-core

Gerador de copy especializada para escritórios de contabilidade. Persona única ("Marina Costa, copywriter sênior contábil") aplicada via prompt engineering avançado para entregar copy de site (Home, LPs de nicho, páginas de serviço) e anúncios (Google Ads, Meta Ads).

## Uso

```ts
import { generateCopy, type EscritorioProfile } from '@crm-contabil/copywriter-core';

const escritorio: EscritorioProfile = {
  nome: 'Contabilidade Andrade',
  cidade: 'Belo Horizonte',
  atendeRemoto: false,
  estadoAtuacao: 'MG',
  crcUf: 'MG',
  crcNumero: '045812',
  anosMercado: 12,
  faixaClientes: '200-500',
  nichos: ['medicos'],
  servicos: ['contabil', 'fiscal', 'folha', 'tributario'],
  modeloPreco: 'faixa-por-porte',
  precoInicialMensal: 397,
  diferenciais: [
    'Contador dedicado nominal',
    'App próprio com guias e relatórios',
    'Resposta em 4h úteis ou seu mês sai grátis',
  ],
  persona: 'Médico PJ ou recém-saído da CLT, faturando entre R$ 20k e R$ 80k/mês, sem tempo nem paciência para contabilidade.',
  doresPrincipais: [
    'Médico PJ pagando IR alto por Pró-Labore não-otimizado',
    'Dúvida entre Anexo III e V do Simples',
    'Contador anterior demora dias para responder',
  ],
  cases: [
    {
      segmento: 'Cardiologia',
      porte: 'R$ 60k/mês',
      resultado: 'Economia de R$ 1.400/mês ao migrar para Anexo V com Fator R',
    },
  ],
  tomDeVoz: 'formal-consultivo',
  ctaPrimario: 'diagnostico-gratuito',
  whatsapp: '31999998888',
};

const resultado = await generateCopy({
  escritorio,
  geracao: { modo: 'site-home', params: {} },
});

console.log(resultado.output);  // SitePageOutput pronto pra colar no Hostinger/Wix
console.log(resultado.creditosConsumidos);  // 3
console.log(resultado.avisos);  // qualquer alerta de qualidade
```

## Modos suportados

| Modo | Custo (créditos) | Output |
|---|---|---|
| `site-home` | 3 | Home completa com 10 seções |
| `site-lp-nicho` | 1 | LP dedicada por segmento (médicos, e-commerce, etc.) |
| `site-servico` | 1 | Página de serviço (abertura, troca, IRPF, etc.) |
| `google-ads` | 2 | Campanha RSA completa (15 headlines · 4 descriptions · sitelinks · callouts · negativas) |
| `meta-ads` | 2 | 5 variações de copy + público sugerido + ideias de criativo |

## Arquitetura

```
packages/copywriter-core/
├── index.ts                      # Barrel export
├── lib/
│   ├── types.ts                  # Schemas TypeScript
│   ├── llm-client.ts             # Wrapper OpenAI com JSON mode + retry
│   ├── knowledge/
│   │   ├── vocabulary.ts         # Substituições positivas + power words
│   │   ├── frameworks.ts         # PAS · StoryBrand · AIDA
│   │   ├── nichos.ts             # 17 nichos com vocabulário próprio
│   │   └── cta-library.ts        # CTAs por estágio de funil
│   ├── prompts/
│   │   ├── system-base.ts        # System prompt MESTRE (Marina Costa)
│   │   ├── shared.ts             # Helpers
│   │   ├── site-home.ts
│   │   ├── site-lp-nicho.ts
│   │   ├── site-servico.ts
│   │   ├── ads-google.ts
│   │   └── ads-meta.ts
│   ├── validators/
│   │   ├── char-limits.ts        # Trunca se LLM estourar limite de char
│   │   └── output-quality.ts     # Heurística anti-clichê pós-geração
│   └── generators/
│       ├── index.ts              # Dispatcher
│       ├── generate-site.ts
│       └── generate-ads.ts
└── components/                   # (Fase 2 — UI Wizard + Viewer)
```

## Engenharia de prompt aplicada

O system prompt mestre (`buildSystemPrompt`) usa:

1. **XML tags** para segmentação semântica (`<role>`, `<methodology>`, `<self_review_rubric>`, etc.) — Claude/GPT-4 respondem melhor.
2. **Substituições positivas** em vez de instruções negativas. Em vez de "NÃO use 'tradição familiar'", ensinamos a alternativa: "use prova social numérica concreta".
3. **Few-shot com contraste** — exemplos `bad_output` × `good_output` lado a lado com `reason=`.
4. **Chain-of-thought explícito** — 7 passos de raciocínio que o LLM percorre antes de escrever.
5. **Rubrica de auto-avaliação** — checklist final que o LLM verifica antes de devolver.
6. **Filtragem dinâmica de nichos** — apenas os nichos do escritório entram no prompt (economia de tokens).

## Custo por geração (referência)

Modelo: `gpt-4o`. Tokens médios observados:

| Modo | Input | Output | Custo USD |
|---|---|---|---|
| `site-home` | ~4500 | ~3500 | ~$0.060 |
| `site-lp-nicho` | ~3500 | ~2500 | ~$0.040 |
| `site-servico` | ~3000 | ~2000 | ~$0.035 |
| `google-ads` | ~3500 | ~2200 | ~$0.038 |
| `meta-ads` | ~3000 | ~1800 | ~$0.032 |

Margem confortável vs. preço por crédito (R$ 2,47–4,70).

## Roadmap

- [x] Fase 1: package core (types, prompts, generators, validators)
- [x] Fase 1: migration Supabase
- [ ] Fase 2: API routes (`/api/copy/generate`)
- [ ] Fase 2: UI components (`CopywriterWizard`, `OutputViewer`)
- [ ] Fase 2: Rotas `/copy/[tenantSlug]`
- [ ] Fase 3: Refinamento por chat (ajustes pontuais sem regenerar)
- [ ] Fase 3: Histórico e variações
- [ ] Fase 3: Integração Stripe para créditos
