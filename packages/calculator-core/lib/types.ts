// ============================================================
// Tipos compartilhados para todas as calculadoras
// ============================================================

/** Regimes tributários brasileiros */
export type TaxRegime = 'simples' | 'presumido' | 'real';

/** Tipo de atividade empresarial */
export type ActivityType = 'commerce' | 'services';

/** Anexos do Simples Nacional */
export type SimplesAnnex = 'I' | 'II' | 'III' | 'IV' | 'V';

/** Tipo de empresa */
export type CompanyType = 'mei' | 'me' | 'epp';

/** Nível de saúde fiscal */
export type FiscalHealthLevel = 'green' | 'yellow' | 'red';

// ------------------------------------------------------------
// Faixa do Simples Nacional
// ------------------------------------------------------------
export interface SimplesFaixa {
  /** Limite superior de receita bruta em 12 meses (R$) */
  limit: number;
  /** Alíquota nominal (decimal, ex: 0.04 = 4%) */
  nominalRate: number;
  /** Valor de dedução (R$) */
  deduction: number;
}

// ------------------------------------------------------------
// Inputs
// ------------------------------------------------------------
export interface SimplesInput {
  revenueMonthly: number;
  revenue12m: number;
  annex: SimplesAnnex;
}

export interface PresumidoInput {
  revenueMonthly: number;
  activityType: ActivityType;
}

export interface RealInput {
  revenueMonthly: number;
  expenseMonthly: number;
  activityType: ActivityType;
}

export interface CltInput {
  grossSalary: number;
  hasTransport: boolean;
  hasMealVoucher: boolean;
  mealValue?: number;
}

export interface OpeningInput {
  state: string;
  companyType: CompanyType;
  hasPartners: boolean;
}

export interface QuizInput {
  answers: Record<string, number>;
}

// ------------------------------------------------------------
// Outputs
// ------------------------------------------------------------
export interface SimplesResult {
  effectiveRate: number;
  monthlyTax: number;
  annualTax: number;
  breakdown: {
    annex: SimplesAnnex;
    faixa: number;
    nominalRate: number;
    deduction: number;
    revenue12m: number;
  };
}

export interface PresumidoBreakdown {
  irpj: number;
  csll: number;
  pis: number;
  cofins: number;
  adicional: number;
}

export interface PresumidoResult {
  totalRate: number;
  monthlyTax: number;
  annualTax: number;
  breakdown: PresumidoBreakdown;
}

export interface RealBreakdown {
  irpj: number;
  csll: number;
  pis: number;
  cofins: number;
  adicional: number;
}

export interface RealResult {
  totalRate: number;
  monthlyTax: number;
  annualTax: number;
  breakdown: RealBreakdown;
  profitMargin: number;
}

export interface CltBreakdown {
  inssEmployer: number;
  fgts: number;
  thirteenthProvision: number;
  vacationProvision: number;
  transportVoucher: number;
  mealVoucher: number;
}

export interface CltResult {
  totalMonthlyCost: number;
  employerCost: number;
  provisions: {
    thirteenth: number;
    vacation: number;
  };
  benefits: {
    transport: number;
    meal: number;
  };
  breakdown: CltBreakdown;
}

export interface OpeningCostBreakdown {
  contratoSocial: number;
  juntaComercial: number;
  alvara: number;
  certificadoDigital: number;
  contabilidade: number;
  outros: number;
}

export interface OpeningResult {
  totalCost: number;
  breakdown: OpeningCostBreakdown;
  timeline: string;
}

export interface QuizCategoryScores {
  fiscalCompliance: number;
  financialOrganization: number;
  taxPlanning: number;
  legalObligations: number;
  technology: number;
}

export interface QuizResult {
  totalScore: number;
  level: FiscalHealthLevel;
  categoryScores: QuizCategoryScores;
  recommendations: string[];
}

// ------------------------------------------------------------
// Tipos de calculadora (enum)
// ------------------------------------------------------------
export enum CalculatorType {
  SIMPLES = 'simples',
  PRESUMIDO = 'presumido',
  REAL = 'real',
  CLT = 'clt',
  OPENING = 'opening',
  QUIZ = 'quiz',
  REGIME_COMPARISON = 'regime_comparison',
}

// ------------------------------------------------------------
// Resultado de comparação de regimes
// ------------------------------------------------------------
export interface RegimeComparisonResult {
  simples: SimplesResult | null;
  presumido: PresumidoResult;
  real: RealResult | null;
  cheapest: TaxRegime;
}

// ------------------------------------------------------------
// Lead Gate
// ------------------------------------------------------------
export interface LeadData {
  name: string;
  phone: string;
  email?: string;
}

// ------------------------------------------------------------
// Branding
// ------------------------------------------------------------
export interface Branding {
  name: string;
  logo?: string;
  color?: string;
  phone?: string;
}
