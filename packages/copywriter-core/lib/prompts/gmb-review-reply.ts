// ============================================================
// User prompt — Resposta a avaliação do Google Meu Negócio
// ============================================================

import type { EscritorioProfile, GmbReviewReplyParams } from '../types';
import { formatEscritorioForPrompt } from './shared';

export function buildGmbReviewReplyUserPrompt(
  escritorio: EscritorioProfile,
  params: GmbReviewReplyParams
): string {
  const tomGuidance =
    params.rating >= 4
      ? `RATING ${params.rating}/5 — AVALIAÇÃO POSITIVA.
Tom: agradecimento genuíno + reforço de valor + convite sutil a mais clientes (sem ser comercial).
Estrutura recomendada:
1. Agradecimento personalizado (use o nome do avaliador)
2. Reconhecimento do ponto específico que ele mencionou (se mencionou)
3. Reforço sutil de um diferencial do escritório
4. Despedida cordial`
      : params.rating === 3
      ? `RATING 3/5 — AVALIAÇÃO NEUTRA/MORNA.
Tom: agradecer pelo feedback + reconhecer abertamente o que ficou aquém + convite para conversa direta.
Estrutura:
1. Agradecimento pelo feedback honesto
2. Validação do ponto mencionado (sem desculpas em massa)
3. Convite para conversa direta (WhatsApp/telefone do escritório)`
      : `RATING ${params.rating}/5 — AVALIAÇÃO NEGATIVA. CUIDADO MÁXIMO.
Tom: apologia empática SEM se justificar publicamente. Levar conversa pro privado.
Estrutura:
1. Reconhecer o problema com empatia (sem defensiva)
2. NÃO discutir detalhes do caso publicamente
3. Convite para resolver no privado (WhatsApp do escritório)
4. Compromisso geral de melhoria
EVITAR: "lamentamos que sua experiência não tenha sido a ideal" (cliché frio).
PREFERIR: "Entendi sua frustração e quero resolver isso pessoalmente com você."`;

  return `
<input>
${formatEscritorioForPrompt(escritorio)}
  <avaliacao>
    <rating>${params.rating}/5</rating>
    <nome_avaliador>${params.nomeAvaliador}</nome_avaliador>
    <comentario>${params.comentario || '(sem comentário, apenas rating)'}</comentario>
  </avaliacao>
</input>

<context>
${tomGuidance}
</context>

<task>
Gere a RESPOSTA pública para esta avaliação no Google Meu Negócio.

REGRAS:
- Máximo 4 frases (respostas curtas funcionam melhor)
- 2ª pessoa, tom natural (não corporativo)
- Use o NOME do avaliador (${params.nomeAvaliador}) no início
- Se rating ≥ 4 e o comentário menciona algo específico, comente esse ponto
- Se rating ≤ 3, NÃO discuta o caso em detalhes — leve pra conversa privada
- NUNCA peça pra ele mudar a avaliação
- NUNCA use "lamentamos", "agradecemos seu feedback" (frio demais)
- Tom: ${escritorio.tomDeVoz}

DETERMINAÇÃO DO CAMPO "tom":
- rating >= 4 → "agradecimento"
- rating === 3 → "esclarecimento"
- rating <= 2 → "apologia-empatica"
</task>

<output_schema_typescript>
interface GmbReviewReplyOutput {
  resposta: string;  // máx ~400 chars, idealmente 100-250
  tom: "agradecimento" | "esclarecimento" | "apologia-empatica";
}
</output_schema_typescript>

Devolva APENAS o JSON.
`.trim();
}
