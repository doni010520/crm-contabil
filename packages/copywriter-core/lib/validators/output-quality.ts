// ============================================================
// Validador de qualidade de copy — heurística pós-geração
// ============================================================
// Detecta padrões tóxicos no output (clichês, falta de cidade,
// CTA vago) e gera avisos. Não bloqueia, mas sinaliza para
// re-geração ou aprovação manual.
// ============================================================

import { HEADLINES_TOXICAS } from '../knowledge/vocabulary';

const PALAVRAS_VENENO_REGEX = new RegExp(
  [
    'tradi[çc][ãa]o familiar',
    'qualidade e excel[êe]ncia',
    'solu[çc][õo]es personalizadas',
    'foco no cliente',
    'parceiro de sucesso',
    'equipe altamente qualificada',
    'mercado consolidado',
  ].join('|'),
  'gi'
);

const CTA_VAGO_REGEX = /^(Saiba mais|Clique aqui|Conhe[çc]a|Veja mais)$/i;

export interface QualityCheck {
  passou: boolean;
  avisos: string[];
  score: number; // 0 a 100
}

/**
 * Avalia qualidade de qualquer texto copy (página, ad).
 */
export function checkCopyQuality(opts: {
  texto: string;
  cidade: string;
  ctas: string[];
}): QualityCheck {
  const avisos: string[] = [];
  let score = 100;

  // Palavras-veneno
  const matches = opts.texto.match(PALAVRAS_VENENO_REGEX);
  if (matches && matches.length > 0) {
    avisos.push(
      `Detectadas ${matches.length} palavra(s)-veneno: ${[...new Set(matches.map((m) => m.toLowerCase()))].join(', ')}`
    );
    score -= matches.length * 10;
  }

  // Cidade mencionada
  const cidadeRegex = new RegExp(escapeRegex(opts.cidade), 'gi');
  const cidadeMatches = opts.texto.match(cidadeRegex);
  if (!cidadeMatches || cidadeMatches.length < 2) {
    avisos.push(
      `Cidade "${opts.cidade}" mencionada apenas ${cidadeMatches?.length || 0} vez(es) — recomendado pelo menos 2`
    );
    score -= 10;
  }

  // CTAs vagos
  const ctasVagos = opts.ctas.filter((c) => CTA_VAGO_REGEX.test(c.trim()));
  if (ctasVagos.length > 0) {
    avisos.push(`CTAs vagos detectados: ${ctasVagos.join(', ')}`);
    score -= ctasVagos.length * 15;
  }

  // Headlines tóxicas
  const headlinesToxicasDetectadas = HEADLINES_TOXICAS.filter((h) =>
    opts.texto.toLowerCase().includes(h.toLowerCase())
  );
  if (headlinesToxicasDetectadas.length > 0) {
    avisos.push(
      `Headlines tóxicas detectadas: ${headlinesToxicasDetectadas.join(' · ')}`
    );
    score -= 20;
  }

  return {
    passou: score >= 70,
    avisos,
    score: Math.max(0, score),
  };
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
