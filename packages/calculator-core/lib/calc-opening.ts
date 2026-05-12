// ============================================================
// Calculadora - Custo de Abertura de Empresa
// ============================================================

import type { CompanyType, OpeningResult, OpeningCostBreakdown } from './types';

/** Custos por estado (valores estimados em R$) */
interface StateCosts {
  contratoSocial: [number, number]; // [min, max]
  juntaComercial: number;
  alvara: [number, number];
  certificadoDigital: number;
  contabilidade: number;
  outros: number;
  timeline: string;
}

const STATE_COSTS: Record<string, StateCosts> = {
  SP: {
    contratoSocial: [200, 400],
    juntaComercial: 148,
    alvara: [200, 600],
    certificadoDigital: 150,
    contabilidade: 500,
    outros: 100,
    timeline: '15-30 dias',
  },
  RJ: {
    contratoSocial: [200, 400],
    juntaComercial: 237,
    alvara: [200, 500],
    certificadoDigital: 150,
    contabilidade: 500,
    outros: 120,
    timeline: '20-40 dias',
  },
  MG: {
    contratoSocial: [150, 350],
    juntaComercial: 137,
    alvara: [150, 400],
    certificadoDigital: 150,
    contabilidade: 450,
    outros: 100,
    timeline: '15-30 dias',
  },
  BA: {
    contratoSocial: [150, 350],
    juntaComercial: 155,
    alvara: [150, 400],
    certificadoDigital: 150,
    contabilidade: 400,
    outros: 80,
    timeline: '20-35 dias',
  },
  PR: {
    contratoSocial: [150, 350],
    juntaComercial: 132,
    alvara: [150, 400],
    certificadoDigital: 150,
    contabilidade: 450,
    outros: 90,
    timeline: '15-25 dias',
  },
  RS: {
    contratoSocial: [150, 350],
    juntaComercial: 140,
    alvara: [150, 450],
    certificadoDigital: 150,
    contabilidade: 450,
    outros: 90,
    timeline: '15-30 dias',
  },
  SC: {
    contratoSocial: [150, 300],
    juntaComercial: 130,
    alvara: [100, 350],
    certificadoDigital: 150,
    contabilidade: 400,
    outros: 80,
    timeline: '10-25 dias',
  },
  PE: {
    contratoSocial: [150, 350],
    juntaComercial: 145,
    alvara: [100, 350],
    certificadoDigital: 150,
    contabilidade: 400,
    outros: 80,
    timeline: '20-35 dias',
  },
  CE: {
    contratoSocial: [150, 300],
    juntaComercial: 138,
    alvara: [100, 300],
    certificadoDigital: 150,
    contabilidade: 400,
    outros: 80,
    timeline: '20-35 dias',
  },
  DF: {
    contratoSocial: [200, 400],
    juntaComercial: 160,
    alvara: [150, 400],
    certificadoDigital: 150,
    contabilidade: 500,
    outros: 100,
    timeline: '15-30 dias',
  },
};

/** Estado padrão (média nacional) para estados não listados */
const DEFAULT_COSTS: StateCosts = {
  contratoSocial: [150, 350],
  juntaComercial: 150,
  alvara: [150, 400],
  certificadoDigital: 150,
  contabilidade: 450,
  outros: 100,
  timeline: '20-35 dias',
};

/**
 * Calcula o custo estimado de abertura de empresa.
 *
 * Considera: estado, tipo de empresa e presença de sócios.
 */
export function calcOpening(
  state: string,
  companyType: CompanyType,
  hasPartners: boolean,
): OpeningResult {
  const costs = STATE_COSTS[state.toUpperCase()] ?? DEFAULT_COSTS;

  // MEI tem custos reduzidos (geralmente gratuito na Junta)
  if (companyType === 'mei') {
    const breakdown: OpeningCostBreakdown = {
      contratoSocial: 0,
      juntaComercial: 0,
      alvara: 0,
      certificadoDigital: costs.certificadoDigital,
      contabilidade: 0, // MEI não obriga contador
      outros: 50,
    };

    return {
      totalCost: breakdown.certificadoDigital + breakdown.outros,
      breakdown,
      timeline: '1-5 dias',
    };
  }

  // ME e EPP
  // Contrato social: mais caro se tem sócios
  const contratoSocial = hasPartners
    ? costs.contratoSocial[1]
    : costs.contratoSocial[0];

  // Alvará: EPP tende a ser mais caro
  const alvara =
    companyType === 'epp' ? costs.alvara[1] : costs.alvara[0];

  // Contabilidade: EPP geralmente paga mais
  const contabilidade =
    companyType === 'epp'
      ? costs.contabilidade * 1.3
      : costs.contabilidade;

  const breakdown: OpeningCostBreakdown = {
    contratoSocial,
    juntaComercial: costs.juntaComercial,
    alvara,
    certificadoDigital: costs.certificadoDigital,
    contabilidade: Math.round(contabilidade),
    outros: costs.outros,
  };

  const totalCost = Object.values(breakdown).reduce((sum, v) => sum + v, 0);

  return {
    totalCost,
    breakdown,
    timeline: costs.timeline,
  };
}

/** Lista de estados disponíveis */
export const AVAILABLE_STATES = [
  { code: 'SP', name: 'São Paulo' },
  { code: 'RJ', name: 'Rio de Janeiro' },
  { code: 'MG', name: 'Minas Gerais' },
  { code: 'BA', name: 'Bahia' },
  { code: 'PR', name: 'Paraná' },
  { code: 'RS', name: 'Rio Grande do Sul' },
  { code: 'SC', name: 'Santa Catarina' },
  { code: 'PE', name: 'Pernambuco' },
  { code: 'CE', name: 'Ceará' },
  { code: 'DF', name: 'Distrito Federal' },
] as const;
