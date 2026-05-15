// ============================================================
// User prompt — Análise personalizada de calculadora
// ============================================================
// Roda DEPOIS do cálculo determinístico. Recebe os números mortos
// + dados do empresário e devolve análise narrativa com voz de
// especialista, transformando "cálculo de Excel" em "diagnóstico
// de consultor".
// ============================================================

import type {
  EscritorioProfile,
  CalculatorAnalysisParams,
  CalculatorType,
} from '../types';
import { formatEscritorioForPrompt } from './shared';

const CALCULATOR_CONTEXT: Record<CalculatorType, string> = {
  regime_simulator: `
SIMULADOR DE REGIME TRIBUTÁRIO
A calculadora comparou Simples Nacional, Lucro Presumido e Lucro Real
baseado no faturamento, atividade e despesas informadas. O resultado
indica qual regime gera menor imposto mensal.

Sua análise deve:
1. Nomear a economia anual concreta (em R$) da troca para o regime ideal
2. Explicar PORQUE esse regime é melhor para o caso específico
3. Mencionar 2-3 ações práticas (reenquadramento, recolhimento DAS, etc.)
4. Apontar 1 risco se o empresário continuar no regime atual
`,
  clt_cost: `
CUSTO DE FUNCIONÁRIO CLT
A calculadora mostrou o custo total (salário + encargos + benefícios)
de um funcionário CLT. O empresário quer saber se vale a pena contratar
nesse modelo.

Sua análise deve:
1. Destacar o "custo invisível" (% além do salário bruto)
2. Comparar implicitamente com alternativas (PJ, autônomo) se couber
3. Apontar onde se pode otimizar (PAT, vale-refeição como dedução, etc.)
4. Trazer perspectiva do porte saudável de folha (% do faturamento)
`,
  fiscal_health: `
DIAGNÓSTICO DE SAÚDE FISCAL
Quiz de 10 perguntas em 5 categorias (Conformidade, Organização Financeira,
Planejamento Tributário, Obrigações Legais, Tecnologia). Gerou score 0-100
e nível green/yellow/red.

Sua análise deve:
1. Interpretar o nível (não só repetir o número)
2. Destacar a categoria MAIS FRACA com consequência real (multa, perda fiscal)
3. Apontar 2-3 ações imediatas para os 30 próximos dias
4. Reforçar o que está indo bem (se aplicável)
`,
  opening_cost: `
CUSTO DE ABERTURA DE EMPRESA
A calculadora estimou custos para abrir empresa por estado, tipo societário
e CNAE. O empresário ainda não tem CNPJ.

Sua análise deve:
1. Reforçar o investimento como recuperável em meses (com base no porte)
2. Apontar 3 passos concretos (DOC, JUCESP, CNPJ, IE/IM, alvará)
3. Destacar pegadinhas comuns no tipo societário escolhido
4. Mencionar o regime tributário inicial recomendado pelo CNAE
`,
};

export function buildCalculatorAnalysisUserPrompt(
  escritorio: EscritorioProfile,
  params: CalculatorAnalysisParams
): string {
  const context = CALCULATOR_CONTEXT[params.calculatorType];
  const nomeAlvo = params.leadName?.trim() || 'empresário(a)';

  return `
<input>
${formatEscritorioForPrompt(escritorio)}
  <empresario_nome>${nomeAlvo}</empresario_nome>
  <calculadora>${params.calculatorType}</calculadora>
  <dados_informados_pelo_empresario>
${JSON.stringify(params.calculatorInputs, null, 2)}
  </dados_informados_pelo_empresario>
  <resultado_calculado>
${JSON.stringify(params.calculatorResult, null, 2)}
  </resultado_calculado>
  ${params.score !== undefined ? `<score>${params.score}/100</score>` : ''}
  ${params.scoreLevel ? `<nivel>${params.scoreLevel}</nivel>` : ''}
</input>

<context>
${context}
</context>

<task>
Você está gerando a análise NARRATIVA que aparece para o lead DEPOIS que
ele preencheu a calculadora e entregou os dados de contato. O objetivo
não é vender — é demonstrar expertise e gerar reciprocidade.

REGRAS:
- Trate o empresário pelo nome (use ${nomeAlvo})
- 2ª pessoa direta ("você", "sua empresa")
- Use os números REAIS do resultado em destaque numerico
- A análise narrativa deve ter entre 3 e 5 parágrafos
- Cada parágrafo: máximo 3 frases
- Use vocabulário técnico-tributário com tradução quando necessário
- NUNCA invente números — só use o que veio nos inputs/resultado
- Mencione a cidade do escritório (${escritorio.cidade}) ao menos 1x
- Tom: ${escritorio.tomDeVoz}
- Termine com uma observação que prepare o terreno para o CTA do contador
  (sem ser comercial agressivo)
</task>

<output_schema_typescript>
interface CalculatorAnalysisOutput {
  titulo: string;                    // ex: "João, sua análise tributária"
  resumoExecutivo: string;           // 1 frase impactante com número-chave
  analiseNarrativa: string;          // 3-5 parágrafos, separados por \\n\\n
  destaquesNumericos: Array<{        // 2-4 itens
    label: string;                   // ex: "Economia anual estimada"
    valor: string;                   // ex: "R$ 19.200" ou "67%"
  }>;
  proximosPassos: string[];          // 3-5 ações concretas
}
</output_schema_typescript>

Devolva APENAS o JSON.
`.trim();
}
