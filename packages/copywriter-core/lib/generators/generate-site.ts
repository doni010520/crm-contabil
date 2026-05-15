// ============================================================
// Generator — páginas de site (Home, LP de nicho, Serviço)
// ============================================================

import type {
  EscritorioProfile,
  SiteHomeParams,
  SiteLpNichoParams,
  SiteServicoParams,
  SitePageOutput,
  CopyGenerationResult,
} from '../types';
import { buildSystemPrompt } from '../prompts/system-base';
import { buildSiteHomeUserPrompt } from '../prompts/site-home';
import { buildSiteLpNichoUserPrompt } from '../prompts/site-lp-nicho';
import { buildSiteServicoUserPrompt } from '../prompts/site-servico';
import { callLlmJson } from '../llm-client';
import { checkCopyQuality } from '../validators/output-quality';
import { COPY_CREDITS_COST } from '../types';

export async function generateSiteHome(
  escritorio: EscritorioProfile,
  params: SiteHomeParams
): Promise<CopyGenerationResult> {
  const systemPrompt = buildSystemPrompt(escritorio.nichos);
  const userPrompt = buildSiteHomeUserPrompt(escritorio, params);

  const { data, tokensInput, tokensOutput, modeloUsado } =
    await callLlmJson<SitePageOutput>({
      systemPrompt,
      userPrompt,
      maxTokens: 6000,
    });

  const allText = JSON.stringify(data);
  const quality = checkCopyQuality({
    texto: allText,
    cidade: escritorio.cidade,
    ctas: data.sections.flatMap((s) => (s.cta ? [s.cta.texto] : [])),
  });

  return {
    output: { tipo: 'site', pagina: data },
    creditosConsumidos: COPY_CREDITS_COST['site-home'],
    tokensInput,
    tokensOutput,
    avisos: quality.avisos,
    modeloIA: modeloUsado,
  };
}

export async function generateSiteLpNicho(
  escritorio: EscritorioProfile,
  params: SiteLpNichoParams
): Promise<CopyGenerationResult> {
  const systemPrompt = buildSystemPrompt([params.nicho]);
  const userPrompt = buildSiteLpNichoUserPrompt(escritorio, params);

  const { data, tokensInput, tokensOutput, modeloUsado } =
    await callLlmJson<SitePageOutput>({
      systemPrompt,
      userPrompt,
      maxTokens: 5000,
    });

  const allText = JSON.stringify(data);
  const quality = checkCopyQuality({
    texto: allText,
    cidade: params.cidadeAlvo || escritorio.cidade,
    ctas: data.sections.flatMap((s) => (s.cta ? [s.cta.texto] : [])),
  });

  return {
    output: { tipo: 'site', pagina: data },
    creditosConsumidos: COPY_CREDITS_COST['site-lp-nicho'],
    tokensInput,
    tokensOutput,
    avisos: quality.avisos,
    modeloIA: modeloUsado,
  };
}

export async function generateSiteServico(
  escritorio: EscritorioProfile,
  params: SiteServicoParams
): Promise<CopyGenerationResult> {
  const systemPrompt = buildSystemPrompt(escritorio.nichos);
  const userPrompt = buildSiteServicoUserPrompt(escritorio, params);

  const { data, tokensInput, tokensOutput, modeloUsado } =
    await callLlmJson<SitePageOutput>({
      systemPrompt,
      userPrompt,
      maxTokens: 4500,
    });

  const allText = JSON.stringify(data);
  const quality = checkCopyQuality({
    texto: allText,
    cidade: params.cidadeAlvo || escritorio.cidade,
    ctas: data.sections.flatMap((s) => (s.cta ? [s.cta.texto] : [])),
  });

  return {
    output: { tipo: 'site', pagina: data },
    creditosConsumidos: COPY_CREDITS_COST['site-servico'],
    tokensInput,
    tokensOutput,
    avisos: quality.avisos,
    modeloIA: modeloUsado,
  };
}
