// ============================================================
// User prompt — LP de nicho (página dedicada por segmento)
// ============================================================

import type { EscritorioProfile, SiteLpNichoParams } from '../types';
import { NICHO_LIBRARY } from '../knowledge/nichos';
import { CTA_LIBRARY } from '../knowledge/cta-library';
import { formatEscritorioForPrompt } from './shared';

export function buildSiteLpNichoUserPrompt(
  escritorio: EscritorioProfile,
  params: SiteLpNichoParams
): string {
  const nicho = NICHO_LIBRARY[params.nicho];
  const cidade = params.cidadeAlvo || escritorio.cidade;
  const cta = CTA_LIBRARY[escritorio.ctaPrimario];

  return `
<input>
${formatEscritorioForPrompt(escritorio)}
  <lp_nicho_alvo>${nicho.label} (${nicho.key})</lp_nicho_alvo>
  <cidade_alvo>${cidade}</cidade_alvo>
</input>

<niche_specific_context>
Dores específicas do nicho (use 3-4 nas seções):
${nicho.dores.map((d) => `  - ${d}`).join('\n')}

Vocabulário próprio do setor (use NATURALMENTE, sempre traduzindo):
${nicho.vocabulario.join(' · ')}

Hook de referência (não copie, inspire-se):
${nicho.hookExemplo}

Tom recomendado para este nicho: ${nicho.tomRecomendado}
</niche_specific_context>

<task>
Gere a LP DE NICHO para ${nicho.label} em ${cidade}. URL sugerida: /contador-para-${nicho.key}${cidade !== escritorio.cidade ? `-em-${slugify(cidade)}` : ''}/

Estrutura obrigatória:
1. hero — H1 com "[Serviço] para [Nicho] em [Cidade]" + subheadline com dor específica do nicho + bullets de confiança + CTA
2. dores-pas — 4 dores do nicho (em PAS), específicas deste segmento
3. processo — como funciona PARA O NICHO (não genérico)
4. diferenciais — os do escritório, conectados ao contexto do nicho
5. depoimentos — apenas cases do input que se conectam ao nicho
6. faq — 6 perguntas específicas do nicho (não FAQs genéricas)
7. cta-final — fechamento com headline específica do nicho

CTA primário: "${cta.textoLongo}"
</task>

<output_schema_typescript>
SitePageOutput (mesmo schema da Home — ver tipos).
URL: "/contador-para-${nicho.key}${cidade !== escritorio.cidade ? `-em-${slugify(cidade)}` : ''}/"
H1 deve conter: nicho + cidade
metaDescription: deve conter nicho + cidade + benefício, ≤155 chars
schemaJsonLd: AccountingService específico para este nicho/cidade
</output_schema_typescript>

Devolva APENAS o JSON.
`.trim();
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
