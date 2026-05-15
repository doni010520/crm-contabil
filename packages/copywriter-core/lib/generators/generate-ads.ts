// ============================================================
// Generator — Google Ads e Meta Ads
// ============================================================

import type {
  EscritorioProfile,
  GoogleAdsParams,
  MetaAdsParams,
  GoogleAdsOutput,
  MetaAdsOutput,
  CopyGenerationResult,
} from '../types';
import { buildSystemPrompt } from '../prompts/system-base';
import { buildGoogleAdsUserPrompt } from '../prompts/ads-google';
import { buildMetaAdsUserPrompt } from '../prompts/ads-meta';
import { callLlmJson } from '../llm-client';
import { validateGoogleAds, validateMetaAds } from '../validators/char-limits';
import { COPY_CREDITS_COST } from '../types';

export async function generateGoogleAds(
  escritorio: EscritorioProfile,
  params: GoogleAdsParams
): Promise<CopyGenerationResult> {
  const nichosRelevantes = params.nichoAlvo
    ? [params.nichoAlvo]
    : escritorio.nichos;
  const systemPrompt = buildSystemPrompt(nichosRelevantes);
  const userPrompt = buildGoogleAdsUserPrompt(escritorio, params);

  const { data, tokensInput, tokensOutput, modeloUsado } =
    await callLlmJson<GoogleAdsOutput>({
      systemPrompt,
      userPrompt,
      // Temperature mais baixa em ads — precisão de char limit > criatividade
      temperature: 0.5,
      maxTokens: 5000,
    });

  // Valida e trunca se necessário
  const { output: validated, warnings } = validateGoogleAds(data);

  return {
    output: { tipo: 'google-ads', campanha: validated },
    creditosConsumidos: COPY_CREDITS_COST['google-ads'],
    tokensInput,
    tokensOutput,
    avisos: warnings,
    modeloIA: modeloUsado,
  };
}

export async function generateMetaAds(
  escritorio: EscritorioProfile,
  params: MetaAdsParams
): Promise<CopyGenerationResult> {
  const nichosRelevantes = params.nichoAlvo
    ? [params.nichoAlvo]
    : escritorio.nichos;
  const systemPrompt = buildSystemPrompt(nichosRelevantes);
  const userPrompt = buildMetaAdsUserPrompt(escritorio, params);

  const { data, tokensInput, tokensOutput, modeloUsado } =
    await callLlmJson<MetaAdsOutput>({
      systemPrompt,
      userPrompt,
      temperature: 0.7,
      maxTokens: 4000,
    });

  const { output: validated, warnings } = validateMetaAds(data);

  return {
    output: { tipo: 'meta-ads', campanha: validated },
    creditosConsumidos: COPY_CREDITS_COST['meta-ads'],
    tokensInput,
    tokensOutput,
    avisos: warnings,
    modeloIA: modeloUsado,
  };
}
