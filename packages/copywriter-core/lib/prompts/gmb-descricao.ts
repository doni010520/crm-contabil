// ============================================================
// User prompt — Descrição do perfil Google Meu Negócio
// ============================================================

import type { EscritorioProfile, GmbDescricaoParams } from '../types';
import { formatEscritorioForPrompt } from './shared';

export function buildGmbDescricaoUserPrompt(
  escritorio: EscritorioProfile,
  params: GmbDescricaoParams
): string {
  const maxChars = params.maxChars || 750;

  return `
<input>
${formatEscritorioForPrompt(escritorio)}
  <limite_descricao>${maxChars} caracteres (limite oficial GMB)</limite_descricao>
</input>

<task>
Gere o conteúdo completo para o perfil Google Meu Negócio.

REGRAS ESPECÍFICAS DO GMB:
1. O Google indexa essa descrição — palavras-chave do nicho + cidade são CRUCIAIS para SEO local
2. A descrição aparece nos 1° resultados quando alguém busca "contador em [cidade]"
3. O Google PROÍBE: ofertas, preços, descontos, urgência ("ligue agora"), URLs, e-mail, telefone
4. Tom direto, especializado. Sem promessas genéricas.

OBRIGATÓRIO:
- Mencionar a CIDADE pelo menos 1x na descrição
- Mencionar pelo menos 1 dos NICHOS cadastrados (se houver)
- Usar 1-2 termos técnicos específicos da contabilidade (CRC, NFS-e, regime tributário, etc.) — mostra expertise
- Encerrar com proposta de valor concreta, nunca com "entre em contato"

CATEGORIA PRIMÁRIA GMB:
Escolha UMA das categorias oficiais do Google em português:
- "Escritório de contabilidade" (padrão)
- "Contador" (se for autônomo)
- "Consultor tributário"
- "Empresa de serviços contábeis"

CATEGORIAS SECUNDÁRIAS:
Sugira 2-4 categorias secundárias compatíveis (ex: "Consultor financeiro",
"Empresa de assessoria empresarial").

SERVIÇOS SUGERIDOS:
Liste 6-10 serviços específicos para preencher na seção "Serviços" do GMB,
baseados nos serviços que o escritório oferece. Use termos que clientes buscam:
"Abertura de empresa", "Troca de contador", "Contabilidade para médicos", etc.

ATRIBUTOS SUGERIDOS:
Liste 3-5 atributos relevantes que o Google permite (ex: "Atende online",
"Estacionamento próprio", "Acessível para cadeirantes", "Aceita cartão").
</task>

<output_schema_typescript>
interface GmbDescricaoOutput {
  descricao: string;                            // ≤${maxChars} chars
  categoriaPrimariaRecomendada: string;
  categoriasSecundariasRecomendadas: string[];  // 2-4 itens
  servicosSugeridos: string[];                  // 6-10 itens
  atributosSugeridos: string[];                 // 3-5 itens
}
</output_schema_typescript>

Devolva APENAS o JSON.
`.trim();
}
