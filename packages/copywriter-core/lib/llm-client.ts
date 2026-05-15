// ============================================================
// Cliente LLM — wrapper OpenAI com JSON mode e retry
// ============================================================
// Centraliza chamadas para o modelo. Usa GPT-4o (já presente no
// CRM) com JSON mode para garantir output parseable.
// ============================================================

import OpenAI from 'openai';

const MODEL_DEFAULT = 'gpt-4o';
const MAX_RETRIES = 2;

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY não configurada no ambiente');
    }
    _client = new OpenAI({ apiKey });
  }
  return _client;
}

export interface LlmCallResult<T> {
  data: T;
  tokensInput: number;
  tokensOutput: number;
  modeloUsado: string;
}

/**
 * Chama o LLM com system + user prompt e força resposta JSON.
 * Faz parse + retry se vier inválido.
 */
export async function callLlmJson<T>(opts: {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<LlmCallResult<T>> {
  const model = opts.model || MODEL_DEFAULT;
  const temperature = opts.temperature ?? 0.7;
  const maxTokens = opts.maxTokens ?? 4096;
  const client = getClient();

  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model,
        temperature,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: opts.systemPrompt },
          { role: 'user', content: opts.userPrompt },
        ],
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Resposta vazia do LLM');
      }

      const parsed = JSON.parse(content) as T;

      return {
        data: parsed,
        tokensInput: response.usage?.prompt_tokens || 0,
        tokensOutput: response.usage?.completion_tokens || 0,
        modeloUsado: model,
      };
    } catch (err) {
      lastError = err;
      if (attempt === MAX_RETRIES) break;
      // Pequeno delay exponencial
      await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt)));
    }
  }

  throw new Error(
    `Falha ao chamar LLM após ${MAX_RETRIES + 1} tentativas: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`
  );
}
