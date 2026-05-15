// ============================================================
// Generator — Análise personalizada de calculadora
// ============================================================

import type {
  EscritorioProfile,
  CalculatorAnalysisParams,
  CalculatorAnalysisOutput,
  CopyGenerationResult,
} from '../types';
import { buildSystemPrompt } from '../prompts/system-base';
import { buildCalculatorAnalysisUserPrompt } from '../prompts/calculator-analysis';
import { callLlmJson } from '../llm-client';
import { COPY_CREDITS_COST } from '../types';

export async function generateCalculatorAnalysis(
  escritorio: EscritorioProfile,
  params: CalculatorAnalysisParams
): Promise<CopyGenerationResult> {
  const systemPrompt = buildSystemPrompt(escritorio.nichos);
  const userPrompt = buildCalculatorAnalysisUserPrompt(escritorio, params);

  const { data, tokensInput, tokensOutput, modeloUsado } =
    await callLlmJson<CalculatorAnalysisOutput>({
      systemPrompt,
      userPrompt,
      temperature: 0.5,
      maxTokens: 2000,
    });

  return {
    output: { tipo: 'calculator-analysis', conteudo: data },
    creditosConsumidos: COPY_CREDITS_COST['calculator-analysis'],
    tokensInput,
    tokensOutput,
    avisos: [],
    modeloIA: modeloUsado,
  };
}
