// ============================================================
// Calculadora - Lucro Real (estimativa simplificada)
// ============================================================

import { REAL_RATES } from './tax-tables';
import type { ActivityType, RealResult } from './types';

/**
 * Calcula estimativa de impostos pelo Lucro Real.
 *
 * - IRPJ: 15% sobre lucro + 10% adicional sobre excedente de R$20k/mês
 * - CSLL: 9% sobre lucro
 * - PIS: 1,65% sobre receita (não-cumulativo) menos créditos
 * - COFINS: 7,6% sobre receita (não-cumulativo) menos créditos
 *
 * Créditos de PIS/COFINS estimados em 60% das despesas.
 */
export function calcReal(
  revenueMonthly: number,
  expenseMonthly: number,
  _activityType: ActivityType,
): RealResult {
  if (revenueMonthly <= 0) {
    return {
      totalRate: 0,
      monthlyTax: 0,
      annualTax: 0,
      breakdown: { irpj: 0, csll: 0, pis: 0, cofins: 0, adicional: 0 },
      profitMargin: 0,
    };
  }

  // Lucro = Receita - Despesas
  const profit = Math.max(revenueMonthly - expenseMonthly, 0);
  const profitMargin = revenueMonthly > 0 ? profit / revenueMonthly : 0;

  // IRPJ: 15% sobre o lucro
  const irpj = profit * REAL_RATES.irpj;

  // CSLL: 9% sobre o lucro
  const csll = profit * REAL_RATES.csll;

  // Créditos estimados (60% das despesas)
  const creditBase = expenseMonthly * REAL_RATES.creditEstimate;

  // PIS não-cumulativo: 1,65% sobre receita - créditos de 1,65% sobre base de crédito
  const pisDebito = revenueMonthly * REAL_RATES.pis;
  const pisCredito = creditBase * REAL_RATES.pis;
  const pis = Math.max(pisDebito - pisCredito, 0);

  // COFINS não-cumulativo: 7,6% sobre receita - créditos de 7,6% sobre base de crédito
  const cofinsDebito = revenueMonthly * REAL_RATES.cofins;
  const cofinsCredito = creditBase * REAL_RATES.cofins;
  const cofins = Math.max(cofinsDebito - cofinsCredito, 0);

  // Adicional IRPJ: 10% sobre excedente de R$20.000/mês no lucro
  let adicional = 0;
  if (profit > REAL_RATES.irpjAdicionalThreshold) {
    adicional =
      (profit - REAL_RATES.irpjAdicionalThreshold) * REAL_RATES.irpjAdicional;
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
    profitMargin,
  };
}
