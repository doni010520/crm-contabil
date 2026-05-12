// ============================================================
// Calculadora - Simples Nacional
// ============================================================

import { SIMPLES_ANNEXES } from './tax-tables';
import type { SimplesAnnex, SimplesFaixa, SimplesResult } from './types';

/**
 * Calcula o imposto pelo Simples Nacional.
 *
 * Fórmula da alíquota efetiva:
 *   (RBT12 × AlíqNom - PD) / RBT12
 *
 * Onde:
 *   RBT12 = Receita Bruta acumulada nos últimos 12 meses
 *   AlíqNom = Alíquota nominal da faixa
 *   PD = Parcela a deduzir
 */
export function calcSimples(
  revenueMonthly: number,
  revenue12m: number,
  annex: SimplesAnnex,
): SimplesResult {
  if (revenueMonthly <= 0 || revenue12m <= 0) {
    return {
      effectiveRate: 0,
      monthlyTax: 0,
      annualTax: 0,
      breakdown: {
        annex,
        faixa: 0,
        nominalRate: 0,
        deduction: 0,
        revenue12m,
      },
    };
  }

  const table = SIMPLES_ANNEXES[annex];

  // Limitar ao teto do Simples Nacional
  if (revenue12m > 4_800_000) {
    throw new Error(
      'Receita bruta em 12 meses excede o limite do Simples Nacional (R$ 4.800.000)',
    );
  }

  // Encontrar a faixa correta
  let faixaIndex = 0;
  let faixa: SimplesFaixa = table[0];

  for (let i = 0; i < table.length; i++) {
    if (revenue12m <= table[i].limit) {
      faixa = table[i];
      faixaIndex = i + 1;
      break;
    }
  }

  // Alíquota efetiva = (RBT12 × AlíqNom - PD) / RBT12
  const effectiveRate =
    (revenue12m * faixa.nominalRate - faixa.deduction) / revenue12m;

  const monthlyTax = revenueMonthly * effectiveRate;
  const annualTax = monthlyTax * 12;

  return {
    effectiveRate,
    monthlyTax,
    annualTax,
    breakdown: {
      annex,
      faixa: faixaIndex,
      nominalRate: faixa.nominalRate,
      deduction: faixa.deduction,
      revenue12m,
    },
  };
}
