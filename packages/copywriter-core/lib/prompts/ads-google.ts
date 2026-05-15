// ============================================================
// User prompt — Google Ads (RSA — Responsive Search Ads)
// ============================================================

import type { EscritorioProfile, GoogleAdsParams } from '../types';
import { NICHO_LIBRARY } from '../knowledge/nichos';
import { CTA_LIBRARY } from '../knowledge/cta-library';
import { formatEscritorioForPrompt } from './shared';

const OBJETIVO_LABELS: Record<string, string> = {
  'abertura-empresa': 'Abertura de empresa',
  'troca-contador': 'Troca de contador',
  'nicho-especifico': 'Captação para nicho específico',
  'servico-especifico': 'Captação para serviço específico',
};

export function buildGoogleAdsUserPrompt(
  escritorio: EscritorioProfile,
  params: GoogleAdsParams
): string {
  const cidade = params.cidadeAlvo || escritorio.cidade;
  const cta = CTA_LIBRARY[escritorio.ctaPrimario];
  const nichoContext = params.nichoAlvo
    ? `\n  <nicho_alvo>${NICHO_LIBRARY[params.nichoAlvo].label}</nicho_alvo>
  <palavras_chave_sugeridas_pelo_nicho>${NICHO_LIBRARY[params.nichoAlvo].palavrasChaveGoogle.join(' · ')}</palavras_chave_sugeridas_pelo_nicho>`
    : '';

  return `
<input>
${formatEscritorioForPrompt(escritorio)}
  <objetivo_campanha>${OBJETIVO_LABELS[params.objetivoCampanha]}</objetivo_campanha>
  <cidade_alvo>${cidade}</cidade_alvo>
  <orcamento_mensal>R$ ${params.orcamentoMensal}</orcamento_mensal>
  <oferta_gancho>${params.oferta || 'nenhuma — usar promessa padrão'}</oferta_gancho>${nichoContext}
</input>

<task>
Gere uma CAMPANHA Google Ads RSA (Responsive Search Ads) completa para o objetivo "${OBJETIVO_LABELS[params.objetivoCampanha]}" em ${cidade}.

Estrutura: 1 a 3 ad groups por intenção de busca (NÃO um único ad group genérico).
- Se objetivo = abertura-empresa → 2 ad groups (abrir empresa MEI, abrir empresa ME/LTDA)
- Se objetivo = troca-contador → 2 ad groups (trocar contador, contador insatisfeito)
- Se objetivo = nicho-especifico → 1 ad group focado no nicho

Para CADA ad group:
- 15 headlines (CADA UMA ≤30 CARACTERES — conte!) cobrindo: dor, benefício, número, CTA, nicho, cidade, oferta
- 4 descriptions (CADA UMA ≤90 CARACTERES — conte!)
- 4 sitelinks (texto ≤25 chars, 2 descrições ≤35 chars cada)
- 10 callouts (≤25 chars cada)
- Palavras-chave: misture exact, phrase e broad (5-10 termos)

Inclua também:
- Palavras-chave NEGATIVAS obrigatórias (curso, faculdade, emprego, vaga, simulado, concurso, salário, OAB, CRC concurso, etc.) — evita queimar verba
- Orçamento sugerido por ad group baseado no orçamento total
- Instruções de uso para o contador colar no Google Ads
</task>

<critical_validation>
ANTES de devolver, conte caractere por caractere:
- Headlines ≤30 chars (cada uma)
- Descriptions ≤90 chars (cada uma)
- Callouts ≤25 chars
- Sitelink texto ≤25 chars, descrição ≤35 chars
SE ESTOUROU, REESCREVA até caber. Output com limite estourado é rejeitado pela plataforma.
</critical_validation>

<cta_obrigatorio>
CTA primário escolhido: "${cta.textoLongo}". Use variações deste CTA em headlines e descriptions, sempre com verbo de ação imperativo.
</cta_obrigatorio>

<output_schema_typescript>
interface GoogleAdsOutput {
  campanha: {
    nome: string;
    objetivo: "${params.objetivoCampanha}";
    orcamentoMensalSugerido: ${params.orcamentoMensal};
    geolocalizacao: "${cidade}";
  };
  adGroups: Array<{
    nome: string;
    palavrasChave: Array<{ termo: string; correspondencia: "exact"|"phrase"|"broad" }>;
    headlines: string[];        // 15 itens, cada ≤30 chars
    descriptions: string[];     // 4 itens, cada ≤90 chars
    sitelinks: Array<{ texto: string; descricao1: string; descricao2: string }>;
    callouts: string[];         // 10 itens, cada ≤25 chars
  }>;
  palavrasNegativas: string[];
  instrucoesUso: string;
}
</output_schema_typescript>

Devolva APENAS o JSON.
`.trim();
}
