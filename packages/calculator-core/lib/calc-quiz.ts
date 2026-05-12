// ============================================================
// Calculadora - Quiz de Saúde Fiscal
// ============================================================

import type { FiscalHealthLevel, QuizCategoryScores, QuizResult } from './types';

/** Definição de uma pergunta do quiz */
export interface QuizQuestion {
  id: string;
  category: keyof QuizCategoryScores;
  question: string;
  options: { label: string; value: number }[];
}

/** As 10 perguntas do quiz */
export const QUIZ_QUESTIONS: QuizQuestion[] = [
  // Conformidade Fiscal (2 perguntas)
  {
    id: 'q1',
    category: 'fiscalCompliance',
    question: 'Sua empresa está com todas as obrigações acessórias em dia (SPED, DCTF, EFD)?',
    options: [
      { label: 'Sim, tudo em dia', value: 10 },
      { label: 'Maioria em dia', value: 7 },
      { label: 'Algumas atrasadas', value: 3 },
      { label: 'Não sei / Muito atrasado', value: 0 },
    ],
  },
  {
    id: 'q2',
    category: 'fiscalCompliance',
    question: 'Todas as notas fiscais de entrada e saída são registradas corretamente?',
    options: [
      { label: 'Sim, 100% registradas', value: 10 },
      { label: 'Maioria registrada', value: 7 },
      { label: 'Apenas as de saída', value: 3 },
      { label: 'Não tenho controle', value: 0 },
    ],
  },
  // Organização Financeira (2 perguntas)
  {
    id: 'q3',
    category: 'financialOrganization',
    question: 'Você separa as contas pessoais das contas da empresa?',
    options: [
      { label: 'Sim, completamente', value: 10 },
      { label: 'Na maioria das vezes', value: 7 },
      { label: 'Às vezes misturo', value: 3 },
      { label: 'Não, uso a mesma conta', value: 0 },
    ],
  },
  {
    id: 'q4',
    category: 'financialOrganization',
    question: 'Você tem um controle de fluxo de caixa atualizado?',
    options: [
      { label: 'Sim, diário', value: 10 },
      { label: 'Sim, semanal/mensal', value: 7 },
      { label: 'Faço de vez em quando', value: 3 },
      { label: 'Não tenho controle', value: 0 },
    ],
  },
  // Planejamento Tributário (2 perguntas)
  {
    id: 'q5',
    category: 'taxPlanning',
    question: 'Você já fez uma análise para verificar se está no melhor regime tributário?',
    options: [
      { label: 'Sim, nos últimos 12 meses', value: 10 },
      { label: 'Sim, mas faz tempo', value: 7 },
      { label: 'Nunca fiz', value: 3 },
      { label: 'Não sei o que é isso', value: 0 },
    ],
  },
  {
    id: 'q6',
    category: 'taxPlanning',
    question: 'Você conhece todos os benefícios fiscais disponíveis para sua atividade?',
    options: [
      { label: 'Sim, aproveito vários', value: 10 },
      { label: 'Conheço alguns', value: 7 },
      { label: 'Não conheço', value: 3 },
      { label: 'Não sei que existem', value: 0 },
    ],
  },
  // Obrigações Legais (2 perguntas)
  {
    id: 'q7',
    category: 'legalObligations',
    question: 'O contrato social da empresa está atualizado?',
    options: [
      { label: 'Sim, atualizado', value: 10 },
      { label: 'Precisa de pequenos ajustes', value: 7 },
      { label: 'Está desatualizado', value: 3 },
      { label: 'Não sei', value: 0 },
    ],
  },
  {
    id: 'q8',
    category: 'legalObligations',
    question: 'Seus alvarás e licenças estão válidos?',
    options: [
      { label: 'Sim, todos válidos', value: 10 },
      { label: 'Maioria válida', value: 7 },
      { label: 'Alguns vencidos', value: 3 },
      { label: 'Não tenho / Não sei', value: 0 },
    ],
  },
  // Tecnologia (2 perguntas)
  {
    id: 'q9',
    category: 'technology',
    question: 'Você utiliza um sistema de gestão financeira ou contábil?',
    options: [
      { label: 'Sim, sistema completo', value: 10 },
      { label: 'Sim, planilhas organizadas', value: 7 },
      { label: 'Planilhas básicas', value: 3 },
      { label: 'Controle no papel / Nenhum', value: 0 },
    ],
  },
  {
    id: 'q10',
    category: 'technology',
    question: 'Sua empresa utiliza certificado digital e emite notas fiscais eletrônicas?',
    options: [
      { label: 'Sim, tudo eletrônico', value: 10 },
      { label: 'Sim, mas com dificuldades', value: 7 },
      { label: 'Apenas parte é eletrônica', value: 3 },
      { label: 'Não uso / Não emito NF-e', value: 0 },
    ],
  },
];

/**
 * Calcula o resultado do quiz de saúde fiscal.
 *
 * 10 perguntas, cada uma com pontuação de 0 a 10.
 * Score total: 0-100.
 */
export function calcQuiz(answers: Record<string, number>): QuizResult {
  const categoryScores: QuizCategoryScores = {
    fiscalCompliance: 0,
    financialOrganization: 0,
    taxPlanning: 0,
    legalObligations: 0,
    technology: 0,
  };

  const categoryCounts: Record<keyof QuizCategoryScores, number> = {
    fiscalCompliance: 0,
    financialOrganization: 0,
    taxPlanning: 0,
    legalObligations: 0,
    technology: 0,
  };

  // Somar pontuações por categoria
  for (const question of QUIZ_QUESTIONS) {
    const answer = answers[question.id];
    if (answer !== undefined) {
      categoryScores[question.category] += answer;
      categoryCounts[question.category]++;
    }
  }

  // Normalizar para escala 0-20 por categoria (2 perguntas × 10 pontos)
  const totalScore = Object.values(categoryScores).reduce((sum, v) => sum + v, 0);

  // Determinar nível
  let level: FiscalHealthLevel;
  if (totalScore >= 70) {
    level = 'green';
  } else if (totalScore >= 40) {
    level = 'yellow';
  } else {
    level = 'red';
  }

  // Gerar recomendações baseadas nas categorias mais fracas
  const recommendations: string[] = [];

  if (categoryScores.fiscalCompliance < 14) {
    recommendations.push(
      'Regularize suas obrigações acessórias para evitar multas e penalidades.',
    );
  }
  if (categoryScores.financialOrganization < 14) {
    recommendations.push(
      'Implante um controle de fluxo de caixa e separe as contas PF/PJ.',
    );
  }
  if (categoryScores.taxPlanning < 14) {
    recommendations.push(
      'Faça uma análise tributária para garantir que está no regime mais vantajoso.',
    );
  }
  if (categoryScores.legalObligations < 14) {
    recommendations.push(
      'Atualize o contrato social e renove alvarás/licenças vencidos.',
    );
  }
  if (categoryScores.technology < 14) {
    recommendations.push(
      'Adote um sistema de gestão e certificado digital para mais eficiência.',
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      'Sua empresa está em boa forma! Continue mantendo as boas práticas.',
    );
  }

  return {
    totalScore,
    level,
    categoryScores,
    recommendations,
  };
}
