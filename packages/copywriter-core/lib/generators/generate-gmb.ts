// ============================================================
// Generator — Google Meu Negócio (descrição, post)
// ============================================================

import type {
  EscritorioProfile,
  GmbDescricaoParams,
  GmbPostParams,
  GmbDescricaoOutput,
  GmbPostOutput,
  CopyGenerationResult,
} from '../types';
import { buildSystemPrompt } from '../prompts/system-base';
import { buildGmbDescricaoUserPrompt } from '../prompts/gmb-descricao';
import { buildGmbPostUserPrompt } from '../prompts/gmb-post';
import { callLlmJson } from '../llm-client';
import { COPY_CREDITS_COST } from '../types';

const GMB_DESCRICAO_MAX = 750;
const GMB_POST_MAX = 1500;

function truncate(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max - 1).trimEnd();
}

export async function generateGmbDescricao(
  escritorio: EscritorioProfile,
  params: GmbDescricaoParams
): Promise<CopyGenerationResult> {
  const systemPrompt = buildSystemPrompt(escritorio.nichos);
  const userPrompt = buildGmbDescricaoUserPrompt(escritorio, params);
  const maxChars = params.maxChars || GMB_DESCRICAO_MAX;

  const { data, tokensInput, tokensOutput, modeloUsado } =
    await callLlmJson<GmbDescricaoOutput>({
      systemPrompt,
      userPrompt,
      temperature: 0.6,
      maxTokens: 1500,
    });

  const avisos: string[] = [];
  if (data.descricao.length > maxChars) {
    avisos.push(
      `Descrição estourou (${data.descricao.length}/${maxChars}) — truncada`
    );
    data.descricao = truncate(data.descricao, maxChars);
  }

  return {
    output: { tipo: 'gmb-descricao', conteudo: data },
    creditosConsumidos: COPY_CREDITS_COST['gmb-descricao'],
    tokensInput,
    tokensOutput,
    avisos,
    modeloIA: modeloUsado,
  };
}

export async function generateGmbPost(
  escritorio: EscritorioProfile,
  params: GmbPostParams
): Promise<CopyGenerationResult> {
  const systemPrompt = buildSystemPrompt(escritorio.nichos);
  const userPrompt = buildGmbPostUserPrompt(escritorio, params);

  const { data, tokensInput, tokensOutput, modeloUsado } =
    await callLlmJson<GmbPostOutput>({
      systemPrompt,
      userPrompt,
      temperature: 0.7,
      maxTokens: 1200,
    });

  const avisos: string[] = [];
  if (data.conteudo.length > GMB_POST_MAX) {
    avisos.push(
      `Conteúdo do post estourou (${data.conteudo.length}/${GMB_POST_MAX}) — truncado`
    );
    data.conteudo = truncate(data.conteudo, GMB_POST_MAX);
  }

  return {
    output: { tipo: 'gmb-post', conteudo: data },
    creditosConsumidos: COPY_CREDITS_COST['gmb-post'],
    tokensInput,
    tokensOutput,
    avisos,
    modeloIA: modeloUsado,
  };
}
