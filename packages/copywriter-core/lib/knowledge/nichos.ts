// ============================================================
// Biblioteca de nichos — vocabulário, dores e ganchos específicos
// ============================================================
// Para cada nicho, o LLM puxa apenas o bloco relevante (economiza
// tokens) e ativa o vocabulário específico, transformando copy
// genérica em copy de especialista.
// ============================================================

import type { Nicho, TomDeVoz } from '../types';

export interface NichoKnowledge {
  /** Identificador */
  key: Nicho;
  /** Nome legível em português */
  label: string;
  /** Dores reais do segmento (em linguagem do cliente, não jargão) */
  dores: string[];
  /** Vocabulário técnico-tributário próprio do setor */
  vocabulario: string[];
  /** Exemplo de hook/headline que funciona */
  hookExemplo: string;
  /** Tom de voz recomendado para o nicho */
  tomRecomendado: TomDeVoz;
  /** Palavras-chave Google de alta intenção (para Ads) */
  palavrasChaveGoogle: string[];
  /** Sinais visuais sugeridos para criativos Meta */
  ideiasCreativosMeta: string[];
}

export const NICHO_LIBRARY: Record<Nicho, NichoKnowledge> = {
  medicos: {
    key: 'medicos',
    label: 'Médicos',
    dores: [
      'Médico PJ pagando IR da CLT por não otimizar o Pró-Labore',
      'Dúvida entre Anexo III ou V do Simples (Fator R não calculado)',
      'Recém-saído da CLT sem saber se abre PJ ou continua autônomo',
      'Plantão como receita extra sem registro adequado',
      'Livro-caixa subutilizado deixando dedução na mesa',
      'ISS-fixo do município ignorado pelo contador anterior',
    ],
    vocabulario: [
      'Pró-Labore',
      'livro-caixa',
      'recibo eletrônico',
      'RPA',
      'ISS-fixo',
      'Anexo III vs V',
      'Fator R',
      'PJ médica',
    ],
    hookExemplo:
      'Médico PJ em [cidade]? Você pode estar pagando R$ 12k/ano a mais de IR sem saber.',
    tomRecomendado: 'formal-consultivo',
    palavrasChaveGoogle: [
      'contador para medicos',
      'contabilidade para medicos',
      'abrir pj medico',
      'contador medico pj',
      'pro labore medico',
    ],
    ideiasCreativosMeta: [
      'Foto sóbria de médico em consultório com tablet (não estetoscópio padrão)',
      'Carrossel: 4 slides com "antes/depois" de carga tributária',
      'Reels de 30s do contador explicando Fator R com legenda forte',
    ],
  },

  dentistas: {
    key: 'dentistas',
    label: 'Dentistas',
    dores: [
      'Sociedade entre dentistas mal estruturada (SCP vs sociedade simples)',
      'Pró-Labore baixo demais barrando aposentadoria',
      'Plano de saúde dos sócios não-dedutível',
      'Convênios pagando com retenção de IR não-recuperada',
    ],
    vocabulario: [
      'Pró-Labore',
      'sociedade unipessoal',
      'retenção IR convênio',
      'CRO',
      'ISSQN dentistas',
    ],
    hookExemplo:
      'Clínica odontológica em [cidade]? Convênio retendo IR e ninguém te explicou como recuperar.',
    tomRecomendado: 'formal-consultivo',
    palavrasChaveGoogle: [
      'contador para dentistas',
      'contabilidade clinica odontologica',
      'abrir clinica dentaria',
    ],
    ideiasCreativosMeta: [
      'Imagem de cadeira odontológica vazia + número de IR retido',
      'Carrossel com cases anonimizados',
    ],
  },

  advogados: {
    key: 'advogados',
    label: 'Advogados',
    dores: [
      'Sociedade Unipessoal de Advogado mal aproveitada',
      'Distribuição de lucros vs Pró-Labore desbalanceada',
      'ISS por município diferente onde atua',
      'Honorários de sucesso sem planejamento tributário',
    ],
    vocabulario: [
      'SUA (Sociedade Unipessoal de Advogado)',
      'SCP',
      'distribuição de lucros',
      'ISS por município',
      'honorário de sucesso',
    ],
    hookExemplo:
      'Advogado em [cidade]: sua SUA está pagando ISS no município errado? Custa caro descobrir tarde.',
    tomRecomendado: 'formal-consultivo',
    palavrasChaveGoogle: [
      'contador para advogados',
      'contabilidade escritorio advocacia',
      'sociedade unipessoal advogado',
    ],
    ideiasCreativosMeta: [
      'Foto de mesa com balança + carimbo (não tradicional martelo)',
      'Reels com headline sobre planejamento tributário',
    ],
  },

  ecommerce: {
    key: 'ecommerce',
    label: 'E-commerce',
    dores: [
      'Substituição Tributária errada comendo margem em vendas interestaduais',
      'Difal não-calculado em vendas para consumidor final',
      'MEI estourado e ainda no regime errado',
      'Integração marketplace gerando NF-e divergente',
      'CFOP errado bloqueando crédito',
    ],
    vocabulario: [
      'ST (Substituição Tributária)',
      'Difal',
      'NF-e modelo 65',
      'CFOP',
      'convênio ICMS',
      'integração marketplace',
    ],
    hookExemplo:
      'Vende em vários estados? ST errada está comendo sua margem todo mês — e talvez nem o seu contador saiba.',
    tomRecomendado: 'proximo-direto',
    palavrasChaveGoogle: [
      'contador para ecommerce',
      'contabilidade ecommerce',
      'substituicao tributaria ecommerce',
      'contador mercado livre shopee',
    ],
    ideiasCreativosMeta: [
      'Print de planilha de margem com setas vermelhas',
      'Reels comparando ST correta vs errada em um pedido',
    ],
  },

  infoprodutores: {
    key: 'infoprodutores',
    label: 'Infoprodutores e Criadores',
    dores: [
      'Faturamento estourando o MEI sem o contador avisar',
      'Anexo III vs V do Simples (Fator R) calculado errado',
      'Tráfego pago não-deduzido (e podia)',
      'Recebimento Hotmart/Eduzz/Kiwify sem reconciliação',
      'Saída do MEI atrasada gerando multa',
    ],
    vocabulario: [
      'MEI estourado',
      'Anexo III vs V',
      'Fator R',
      'dedução de tráfego pago',
      'Hotmart',
      'Eduzz',
      'Kiwify',
    ],
    hookExemplo:
      'Faturando 30k+ na Hotmart? Você precisa sair do MEI ontem — e provavelmente está no anexo errado.',
    tomRecomendado: 'informal-tecnologico',
    palavrasChaveGoogle: [
      'contador para infoproduto',
      'contador infoprodutor',
      'contador hotmart',
      'sair do mei infoproduto',
    ],
    ideiasCreativosMeta: [
      'Print de dashboard Hotmart com seta para "faturamento mensal"',
      'Reels de 15s "3 sinais que você precisa sair do MEI"',
    ],
  },

  restaurantes: {
    key: 'restaurantes',
    label: 'Restaurantes e Food Service',
    dores: [
      'Anexo I quando deveria estar no III (Fator R alto)',
      'Vale-refeição não-deduzido',
      'Controle de CMV inexistente',
      'Multa de eSocial pela alta rotatividade',
      'iFood/Rappi gerando duplicidade fiscal',
    ],
    vocabulario: [
      'Anexo I vs III',
      'Fator R',
      'CMV',
      'eSocial',
      'iFood',
      'Rappi',
      'PAT (Programa de Alimentação do Trabalhador)',
    ],
    hookExemplo:
      'Restaurante em [cidade] no Anexo I quando podia estar no III? Você pode estar pagando até 50% a mais de imposto.',
    tomRecomendado: 'proximo-direto',
    palavrasChaveGoogle: [
      'contador para restaurantes',
      'contabilidade restaurante',
      'fator r restaurante',
    ],
    ideiasCreativosMeta: [
      'Foto de prato com legenda de cálculo de Fator R',
      'Reels mostrando diferença de imposto Anexo I vs III',
    ],
  },

  industria: {
    key: 'industria',
    label: 'Indústria',
    dores: [
      'Créditos de PIS/COFINS não-recuperados',
      'ICMS-ST de insumos sem aproveitamento',
      'Reinf de terceirização mal-classificada',
      'Lucro Real obrigatório sem planejamento',
    ],
    vocabulario: [
      'PIS/COFINS não-cumulativo',
      'ICMS-ST',
      'Reinf',
      'Lucro Real',
      'crédito presumido',
    ],
    hookExemplo:
      'Indústria em [cidade]: créditos de PIS/COFINS na mesa por falta de revisão fiscal estruturada.',
    tomRecomendado: 'formal-consultivo',
    palavrasChaveGoogle: [
      'contador para industria',
      'contabilidade industrial',
      'creditos pis cofins industria',
    ],
    ideiasCreativosMeta: [
      'Foto de chão de fábrica com overlay de números',
      'Carrossel com 5 créditos comumente perdidos',
    ],
  },

  construcao: {
    key: 'construcao',
    label: 'Construção Civil',
    dores: [
      'Regime errado para o porte (Simples vs Lucro Presumido)',
      'Retenção de INSS na NF de empreitada',
      'Sefip / GFIP desatualizados',
      'CNO (Cadastro Nacional de Obra) sem regularização',
    ],
    vocabulario: [
      'CNO',
      'retenção 11% INSS',
      'Sefip',
      'GFIP',
      'empreitada',
      'CEI',
    ],
    hookExemplo:
      'Construtora em [cidade]: retenção de INSS na empreitada está sangrando seu fluxo de caixa.',
    tomRecomendado: 'formal-consultivo',
    palavrasChaveGoogle: [
      'contador para construtora',
      'contabilidade construcao civil',
      'contador construtor',
    ],
    ideiasCreativosMeta: [
      'Capacete de obra com overlay de carga tributária',
      'Comparativo visual de regimes',
    ],
  },

  startups: {
    key: 'startups',
    label: 'Startups',
    dores: [
      'Stock options sem planejamento tributário',
      'Cap table afetando regime tributário',
      'Inova Simples desconhecido',
      'Investidor exigindo Lucro Real',
      'MEI inicial que precisa migrar para SA',
    ],
    vocabulario: [
      'stock options',
      'Inova Simples',
      'cap table',
      'Lucro Real',
      'SCP de fundadores',
      'fundo de investimento',
    ],
    hookExemplo:
      'Startup em [cidade] preparando rodada? Stock options sem planejamento pode virar IR de 27,5% para todos.',
    tomRecomendado: 'informal-tecnologico',
    palavrasChaveGoogle: [
      'contador para startup',
      'contabilidade startup',
      'stock options startup',
    ],
    ideiasCreativosMeta: [
      'Mesa de coworking com laptop e dashboard',
      'Reels com headline sobre rodada de investimento',
    ],
  },

  holdings: {
    key: 'holdings',
    label: 'Holdings Patrimoniais',
    dores: [
      'Holding familiar mal estruturada (ITCMD em cascata)',
      'Aluguel PF vs PJ sem comparativo',
      'Sucessão sem planejamento (ITCMD pesado)',
      'Distribuição de lucros mal aproveitada',
    ],
    vocabulario: [
      'holding patrimonial',
      'ITCMD',
      'doação com reserva de usufruto',
      'distribuição de lucros',
      'Lucro Presumido locação',
    ],
    hookExemplo:
      'Família com imóveis em [cidade]: holding mal estruturada pode dobrar o ITCMD na sucessão.',
    tomRecomendado: 'formal-consultivo',
    palavrasChaveGoogle: [
      'abrir holding familiar',
      'contador holding patrimonial',
      'planejamento sucessorio',
    ],
    ideiasCreativosMeta: [
      'Foto sóbria de imóvel com gráfico de tributação',
      'Carrossel comparando "com" vs "sem" holding',
    ],
  },

  'profissionais-liberais': {
    key: 'profissionais-liberais',
    label: 'Profissionais Liberais',
    dores: [
      'Autônomo pagando carnê-leão alto',
      'Dúvida entre RPA e PJ',
      'Livro-caixa subutilizado',
      'Recolhimento INSS desnecessário',
    ],
    vocabulario: [
      'carnê-leão',
      'RPA',
      'livro-caixa',
      'autônomo vs PJ',
    ],
    hookExemplo:
      'Profissional liberal em [cidade]: PJ pode reduzir seu imposto de 27,5% para 6%.',
    tomRecomendado: 'proximo-direto',
    palavrasChaveGoogle: [
      'contador para autonomo',
      'abrir pj autonomo',
      'profissional liberal contador',
    ],
    ideiasCreativosMeta: ['Comparativo PJ vs autônomo em valores'],
  },

  mei: {
    key: 'mei',
    label: 'MEI',
    dores: [
      'Faturamento próximo ao limite do MEI sem aviso',
      'Atividade não-permitida no MEI',
      'DASN-Simei em atraso',
      'Hora de virar ME e o contador não orientou',
    ],
    vocabulario: [
      'DAS-MEI',
      'DASN-Simei',
      'limite MEI',
      'virar ME',
      'CNAE MEI',
    ],
    hookExemplo:
      'MEI em [cidade] faturando perto de R$ 81k? Você está prestes a tomar multa se não migrar agora.',
    tomRecomendado: 'proximo-direto',
    palavrasChaveGoogle: [
      'contador para mei',
      'sair do mei',
      'virar me mei',
      'limite mei estourado',
    ],
    ideiasCreativosMeta: [
      'Gráfico simples de faturamento próximo ao limite',
      'Reels: "5 sinais que você precisa sair do MEI"',
    ],
  },

  'comercio-varejo': {
    key: 'comercio-varejo',
    label: 'Comércio Varejista',
    dores: [
      'ICMS-ST sobre estoque sem aproveitamento',
      'Anexo do Simples errado',
      'Maquininha de cartão com taxas não-deduzidas',
      'Estoque sem inventário fiscal',
    ],
    vocabulario: [
      'ICMS-ST',
      'inventário fiscal',
      'taxas maquininha',
      'CFOP venda',
    ],
    hookExemplo:
      'Loja em [cidade]: taxa de maquininha não está deduzindo seu imposto? Você está pagando duas vezes.',
    tomRecomendado: 'proximo-direto',
    palavrasChaveGoogle: [
      'contador para loja',
      'contabilidade comercio',
      'contador varejo',
    ],
    ideiasCreativosMeta: ['Foto de loja com overlay de margem real'],
  },

  'servicos-gerais': {
    key: 'servicos-gerais',
    label: 'Prestadores de Serviço',
    dores: [
      'ISS no município errado',
      'Fator R não-aplicado',
      'Retenção INSS na NF mal aproveitada',
      'Anexo III vs V do Simples',
    ],
    vocabulario: ['ISS', 'Fator R', 'retenção INSS', 'Anexo III vs V'],
    hookExemplo:
      'Prestador de serviço em [cidade] sem Fator R aplicado? Pode estar pagando 60% mais imposto que o necessário.',
    tomRecomendado: 'proximo-direto',
    palavrasChaveGoogle: [
      'contador para prestador de servico',
      'contabilidade servicos',
    ],
    ideiasCreativosMeta: ['Comparativo Anexo III vs V em números'],
  },

  transporte: {
    key: 'transporte',
    label: 'Transporte',
    dores: [
      'MEI Caminhoneiro vs Transportador autônomo',
      'Crédito de combustível mal aproveitado',
      'Frete intermunicipal vs interestadual ICMS',
      'RNTRC sem regularização',
    ],
    vocabulario: [
      'MEI Caminhoneiro',
      'RNTRC',
      'crédito de combustível',
      'CIOT',
    ],
    hookExemplo:
      'Transportador em [cidade]: crédito de combustível parado no estoque tributário? Recupere agora.',
    tomRecomendado: 'proximo-direto',
    palavrasChaveGoogle: [
      'contador para transportadora',
      'contador caminhoneiro',
    ],
    ideiasCreativosMeta: ['Foto de caminhão com overlay de crédito fiscal'],
  },

  clinicas: {
    key: 'clinicas',
    label: 'Clínicas (Estética, Fisio, Psico)',
    dores: [
      'Sociedade entre profissionais mal estruturada',
      'Convênios retendo IR sem recuperação',
      'CNAE errado bloqueando regime ideal',
      'Procedimentos sem NFS-e adequada',
    ],
    vocabulario: ['NFS-e', 'retenção IR convênio', 'CRM/CREFITO/CRP'],
    hookExemplo:
      'Clínica em [cidade]: convênio retendo IR e nunca recuperou? Estamos falando de R$ milhares.',
    tomRecomendado: 'formal-consultivo',
    palavrasChaveGoogle: [
      'contador para clinica',
      'contabilidade clinica estetica',
      'contador fisioterapia',
    ],
    ideiasCreativosMeta: ['Foto de ambiente clínico moderno'],
  },

  tecnologia: {
    key: 'tecnologia',
    label: 'Tecnologia / Software',
    dores: [
      'Anexo III vs V (Fator R) mal calculado',
      'Receita de exportação não-aproveitada',
      'PJ de pessoa física sem planejamento',
      'Stock options de funcionários sem estrutura',
    ],
    vocabulario: [
      'Fator R',
      'Anexo III vs V',
      'exportação de serviço',
      'PJ tech',
      'stock options',
    ],
    hookExemplo:
      'Dev/agência em [cidade]: Fator R mal aplicado pode te jogar do Anexo III pro V — e dobrar seu imposto.',
    tomRecomendado: 'informal-tecnologico',
    palavrasChaveGoogle: [
      'contador para empresa de tecnologia',
      'contador dev pj',
      'contabilidade software house',
    ],
    ideiasCreativosMeta: [
      'Setup de dev com terminal aberto',
      'Reels comparando Anexo III vs V',
    ],
  },
};

/**
 * Retorna conhecimento dos nichos selecionados (filtra para
 * economizar tokens no system prompt).
 */
export function getNichosKnowledge(nichos: Nicho[]): NichoKnowledge[] {
  return nichos.map((n) => NICHO_LIBRARY[n]).filter(Boolean);
}

/**
 * Serializa o conhecimento de nichos para inclusão no prompt
 * em formato XML compacto.
 */
export function serializeNichosForPrompt(nichos: Nicho[]): string {
  const knowledge = getNichosKnowledge(nichos);
  if (knowledge.length === 0) {
    return '<niche_library>Nenhum nicho especificado — gere copy genérica.</niche_library>';
  }
  return `<niche_library>\n${knowledge
    .map(
      (n) => `  <niche key="${n.key}" label="${n.label}">
    <pains>${n.dores.join(' · ')}</pains>
    <vocabulary>${n.vocabulario.join(' · ')}</vocabulary>
    <hook_example>${n.hookExemplo}</hook_example>
    <recommended_tone>${n.tomRecomendado}</recommended_tone>
    <google_keywords>${n.palavrasChaveGoogle.join(' · ')}</google_keywords>
    <meta_creative_ideas>${n.ideiasCreativosMeta.join(' · ')}</meta_creative_ideas>
  </niche>`
    )
    .join('\n')}\n</niche_library>`;
}
