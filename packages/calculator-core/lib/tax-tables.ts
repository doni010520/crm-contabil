// ============================================================
// Tabelas tributárias brasileiras - 2024/2025
// ============================================================

import type { SimplesFaixa, ActivityType } from './types';

// ------------------------------------------------------------
// Simples Nacional - Anexo I (Comércio)
// ------------------------------------------------------------
export const SIMPLES_ANEXO_I: SimplesFaixa[] = [
  { limit: 180_000, nominalRate: 0.04, deduction: 0 },
  { limit: 360_000, nominalRate: 0.073, deduction: 5_940 },
  { limit: 720_000, nominalRate: 0.095, deduction: 13_860 },
  { limit: 1_800_000, nominalRate: 0.107, deduction: 22_500 },
  { limit: 3_600_000, nominalRate: 0.143, deduction: 87_300 },
  { limit: 4_800_000, nominalRate: 0.19, deduction: 378_000 },
];

// ------------------------------------------------------------
// Simples Nacional - Anexo II (Indústria)
// ------------------------------------------------------------
export const SIMPLES_ANEXO_II: SimplesFaixa[] = [
  { limit: 180_000, nominalRate: 0.045, deduction: 0 },
  { limit: 360_000, nominalRate: 0.078, deduction: 5_940 },
  { limit: 720_000, nominalRate: 0.10, deduction: 13_860 },
  { limit: 1_800_000, nominalRate: 0.112, deduction: 22_500 },
  { limit: 3_600_000, nominalRate: 0.147, deduction: 87_300 },
  { limit: 4_800_000, nominalRate: 0.30, deduction: 540_000 },
];

// ------------------------------------------------------------
// Simples Nacional - Anexo III (Serviços - ex: contabilidade, TI, etc.)
// ------------------------------------------------------------
export const SIMPLES_ANEXO_III: SimplesFaixa[] = [
  { limit: 180_000, nominalRate: 0.06, deduction: 0 },
  { limit: 360_000, nominalRate: 0.112, deduction: 9_360 },
  { limit: 720_000, nominalRate: 0.135, deduction: 17_640 },
  { limit: 1_800_000, nominalRate: 0.16, deduction: 35_640 },
  { limit: 3_600_000, nominalRate: 0.21, deduction: 125_640 },
  { limit: 4_800_000, nominalRate: 0.33, deduction: 648_000 },
];

// ------------------------------------------------------------
// Simples Nacional - Anexo IV (Serviços - ex: advocacia, limpeza, vigilância)
// ------------------------------------------------------------
export const SIMPLES_ANEXO_IV: SimplesFaixa[] = [
  { limit: 180_000, nominalRate: 0.045, deduction: 0 },
  { limit: 360_000, nominalRate: 0.09, deduction: 8_100 },
  { limit: 720_000, nominalRate: 0.102, deduction: 12_420 },
  { limit: 1_800_000, nominalRate: 0.14, deduction: 39_780 },
  { limit: 3_600_000, nominalRate: 0.22, deduction: 183_780 },
  { limit: 4_800_000, nominalRate: 0.33, deduction: 828_000 },
];

// ------------------------------------------------------------
// Simples Nacional - Anexo V (Serviços - ex: engenharia, auditoria, jornalismo)
// ------------------------------------------------------------
export const SIMPLES_ANEXO_V: SimplesFaixa[] = [
  { limit: 180_000, nominalRate: 0.155, deduction: 0 },
  { limit: 360_000, nominalRate: 0.18, deduction: 4_500 },
  { limit: 720_000, nominalRate: 0.195, deduction: 9_900 },
  { limit: 1_800_000, nominalRate: 0.205, deduction: 17_100 },
  { limit: 3_600_000, nominalRate: 0.23, deduction: 62_100 },
  { limit: 4_800_000, nominalRate: 0.305, deduction: 540_000 },
];

// ------------------------------------------------------------
// Mapa de anexos
// ------------------------------------------------------------
export const SIMPLES_ANNEXES = {
  I: SIMPLES_ANEXO_I,
  II: SIMPLES_ANEXO_II,
  III: SIMPLES_ANEXO_III,
  IV: SIMPLES_ANEXO_IV,
  V: SIMPLES_ANEXO_V,
} as const;

// ------------------------------------------------------------
// Lucro Presumido - Alíquotas
// ------------------------------------------------------------
export const PRESUMIDO_RATES = {
  /** IRPJ: 15% sobre base presumida */
  irpj: 0.15,
  /** CSLL: 9% sobre base presumida */
  csll: 0.09,
  /** PIS cumulativo: 0,65% sobre faturamento */
  pis: 0.0065,
  /** COFINS cumulativo: 3% sobre faturamento */
  cofins: 0.03,
  /** Adicional IRPJ: 10% sobre excedente de R$20.000/mês na base presumida */
  irpjAdicional: 0.10,
  /** Limite mensal para adicional IRPJ (R$) */
  irpjAdicionalThreshold: 20_000,
} as const;

/** Bases de presunção por tipo de atividade */
export const PRESUMIDO_BASES: Record<ActivityType, { irpj: number; csll: number }> = {
  commerce: { irpj: 0.08, csll: 0.12 },
  services: { irpj: 0.32, csll: 0.32 },
} as const;

// ------------------------------------------------------------
// Lucro Real - Alíquotas (regime não-cumulativo)
// ------------------------------------------------------------
export const REAL_RATES = {
  /** IRPJ: 15% sobre lucro real */
  irpj: 0.15,
  /** CSLL: 9% sobre lucro real */
  csll: 0.09,
  /** PIS não-cumulativo: 1,65% sobre receita */
  pis: 0.0165,
  /** COFINS não-cumulativo: 7,6% sobre receita */
  cofins: 0.076,
  /** Adicional IRPJ: 10% sobre excedente de R$20.000/mês */
  irpjAdicional: 0.10,
  /** Limite mensal para adicional IRPJ (R$) */
  irpjAdicionalThreshold: 20_000,
  /** Estimativa de créditos de PIS/COFINS (% das despesas) */
  creditEstimate: 0.60,
} as const;

// ------------------------------------------------------------
// Encargos CLT - Empregador
// ------------------------------------------------------------
export const CLT_RATES = {
  /** INSS patronal */
  inssEmployer: 0.20,
  /** RAT (Risco Ambiental do Trabalho) */
  rat: 0.03,
  /** Sistema S (SESI/SENAI/SESC/SENAC etc.) */
  sistemaS: 0.058,
  /** Total encargos sobre folha (INSS + RAT + Sistema S) */
  get totalPayroll() {
    return this.inssEmployer + this.rat + this.sistemaS; // 0.288
  },
  /** FGTS */
  fgts: 0.08,
  /** Provisão 13º salário: 1/12 */
  thirteenthProvision: 1 / 12,
  /** Provisão férias: 1/12 */
  vacationProvision: 1 / 12,
  /** Provisão 1/3 férias: 1/36 */
  vacationBonusProvision: 1 / 36,
  /** Desconto vale-transporte do empregado: 6% do salário */
  transportDiscount: 0.06,
  /** Dias úteis mensais (para cálculo de VR/VA) */
  workingDays: 22,
} as const;
