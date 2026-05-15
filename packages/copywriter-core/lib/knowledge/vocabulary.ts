// ============================================================
// Vocabulário — substituições positivas, power words e CTAs
// ============================================================
// LLMs respondem mal a instruções negativas ("NÃO use X"). Em vez
// disso, oferecemos substituições positivas: quando o impulso for
// escrever a coluna esquerda, escreva a coluna direita. Isso ensina
// a alternativa em vez de apenas proibir o clichê.
// ============================================================

export interface Substituicao {
  gatilho: string;
  alternativa: string;
}

/**
 * Substituições para clichês comuns em copy de contabilidade.
 * Cada gatilho é um padrão que o LLM seria tentado a usar; a
 * alternativa é a versão concreta e verificável.
 */
export const SUBSTITUICOES_POSITIVAS: Substituicao[] = [
  {
    gatilho: 'tradição familiar / há mais de X anos no mercado',
    alternativa:
      'Prova social numérica concreta: "350 empresas atendidas em [cidade] desde 2012"',
  },
  {
    gatilho: 'qualidade e excelência',
    alternativa:
      'Diferencial verificável: "Resposta em 4h úteis ou seu mês sai grátis"',
  },
  {
    gatilho: 'soluções personalizadas',
    alternativa:
      'O que torna personalizado: "Um contador dedicado nominal — você sabe com quem fala"',
  },
  {
    gatilho: 'foco no cliente / compromisso',
    alternativa:
      'Prática observável: "Reunião mensal de 30 min para revisar resultados do seu negócio"',
  },
  {
    gatilho: 'equipe altamente qualificada / profissionais experientes',
    alternativa:
      'Credencial verificável: "CRC-MG 045.812 · sócios com pós em direito tributário"',
  },
  {
    gatilho: 'parceiro de sucesso',
    alternativa:
      'Papel específico: "Seu contador estratégico — não só quem entrega obrigação acessória"',
  },
  {
    gatilho: 'Saiba mais / Clique aqui / Conheça',
    alternativa:
      'CTA com verbo de ação + promessa: "Agendar diagnóstico de 30 minutos" / "Calcular minha economia" / "Receber proposta em 24h"',
  },
  {
    gatilho: 'sua tranquilidade fiscal começa aqui',
    alternativa:
      'Promessa específica: "Imposto em dia, sem multa e com previsibilidade — todo mês"',
  },
  {
    gatilho: 'somos um escritório que',
    alternativa:
      'Inverta para o cliente: "Empresários que mudam para a [Escritório] economizam, em média, R$ X/mês"',
  },
  {
    gatilho: 'contabilidade que entende seu negócio',
    alternativa:
      'Especialização concreta: "Contabilidade especializada em [nicho] em [cidade]"',
  },
];

/**
 * Palavras-gatilho que convertem em copy de contabilidade.
 * O LLM deve preferi-las quando houver opção semanticamente equivalente.
 */
export const POWER_WORDS = [
  'clareza',
  'tranquilidade',
  'previsibilidade',
  'economia legal',
  'em dia',
  'sem multa',
  'sem surpresa',
  'sem fila',
  'sem fidelidade',
  'contador dedicado',
  'diagnóstico gratuito',
  'migração sem ruído',
  'resposta em 4h úteis',
  'especialista em',
  'plantão fiscal',
  'auditoria preventiva',
  'reenquadramento',
];

/**
 * Verbos de ação para CTAs (sempre preferir a verbos vagos como
 * "saiba", "veja mais").
 */
export const ACTION_VERBS = [
  'Agende',
  'Solicite',
  'Calcule',
  'Descubra',
  'Receba',
  'Fale',
  'Migre',
  'Abra',
  'Simule',
  'Compare',
  'Reduza',
  'Garanta',
];

/**
 * Headlines genéricas que NÃO funcionam (padrão tóxico do mercado).
 * Servem como "anti-exemplos" no system prompt para o LLM identificar
 * o padrão e evitar.
 */
export const HEADLINES_TOXICAS = [
  'Contabilidade que entende seu negócio',
  'Soluções contábeis para sua empresa',
  'Sua tranquilidade fiscal começa aqui',
  'Contabilidade com qualidade e tradição',
  'O parceiro contábil que sua empresa precisa',
  'Excelência em serviços contábeis',
];
