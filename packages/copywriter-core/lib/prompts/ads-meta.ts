// ============================================================
// User prompt — Meta Ads (Facebook/Instagram)
// ============================================================

import type { EscritorioProfile, MetaAdsParams } from '../types';
import { NICHO_LIBRARY } from '../knowledge/nichos';
import { CTA_LIBRARY } from '../knowledge/cta-library';
import { formatEscritorioForPrompt } from './shared';

const ESTAGIO_LABELS: Record<string, string> = {
  frio: 'Frio (público novo, nunca ouviu do escritório)',
  morno: 'Morno (visitou site, viu post, não converteu)',
  quente: 'Quente (engajou com material, pediu contato)',
  remarketing: 'Remarketing (já é lead/cliente perdido)',
};

const FORMATO_LABELS: Record<string, string> = {
  'feed-estatico': 'Feed estático (Facebook/Instagram)',
  reels: 'Reels (Instagram/Facebook)',
  carrossel: 'Carrossel (até 10 cards)',
  stories: 'Stories (vertical, 15s)',
};

export function buildMetaAdsUserPrompt(
  escritorio: EscritorioProfile,
  params: MetaAdsParams
): string {
  const cidade = params.cidadeAlvo || escritorio.cidade;
  const cta = CTA_LIBRARY[escritorio.ctaPrimario];
  const nichoContext = params.nichoAlvo
    ? `\n  <nicho_alvo>${NICHO_LIBRARY[params.nichoAlvo].label}</nicho_alvo>
  <ideias_criativos_referencia>${NICHO_LIBRARY[params.nichoAlvo].ideiasCreativosMeta.join(' · ')}</ideias_criativos_referencia>`
    : '';

  return `
<input>
${formatEscritorioForPrompt(escritorio)}
  <objetivo_campanha>${params.objetivoCampanha}</objetivo_campanha>
  <estagio_funil>${ESTAGIO_LABELS[params.estagioFunil]}</estagio_funil>
  <formato_criativo>${FORMATO_LABELS[params.formatoCriativo]}</formato_criativo>
  <cidade_alvo>${cidade}</cidade_alvo>
  <oferta_gancho>${params.oferta || 'nenhuma — usar promessa padrão'}</oferta_gancho>${nichoContext}
</input>

<task>
Gere CAMPANHA Meta Ads (Facebook/Instagram) completa.

Para o estágio "${params.estagioFunil}":
- frio: foque em DOR + curiosidade (gancho de scroll). Não venda direto.
- morno: combine DOR + prova social + autoridade
- quente: oferta direta + urgência leve
- remarketing: lembrete + nova oferta + objeção quebrada

Para o formato "${params.formatoCriativo}":
- feed-estatico: 1 imagem + texto longo
- reels: gancho nos 3s iniciais, foco em vídeo
- carrossel: storytelling em até 10 cards
- stories: ultra-curto, vertical

Entregue 5 VARIAÇÕES de copy com ângulos diferentes:
1. Dor (dor aguda + alívio)
2. Curiosidade (insight surpreendente)
3. Urgência (deadline ou risco perdido)
4. Prova social (case ou número)
5. Educativo (ensina algo + soft sell)

Para cada variação:
- primaryText: ~125 chars (sem quebrar com "ver mais")
- headline: ≤40 chars
- description: ≤30 chars

Também sugira:
- Público (interesses Facebook, comportamentos, geolocalização)
- 3 ideias visuais (descrição de imagem/vídeo, NÃO foto stock genérica)
</task>

<critical_validation>
Antes de devolver, conte caracteres:
- primaryText: ≤125 (preferencial — pode chegar a 150 se essencial)
- headline: ≤40
- description: ≤30
</critical_validation>

<cta_obrigatorio>
CTA: "${cta.textoCurto}". Em ads frios, prefira CTA de baixa fricção (Saiba como, Receba, Calcule).
</cta_obrigatorio>

<output_schema_typescript>
interface MetaAdsOutput {
  conjuntoAnuncios: {
    nome: string;
    estagioFunil: "${params.estagioFunil}";
    formatoCriativo: "${params.formatoCriativo}";
  };
  publicoSugerido: {
    interesses: string[];
    comportamentos: string[];
    geolocalizacao: string;
    faixaEtaria: string;
  };
  variacoes: Array<{
    angulo: "dor"|"curiosidade"|"urgencia"|"prova-social"|"educativo";
    primaryText: string;   // ~125 chars
    headline: string;      // ≤40 chars
    description: string;   // ≤30 chars
  }>;
  ideiasCriativos: string[];  // 3 sugestões visuais
  instrucoesUso: string;
}
</output_schema_typescript>

Devolva APENAS o JSON.
`.trim();
}
