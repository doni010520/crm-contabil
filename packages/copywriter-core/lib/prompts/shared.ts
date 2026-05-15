// ============================================================
// Helpers compartilhados pelos prompts por modo
// ============================================================

import type { EscritorioProfile } from '../types';

export function formatEscritorioForPrompt(e: EscritorioProfile): string {
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
${e.cases
    .map(
      (c) =>
        `    - segmento: ${c.segmento} · porte: ${c.porte} · resultado: ${c.resultado}${c.nomeCliente ? ` · cliente: ${c.nomeCliente}` : ''}`
    )
    .join('\n')}
  </cases>
  <tom_de_voz>${e.tomDeVoz}</tom_de_voz>
  <cta_primario>${e.ctaPrimario}</cta_primario>
  <whatsapp>${e.whatsapp || 'não informado'}</whatsapp>
  <selos>${(e.selos || []).join(', ') || 'nenhum'}</selos>
`.trim();
}
