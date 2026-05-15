// ============================================================
// User prompt — geração de Home do site
// ============================================================

import type { EscritorioProfile, SiteHomeParams } from '../types';
import { CTA_LIBRARY } from '../knowledge/cta-library';

export function buildSiteHomeUserPrompt(
  escritorio: EscritorioProfile,
  params: SiteHomeParams
): string {
  const cta = CTA_LIBRARY[escritorio.ctaPrimario];

  return `
<input>
${formatEscritorio(escritorio)}
</input>

<task>
Gere a HOME COMPLETA do site de contabilidade conforme as 10 seções abaixo. A copy deve seguir o framework PAS (Problema · Agitação · Solução) na seção de dores, e o tom solicitado (${escritorio.tomDeVoz}).

CTA primário escolhido: "${cta.textoLongo}" (estágio: ${cta.estagioFunil})
</task>

<sections_required>
1. hero — H1 (com nicho + cidade), subheadline, 3 bullets de confiança, CTA primário + WhatsApp
2. prova-social — números reais (anos, clientes, cases) + selos CRC/parcerias
3. dores-pas — 3 dores em PAS, baseadas nas dores que o escritório descreveu
4. servicos — grid dos serviços oferecidos, cada um traduzido em benefício
5. nichos — cards dos nichos atendidos com 1 linha de promessa cada
6. processo — 3-5 passos do "como funciona" (diagnóstico → migração → operação)
7. diferenciais — os 3 diferenciais informados, expandidos
8. depoimentos — usar APENAS os cases fornecidos no input (zero inventados)
9. faq — 6 perguntas reais (preço, prazo, troca, atendimento, garantia, nicho)
10. cta-final — headline de fechamento + faixa CTA + endereço com cidade
</sections_required>

<output_schema_typescript>
interface SitePageOutput {
  url: "/";
  title: string;              // <title>, ≤60 chars, com cidade
  metaDescription: string;    // ≤155 chars, com cidade + benefício
  h1: string;                 // headline principal do hero
  schemaJsonLd: {             // AccountingService JSON-LD pronto
    "@context": "https://schema.org",
    "@type": "AccountingService",
    name: string,
    address: { "@type": "PostalAddress", addressLocality: string, addressRegion: string },
    telephone?: string,
    url?: string,
    areaServed: string,
    priceRange?: string
  };
  sections: Array<{
    tipo: "hero" | "prova-social" | "dores-pas" | "servicos" | "nichos" |
          "processo" | "diferenciais" | "depoimentos" | "faq" | "cta-final";
    headline?: string;
    subheadline?: string;
    bullets?: string[];
    faq?: Array<{ pergunta: string; resposta: string }>;
    cta?: { texto: string; href: string };
    copyHtml: string;         // bloco HTML pronto pra colar no construtor
  }>;
  instrucoesUso: string;      // texto para o contador: como usar este output
}
</output_schema_typescript>

Devolva APENAS o JSON. Sem markdown fences. Sem texto explicativo antes ou depois.
`.trim();
}

function formatEscritorio(e: EscritorioProfile): string {
  return `
  <nome>${e.nome}</nome>
  <cidade>${e.cidade}${e.bairroPrincipal ? ` (bairro: ${e.bairroPrincipal})` : ''}</cidade>
  <atende_remoto>${e.atendeRemoto ? 'sim' : 'não'}</atende_remoto>
  <crc>${e.crcUf} ${e.crcNumero}</crc>
  <anos_mercado>${e.anosMercado}</anos_mercado>
  <faixa_clientes>${e.faixaClientes}</faixa_clientes>
  <nichos>${e.nichos.join(', ')}</nichos>
  <servicos>${e.servicos.join(', ')}</servicos>
  <modelo_preco>${e.modeloPreco}${e.precoInicialMensal ? ` (a partir de R$ ${e.precoInicialMensal}/mês)` : ''}</modelo_preco>
  <diferenciais>
${e.diferenciais.map((d, i) => `    ${i + 1}. ${d}`).join('\n')}
  </diferenciais>
  <persona>${e.persona}</persona>
  <dores_principais>
${e.doresPrincipais.map((d, i) => `    ${i + 1}. ${d}`).join('\n')}
  </dores_principais>
  <cases>
${e.cases.map((c) => `    - segmento: ${c.segmento} · porte: ${c.porte} · resultado: ${c.resultado}${c.nomeCliente ? ` · cliente: ${c.nomeCliente}` : ''}`).join('\n')}
  </cases>
  <tom_de_voz>${e.tomDeVoz}</tom_de_voz>
  <cta_primario>${e.ctaPrimario}</cta_primario>
  <whatsapp>${e.whatsapp || 'não informado'}</whatsapp>
  <selos>${(e.selos || []).join(', ') || 'nenhum'}</selos>
`.trim();
}
