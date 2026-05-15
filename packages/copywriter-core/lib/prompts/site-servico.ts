// ============================================================
// User prompt — Página de Serviço (uma por serviço, p/ SEO)
// ============================================================

import type { EscritorioProfile, SiteServicoParams } from '../types';
import { formatEscritorioForPrompt } from './shared';

const SERVICO_LABELS: Record<string, string> = {
  contabil: 'Contabilidade',
  fiscal: 'Apuração Fiscal',
  folha: 'Folha de Pagamento',
  tributario: 'Planejamento Tributário',
  societario: 'Departamento Societário',
  'bpo-financeiro': 'BPO Financeiro',
  irpf: 'Imposto de Renda Pessoa Física',
  consultoria: 'Consultoria Contábil',
  abertura: 'Abertura de Empresa',
  troca: 'Troca de Contador',
  sucessorio: 'Planejamento Sucessório',
};

export function buildSiteServicoUserPrompt(
  escritorio: EscritorioProfile,
  params: SiteServicoParams
): string {
  const servicoLabel = SERVICO_LABELS[params.servico] || params.servico;
  const cidade = params.cidadeAlvo || escritorio.cidade;

  return `
<input>
${formatEscritorioForPrompt(escritorio)}
  <servico_alvo>${servicoLabel} (${params.servico})</servico_alvo>
  <cidade_alvo>${cidade}</cidade_alvo>
</input>

<task>
Gere a PÁGINA DE SERVIÇO de "${servicoLabel}" em ${cidade}. URL sugerida: /servicos/${params.servico}/

Foco: SEO de cauda longa + conversão de quem busca exatamente este serviço. Estrutura:
1. hero — H1 com "[Serviço] em [Cidade] — [benefício específico]"
2. dores-pas — 3 dores que ESTE SERVIÇO resolve (em PAS)
3. processo — como o serviço é entregue passo a passo
4. diferenciais — diferenciais do escritório aplicados a este serviço
5. faq — 6 perguntas específicas deste serviço
6. cta-final — CTA com promessa de tempo

Use vocabulário técnico do serviço (DCTFWeb, eSocial, ECD, etc.) SEMPRE com tradução entre parênteses.
</task>

<output_schema_typescript>
SitePageOutput. URL: "/servicos/${params.servico}/". H1 com serviço + cidade.
</output_schema_typescript>

Devolva APENAS o JSON.
`.trim();
}
