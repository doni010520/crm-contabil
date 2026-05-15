// ============================================================
// Frameworks de copywriting aplicáveis a contabilidade
// ============================================================
// O LLM escolhe o framework certo conforme o contexto:
// - PAS: padrão para Home, LPs e anúncios (70% dos casos)
// - StoryBrand: escritórios consultivos/boutique
// - AIDA: anúncios curtos
// ============================================================

export interface Framework {
  nome: string;
  quandoUsar: string;
  estrutura: string[];
  exemplo: string;
}

export const PAS: Framework = {
  nome: 'PAS — Problema · Agitação · Solução',
  quandoUsar:
    'Padrão para Home, LPs de nicho, anúncios de troca de contador. Use em ~70% dos casos.',
  estrutura: [
    '1. PROBLEMA: nome a dor em linguagem do cliente, em uma frase',
    '2. AGITAÇÃO: consequência tangível da inércia (R$, tempo, risco)',
    '3. SOLUÇÃO: caminho específico oferecido pelo escritório, com promessa de tempo/resultado',
  ],
  exemplo: `
P: "Você desconfia que paga imposto demais — mas não sabe quanto."
A: "Cada mês no regime errado pode custar 8% a 30% do faturamento. Em 12 meses, é a reserva de emergência que você não fez."
S: "Em 30 min de diagnóstico gratuito, mostramos exatamente quanto você economizaria reenquadrando o regime."
`.trim(),
};

export const STORY_BRAND: Framework = {
  nome: 'StoryBrand — Cliente é o herói, escritório é o guia',
  quandoUsar:
    'Escritórios consultivos/boutique com ticket alto, públicos sofisticados (médicos, advogados, holdings).',
  estrutura: [
    '1. HERÓI: caracterize o cliente em uma frase ("Você abriu sua empresa para X, não para Y")',
    '2. PROBLEMA: nomeie a dor recorrente',
    '3. GUIA: posicione o escritório com autoridade (anos, números, especialização)',
    '4. PLANO: 3 passos claros do processo',
    '5. CTA: ação direta + ação transicional (material gratuito)',
    '6. STAKE: custo de não agir (perda continuada)',
  ],
  exemplo: `
HERÓI:     "Você abriu sua empresa para crescer, não para se afogar em obrigação fiscal."
PROBLEMA:  "Mas todo mês é a mesma história: prazos, guias, dúvidas, surpresas."
GUIA:      "A [Escritório] é a contabilidade dos médicos de [Cidade] há 12 anos."
PLANO:     "1. Diagnóstico em 30 min · 2. Migração sem ruído · 3. Reuniões mensais."
CTA:       "Agendar diagnóstico gratuito."
STAKE:     "Continuar onde está = mais um ano de imposto pago a mais."
`.trim(),
};

export const AIDA: Framework = {
  nome: 'AIDA — Atenção · Interesse · Desejo · Ação',
  quandoUsar:
    'Anúncios curtos (Google headlines, Meta primary text). Frases curtas, impacto imediato.',
  estrutura: [
    '1. ATENÇÃO: gancho que para o scroll (dor + público)',
    '2. INTERESSE: dado/insight específico que aprofunda',
    '3. DESEJO: benefício concreto que cliente passa a querer',
    '4. AÇÃO: CTA com verbo + promessa de tempo',
  ],
  exemplo: `
A: "Médico PJ em SP?"
I: "Você pode estar pagando R$ 12k/ano a mais de IR no regime errado."
D: "Em 30 min de diagnóstico, mostramos quanto você economizaria reenquadrando."
A: "Agendar diagnóstico gratuito"
`.trim(),
};

export const ALL_FRAMEWORKS = { PAS, STORY_BRAND, AIDA };

/**
 * Heurística de seleção de framework baseada no contexto.
 * Embebida no system prompt para guiar a escolha do LLM.
 */
export const FRAMEWORK_SELECTION_GUIDE = `
SELEÇÃO DE FRAMEWORK (em ordem de prioridade):

1. Se for ANÚNCIO CURTO (Google headline, Meta headline curta) → AIDA
2. Se for ESCRITÓRIO CONSULTIVO/BOUTIQUE (ticket alto, médicos/advogados/holdings,
   tom 'formal-consultivo' E modeloPreco 'sob-consulta') → StoryBrand
3. CASO PADRÃO (qualquer Home, LP, anúncio padrão) → PAS

Em todos os casos, a regra mestra prevalece: o cliente é o herói, o escritório é o guia.
A página/anúncio começa pela DOR, não pelo escritório.
`.trim();
