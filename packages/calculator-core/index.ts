// ============================================================
// @crm-contabil/calculator-core - Barrel Export
// ============================================================

// --- Types ---
export type {
  TaxRegime,
  ActivityType,
  SimplesAnnex,
  CompanyType,
  FiscalHealthLevel,
  SimplesFaixa,
  SimplesInput,
  PresumidoInput,
  RealInput,
  CltInput,
  OpeningInput,
  QuizInput,
  SimplesResult,
  PresumidoBreakdown,
  PresumidoResult,
  RealBreakdown,
  RealResult,
  CltBreakdown,
  CltResult,
  OpeningCostBreakdown,
  OpeningResult,
  QuizCategoryScores,
  QuizResult,
  RegimeComparisonResult,
  LeadData,
  Branding,
} from './lib/types';

export { CalculatorType } from './lib/types';

// --- Tax Tables ---
export {
  SIMPLES_ANEXO_I,
  SIMPLES_ANEXO_II,
  SIMPLES_ANEXO_III,
  SIMPLES_ANEXO_IV,
  SIMPLES_ANEXO_V,
  SIMPLES_ANNEXES,
  PRESUMIDO_RATES,
  PRESUMIDO_BASES,
  REAL_RATES,
  CLT_RATES,
} from './lib/tax-tables';

// --- Calculation Functions ---
export { calcSimples } from './lib/calc-simples';
export { calcPresumido } from './lib/calc-presumido';
export { calcReal } from './lib/calc-real';
export { calcClt } from './lib/calc-clt';
export { calcOpening, AVAILABLE_STATES } from './lib/calc-opening';
export { calcQuiz, QUIZ_QUESTIONS } from './lib/calc-quiz';
export type { QuizQuestion } from './lib/calc-quiz';

// --- Components ---
export { RegimeSimulator } from './components/RegimeSimulator';
export { CltCalculator } from './components/CltCalculator';
export { FiscalHealthQuiz } from './components/FiscalHealthQuiz';
export { OpeningCostCalculator } from './components/OpeningCostCalculator';
export { LeadGate } from './components/LeadGate';
export { CalculatorLayout } from './components/CalculatorLayout';
