// ============================================================
// Calculadora - Lucro Presumido
// ============================================================

import { PRESUMIDO_RATES, PRESUMIDO_BASES } from './tax-tables';
import type { ActivityType, PresumidoResult } from './types';

/**
 * Calcula o imposto pelo regime de Lucro Presumido.
 *
 * Calcula separadamente: IRPJ, CSLL, PIS, COFINS e adicional de IRPJ.
 */
export function calcPresumido(
  revenueMonthly: number,
  activityType: ActivityType,
): PresumidoResult {
  if (revenueMonthly <= 0) {
    return {
      totalRate: 0,
      monthlyTax: 0,
      annualTax: 0,
      breakdown: { irpj: 0, csll: 0, pis: 0, cofins: 0, adicional: 0 },
    };
  }

  const bases = PRESUMIDO_BASES[activityType];

  // Bases presumidas mensais
  const baseIrpj = revenueMonthly * bases.irpj;
  const baseCsll = revenueMonthly * bases.csll;

  // IRPJ: 15% sobre base presumida
  const irpj = baseIrpj * PRESUMIDO_RATES.irpj;

  // CSLL: 9% sobre base presumida
  const csll = baseCsll * PRESUMIDO_RATES.csll;

  // PIS: 0,65% sobre faturamento (cumulativo)
  const pis = revenueMonthly * PRESUMIDO_RATES.pis;

  // COFINS: 3% sobre faturamento (cumulativo)
  const cofins = revenueMonthly * PRESUMIDO_RATES.cofins;

  // Adicional IRPJ: 10% sobre o que exceder R$20.000/mês na base presumida
  let adicional = 0;
  if (baseIrpj > PRESUMIDO_RATES.irpjAdicionalThreshold) {
    adicional =
      (baseIrpj - PRESUMIDO_RATES.irpjAdicionalThreshold) *
      PRESUMIDO_RATES.irpjAdicional;
  }

  const monthlyTax = irpj + csll + pis + cofins + adicional;
  const totalRate = revenueMonthly > 0 ? monthlyTax / revenueMonthly : 0;
  const annualTax = monthlyTax * 12;

  return {
    totalRate,
    monthlyTax,
    annualTax,
    breakdown: {
      irpj,
      csll,
      pis,
      cofins,
      adicional,
    },
  };
}
