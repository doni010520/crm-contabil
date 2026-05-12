// ============================================================
// Calculadora - Custo CLT (Empregador)
// ============================================================

import { CLT_RATES } from './tax-tables';
import type { CltResult } from './types';

/**
 * Calcula o custo total de um funcionário CLT para o empregador.
 *
 * Encargos patronais:
 * - INSS patronal: 20%
 * - RAT: 3%
 * - Sistema S: 5,8%
 * - FGTS: 8%
 *
 * Provisões:
 * - 13º salário: 1/12
 * - Férias + 1/3: 1/12 + 1/36
 *
 * Benefícios:
 * - Vale-transporte: empregador paga a diferença (custo - 6% do salário)
 * - Vale-refeição: valor × 22 dias
 */
export function calcClt(
  grossSalary: number,
  hasTransport: boolean,
  hasMealVoucher: boolean,
  mealValue?: number,
): CltResult {
  if (grossSalary <= 0) {
    return {
      totalMonthlyCost: 0,
      employerCost: 0,
      provisions: { thirteenth: 0, vacation: 0 },
      benefits: { transport: 0, meal: 0 },
      breakdown: {
        inssEmployer: 0,
        fgts: 0,
        thirteenthProvision: 0,
        vacationProvision: 0,
        transportVoucher: 0,
        mealVoucher: 0,
      },
    };
  }

  // Encargos sobre a folha (INSS + RAT + Sistema S) = 28,8%
  const totalPayrollRate =
    CLT_RATES.inssEmployer + CLT_RATES.rat + CLT_RATES.sistemaS;
  const inssEmployer = grossSalary * totalPayrollRate;

  // FGTS: 8%
  const fgts = grossSalary * CLT_RATES.fgts;

  // Provisão 13º salário: 1/12 do salário + encargos sobre a provisão
  const thirteenthBase = grossSalary * CLT_RATES.thirteenthProvision;
  const thirteenthProvision =
    thirteenthBase + thirteenthBase * (totalPayrollRate + CLT_RATES.fgts);

  // Provisão férias + 1/3: (1/12 + 1/36) do salário + encargos
  const vacationBase =
    grossSalary *
    (CLT_RATES.vacationProvision + CLT_RATES.vacationBonusProvision);
  const vacationProvision =
    vacationBase + vacationBase * (totalPayrollRate + CLT_RATES.fgts);

  // Vale-transporte
  // O empregado desconta 6% do salário; o empregador arca com o restante.
  // Aqui estimamos um custo padrão de VT (R$400/mês) e calculamos a diferença.
  let transportVoucher = 0;
  if (hasTransport) {
    const estimatedTransportCost = 400; // estimativa média mensal
    const employeeDiscount = grossSalary * CLT_RATES.transportDiscount;
    transportVoucher = Math.max(estimatedTransportCost - employeeDiscount, 0);
  }

  // Vale-refeição
  let mealVoucherCost = 0;
  if (hasMealVoucher && mealValue && mealValue > 0) {
    mealVoucherCost = mealValue * CLT_RATES.workingDays;
  }

  // Custo do empregador (encargos + FGTS, sem provisões)
  const employerCost = grossSalary + inssEmployer + fgts;

  // Custo total mensal
  const totalMonthlyCost =
    grossSalary +
    inssEmployer +
    fgts +
    thirteenthProvision +
    vacationProvision +
    transportVoucher +
    mealVoucherCost;

  return {
    totalMonthlyCost,
    employerCost,
    provisions: {
      thirteenth: thirteenthProvision,
      vacation: vacationProvision,
    },
    benefits: {
      transport: transportVoucher,
      meal: mealVoucherCost,
    },
    breakdown: {
      inssEmployer,
      fgts,
      thirteenthProvision,
      vacationProvision,
      transportVoucher,
      mealVoucher: mealVoucherCost,
    },
  };
}
