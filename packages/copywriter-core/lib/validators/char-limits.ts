// ============================================================
// Validador de limites de caracteres (Google e Meta Ads)
// ============================================================
// Validação pós-geração: se algum elemento estourou o limite, a
// validação registra um aviso e tenta truncar de forma inteligente.
// LLMs ainda falham ~10% em contagem exata — esta camada protege.
// ============================================================

import type { GoogleAdsOutput, MetaAdsOutput } from '../types';

export const GOOGLE_LIMITS = {
  headline: 30,
  description: 90,
  callout: 25,
  sitelinkText: 25,
  sitelinkDescription: 35,
} as const;

export const META_LIMITS = {
  primaryText: 125,
  primaryTextHard: 150, // limite "duro" — só ultrapassa em casos essenciais
  headline: 40,
  description: 30,
} as const;

export interface ValidationResult<T> {
  output: T;
  warnings: string[];
}

/**
 * Trunca texto no último espaço antes do limite, evitando cortar
 * palavras pela metade. Adiciona reticência se cortou.
 */
function smartTruncate(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const cut = text.slice(0, maxChars - 1);
  const lastSpace = cut.lastIndexOf(' ');
  if (lastSpace > maxChars * 0.7) {
    return cut.slice(0, lastSpace);
  }
  return cut;
}

/**
 * Valida e corrige output do Google Ads.
 */
export function validateGoogleAds(
  output: GoogleAdsOutput
): ValidationResult<GoogleAdsOutput> {
  const warnings: string[] = [];

  const adGroups = output.adGroups.map((ag, agIdx) => {
    const headlines = ag.headlines.map((h, i) => {
      if (h.length > GOOGLE_LIMITS.headline) {
        warnings.push(
          `AdGroup ${agIdx + 1} headline ${i + 1} estourou (${h.length}/${GOOGLE_LIMITS.headline}): "${h}"`
        );
        return smartTruncate(h, GOOGLE_LIMITS.headline);
      }
      return h;
    });

    const descriptions = ag.descriptions.map((d, i) => {
      if (d.length > GOOGLE_LIMITS.description) {
        warnings.push(
          `AdGroup ${agIdx + 1} description ${i + 1} estourou (${d.length}/${GOOGLE_LIMITS.description})`
        );
        return smartTruncate(d, GOOGLE_LIMITS.description);
      }
      return d;
    });

    const callouts = ag.callouts.map((c, i) => {
      if (c.length > GOOGLE_LIMITS.callout) {
        warnings.push(
          `AdGroup ${agIdx + 1} callout ${i + 1} estourou (${c.length}/${GOOGLE_LIMITS.callout})`
        );
        return smartTruncate(c, GOOGLE_LIMITS.callout);
      }
      return c;
    });

    const sitelinks = ag.sitelinks.map((s, i) => {
      const t = s.texto.length > GOOGLE_LIMITS.sitelinkText
        ? (warnings.push(`Sitelink ${i + 1} texto estourou`), smartTruncate(s.texto, GOOGLE_LIMITS.sitelinkText))
        : s.texto;
      const d1 = s.descricao1.length > GOOGLE_LIMITS.sitelinkDescription
        ? smartTruncate(s.descricao1, GOOGLE_LIMITS.sitelinkDescription)
        : s.descricao1;
      const d2 = s.descricao2.length > GOOGLE_LIMITS.sitelinkDescription
        ? smartTruncate(s.descricao2, GOOGLE_LIMITS.sitelinkDescription)
        : s.descricao2;
      return { texto: t, descricao1: d1, descricao2: d2 };
    });

    return { ...ag, headlines, descriptions, callouts, sitelinks };
  });

  return { output: { ...output, adGroups }, warnings };
}

/**
 * Valida e corrige output do Meta Ads.
 */
export function validateMetaAds(
  output: MetaAdsOutput
): ValidationResult<MetaAdsOutput> {
  const warnings: string[] = [];

  const variacoes = output.variacoes.map((v, i) => {
    let primaryText = v.primaryText;
    let headline = v.headline;
    let description = v.description;

    if (primaryText.length > META_LIMITS.primaryTextHard) {
      warnings.push(
        `Variação ${i + 1} primaryText estourou (${primaryText.length}/${META_LIMITS.primaryTextHard})`
      );
      primaryText = smartTruncate(primaryText, META_LIMITS.primaryText);
    }

    if (headline.length > META_LIMITS.headline) {
      warnings.push(
        `Variação ${i + 1} headline estourou (${headline.length}/${META_LIMITS.headline}): "${headline}"`
      );
      headline = smartTruncate(headline, META_LIMITS.headline);
    }

    if (description.length > META_LIMITS.description) {
      warnings.push(
        `Variação ${i + 1} description estourou (${description.length}/${META_LIMITS.description})`
      );
      description = smartTruncate(description, META_LIMITS.description);
    }

    return { ...v, primaryText, headline, description };
  });

  return { output: { ...output, variacoes }, warnings };
}
