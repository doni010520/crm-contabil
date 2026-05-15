// ============================================================
// @crm-contabil/copywriter-core — Barrel Export
// ============================================================

// --- Types ---
export type {
  TomDeVoz,
  ModeloPreco,
  CTAPrimario,
  Nicho,
  Servico,
  FaixaClientes,
  SeloProfissional,
  EstagioFunil,
  FormatoCriativoMeta,
  AnguloMetaAd,
  ObjetivoCampanha,
  CopyMode,
  CaseReal,
  EscritorioProfile,
  SiteHomeParams,
  SiteLpNichoParams,
  SiteServicoParams,
  GoogleAdsParams,
  MetaAdsParams,
  CopyGenerationParams,
  CopyGenerationRequest,
  SectionType,
  SiteSection,
  SitePageOutput,
  MatchType,
  GoogleAdKeyword,
  GoogleSitelink,
  GoogleAdGroup,
  GoogleAdsOutput,
  MetaAdVariation,
  MetaPublicoSugerido,
  MetaAdsOutput,
  CopyGenerationOutput,
  CopyGenerationResult,
} from './lib/types';

export { COPY_CREDITS_COST } from './lib/types';

// --- Knowledge base ---
export {
  SUBSTITUICOES_POSITIVAS,
  POWER_WORDS,
  ACTION_VERBS,
  HEADLINES_TOXICAS,
} from './lib/knowledge/vocabulary';
export {
  PAS,
  STORY_BRAND,
  AIDA,
  ALL_FRAMEWORKS,
  FRAMEWORK_SELECTION_GUIDE,
} from './lib/knowledge/frameworks';
export {
  NICHO_LIBRARY,
  getNichosKnowledge,
  serializeNichosForPrompt,
} from './lib/knowledge/nichos';
export type { NichoKnowledge } from './lib/knowledge/nichos';
export { CTA_LIBRARY, CTA_SECUNDARIO_WHATSAPP } from './lib/knowledge/cta-library';
export type { CTADefinition } from './lib/knowledge/cta-library';

// --- Prompts ---
export { buildSystemPrompt } from './lib/prompts/system-base';
export { buildSiteHomeUserPrompt } from './lib/prompts/site-home';
export { buildSiteLpNichoUserPrompt } from './lib/prompts/site-lp-nicho';
export { buildSiteServicoUserPrompt } from './lib/prompts/site-servico';
export { buildGoogleAdsUserPrompt } from './lib/prompts/ads-google';
export { buildMetaAdsUserPrompt } from './lib/prompts/ads-meta';

// --- Validators ---
export {
  validateGoogleAds,
  validateMetaAds,
  GOOGLE_LIMITS,
  META_LIMITS,
} from './lib/validators/char-limits';
export type { ValidationResult } from './lib/validators/char-limits';
export { checkCopyQuality } from './lib/validators/output-quality';
export type { QualityCheck } from './lib/validators/output-quality';

// --- LLM client ---
export { callLlmJson } from './lib/llm-client';
export type { LlmCallResult } from './lib/llm-client';

// --- Generators (ponto de entrada) ---
export {
  generateCopy,
  generateSiteHome,
  generateSiteLpNicho,
  generateSiteServico,
  generateGoogleAds,
  generateMetaAds,
} from './lib/generators';
