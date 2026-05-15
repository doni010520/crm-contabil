// ============================================================
// User prompt — Post do Google Meu Negócio
// ============================================================

import type { EscritorioProfile, GmbPostParams } from '../types';
import { formatEscritorioForPrompt } from './shared';

const TEMA_GUIDANCE: Record<string, string> = {
  educativo:
    'Ensine algo útil em 3-4 frases sobre obrigação fiscal, regime tributário ou economia legal de imposto. Foco em valor, não em vender.',
  oferta:
    'Apresente uma promessa concreta (ex: diagnóstico gratuito de 30 min, primeira consulta cortesia). NUNCA use desconto/preço/urgência ("últimas vagas") — o Google penaliza.',
  evento:
    'Anuncie webinar, lives, capacitação ou evento online próximo. Inclua data se houver no contextoTemporal.',
  depoimento:
    'Conte UM case real (do array de cases do escritório). Foco no resultado em números. Anonimize segmento se necessário.',
  'dica-fiscal':
    'Uma dica prática e curta (3 frases) sobre um tema fiscal específico do nicho do escritório — médico/Pró-Labore, e-commerce/ST, etc.',
  'prazo-importante':
    'Lembre o prazo de uma obrigação fiscal próxima (DCTFWeb, EFD-Reinf, DASN-Simei) com tradução do que é. Inclui mês/data se houver contexto temporal.',
};

const CTA_TEXT_BY_TYPE: Record<string, string> = {
  learn_more: 'Saiba mais',
  book: 'Reservar',
  call: 'Ligar agora',
  sign_up: 'Cadastrar',
  shop: 'Comprar',
  order: 'Pedir',
  none: '',
};

export function buildGmbPostUserPrompt(
  escritorio: EscritorioProfile,
  params: GmbPostParams
): string {
  const ctaType = params.ctaType || 'learn_more';
  const ctaTexto = CTA_TEXT_BY_TYPE[ctaType];
  const ctaInfo =
    ctaType === 'none'
      ? '<sem_cta>true</sem_cta>'
      : `<cta_type>${ctaType}</cta_type>\n  <cta_texto>${ctaTexto}</cta_texto>\n  <cta_url>${params.ctaUrl || 'sem URL'}</cta_url>`;

  return `
<input>
${formatEscritorioForPrompt(escritorio)}
  <tema>${params.tema}</tema>
  <contexto_temporal>${params.contextoTemporal || 'sem contexto temporal'}</contexto_temporal>
  ${ctaInfo}
</input>

<niche_specific_guidance>
${TEMA_GUIDANCE[params.tema] || TEMA_GUIDANCE.educativo}
</niche_specific_guidance>

<task>
Gere um POST para o Google Meu Negócio sobre o tema "${params.tema}".

LIMITES E REGRAS DO GMB:
- Conteúdo: máximo 1500 caracteres, IDEAL 200-300 caracteres (engaja mais)
- Sem URLs no corpo do texto (usar campo CTA URL)
- Sem números de telefone no corpo
- Sem ofertas com desconto/preço (Google penaliza)
- Sem urgência falsa ("últimas vagas", "só hoje")

OBRIGATÓRIO:
- Mencionar CIDADE do escritório pelo menos 1x
- Se o tema é educativo/dica-fiscal/prazo: foco em informação útil, não em venda
- Se o tema é depoimento: usar APENAS cases reais do input (não inventar)
- Tom: ${escritorio.tomDeVoz}
- Encerrar com convite específico ao CTA (não com "entre em contato")

IDEIA DE CRIATIVO VISUAL:
Sugira uma imagem real para acompanhar o post — descreva o que aparece.
EVITAR: aperto de mão, calculadora, pilha de moedas, "negócios genéricos".
PREFERIR: foto do escritório, sócios, cliente do nicho, dado/gráfico específico.
</task>

<output_schema_typescript>
interface GmbPostOutput {
  conteudo: string;            // ≤1500 chars, ideal 200-300
  tema: "${params.tema}";
  ctaType: "${ctaType}";
  ctaTexto: "${ctaTexto}";
  ctaUrl?: string;
  ideiaCriativoVisual: string; // 1-2 frases descrevendo imagem ideal
}
</output_schema_typescript>

Devolva APENAS o JSON.
`.trim();
}
