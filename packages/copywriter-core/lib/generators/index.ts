// ============================================================
// Dispatcher unificado — escolhe o generator certo pelo modo
// ============================================================

import type {
  CopyGenerationRequest,
  CopyGenerationResult,
} from '../types';
import {
  generateSiteHome,
  generateSiteLpNicho,
  generateSiteServico,
} from './generate-site';
import { generateGoogleAds, generateMetaAds } from './generate-ads';
import {
  generateGmbDescricao,
  generateGmbPost,
  generateGmbReviewReply,
} from './generate-gmb';

/**
 * Ponto de entrada único. Roteia para o generator correto baseado
 * no modo solicitado.
 */
export async function generateCopy(
  request: CopyGenerationRequest
): Promise<CopyGenerationResult> {
  const { escritorio, geracao } = request;

  switch (geracao.modo) {
    case 'site-home':
      return generateSiteHome(escritorio, geracao.params);
    case 'site-lp-nicho':
      return generateSiteLpNicho(escritorio, geracao.params);
    case 'site-servico':
      return generateSiteServico(escritorio, geracao.params);
    case 'google-ads':
      return generateGoogleAds(escritorio, geracao.params);
    case 'meta-ads':
      return generateMetaAds(escritorio, geracao.params);
    case 'gmb-descricao':
      return generateGmbDescricao(escritorio, geracao.params);
    case 'gmb-post':
      return generateGmbPost(escritorio, geracao.params);
    case 'gmb-review-reply':
      return generateGmbReviewReply(escritorio, geracao.params);
    default: {
      const _exhaustive: never = geracao;
      throw new Error(`Modo de geração desconhecido: ${JSON.stringify(_exhaustive)}`);
    }
  }
}

export {
  generateSiteHome,
  generateSiteLpNicho,
  generateSiteServico,
  generateGoogleAds,
  generateMetaAds,
  generateGmbDescricao,
  generateGmbPost,
  generateGmbReviewReply,
};
