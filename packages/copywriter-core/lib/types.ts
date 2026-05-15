// ============================================================
// @crm-contabil/copywriter-core — Tipos
// ============================================================
// Contratos de entrada/saída do gerador de copy especializado em
// escritórios de contabilidade brasileiros. Cobre site (Home, LPs de
// nicho, páginas de serviço) + anúncios (Google Ads, Meta Ads).
// ============================================================

// ------------------------------------------------------------
// Enums e tipos base
// ------------------------------------------------------------

export type TomDeVoz =
  | 'formal-consultivo'
  | 'proximo-direto'
  | 'informal-tecnologico';

export type ModeloPreco =
  | 'transparente'
  | 'faixa-por-porte'
  | 'sob-consulta';

export type CTAPrimario =
  | 'diagnostico-gratuito'
  | 'falar-especialista'
  | 'solicitar-proposta'
  | 'abrir-empresa'
  | 'simular-economia';

export type Nicho =
  | 'medicos'
  | 'dentistas'
  | 'advogados'
  | 'ecommerce'
  | 'infoprodutores'
  | 'restaurantes'
  | 'industria'
  | 'construcao'
  | 'startups'
  | 'holdings'
  | 'profissionais-liberais'
  | 'mei'
  | 'comercio-varejo'
  | 'servicos-gerais'
  | 'transporte'
  | 'clinicas'
  | 'tecnologia';

export type Servico =
  | 'contabil'
  | 'fiscal'
  | 'folha'
  | 'tributario'
  | 'societario'
  | 'bpo-financeiro'
  | 'irpf'
  | 'consultoria'
  | 'abertura'
  | 'troca'
  | 'sucessorio';

export type FaixaClientes = '1-50' | '50-200' | '200-500' | '500+';

export type SeloProfissional =
  | 'sescon'
  | 'iso9001'
  | 'conta-azul'
  | 'omie'
  | 'nibo'
  | 'sage'
  | 'google-partner';

export type EstagioFunil = 'frio' | 'morno' | 'quente' | 'remarketing';

export type FormatoCriativoMeta =
  | 'feed-estatico'
  | 'reels'
  | 'carrossel'
  | 'stories';

export type AnguloMetaAd =
  | 'dor'
  | 'curiosidade'
  | 'urgencia'
  | 'prova-social'
  | 'educativo';

export type ObjetivoCampanha =
  | 'abertura-empresa'
  | 'troca-contador'
  | 'nicho-especifico'
  | 'servico-especifico';

export type CopyMode =
  | 'site-home'
  | 'site-lp-nicho'
  | 'site-servico'
  | 'google-ads'
  | 'meta-ads'
  | 'gmb-descricao'
  | 'gmb-post'
  | 'gmb-review-reply';

// ------------------------------------------------------------
// GMB — temas/tons específicos
// ------------------------------------------------------------

export type GmbPostTema =
  | 'educativo'
  | 'oferta'
  | 'evento'
  | 'depoimento'
  | 'dica-fiscal'
  | 'prazo-importante';

export type GmbPostCtaType =
  | 'learn_more'
  | 'book'
  | 'call'
  | 'sign_up'
  | 'shop'
  | 'order'
  | 'none';

export type GmbPostFrequencia = 'weekly' | 'biweekly' | 'monthly';

export type GmbReplyTom = 'agradecimento' | 'apologia-empatica' | 'esclarecimento';

// ------------------------------------------------------------
// CaseReal — depoimento/case com permissão do contador
// ------------------------------------------------------------

export interface CaseReal {
  /** Segmento do cliente (ex: "clínica odontológica") */
  segmento: string;
  /** Porte (ex: "12 funcionários" ou "R$ 80k/mês") */
  porte: string;
  /** Resultado concreto (ex: "economia de R$ 6.400/mês") */
  resultado: string;
  /** Nome do cliente, apenas se autorizado por escrito */
  nomeCliente?: string;
}

// ------------------------------------------------------------
// EscritorioProfile — perfil persistido do contador
// (preenchido 1x, alimenta todas as gerações)
// ------------------------------------------------------------

export interface EscritorioProfile {
  // BLOCO 1 — Identidade
  nome: string;
  cidade: string;
  bairroPrincipal?: string;
  atendeRemoto: boolean;
  estadoAtuacao: string; // UF (SP, MG, RJ, etc.)
  crcUf: string;
  crcNumero: string;
  anosMercado: number;
  faixaClientes: FaixaClientes;

  // BLOCO 2 — Posicionamento
  /** Até 3 nichos principais */
  nichos: Nicho[];
  servicos: Servico[];
  modeloPreco: ModeloPreco;
  precoInicialMensal?: number;

  // BLOCO 3 — Diferencial e cliente
  /** Exatamente 3 diferenciais reais, texto livre */
  diferenciais: [string, string, string];
  /** Descrição da persona / cliente ideal (~300 chars) */
  persona: string;
  /** Exatamente 3 dores principais que o escritório resolve */
  doresPrincipais: [string, string, string];
  /** 1 a 3 cases reais com números */
  cases: CaseReal[];

  // BLOCO 4 — Conversão
  tomDeVoz: TomDeVoz;
  ctaPrimario: CTAPrimario;
  whatsapp?: string;
  linkGoogleMeuNegocio?: string;
  selos?: SeloProfissional[];
}

// ------------------------------------------------------------
// Parâmetros específicos por modo
// ------------------------------------------------------------

export interface SiteHomeParams {
  /** Quais seções gerar (default: todas as 10) */
  secoesIncluir?: SectionType[];
}

export interface SiteLpNichoParams {
  nicho: Nicho;
  /** Se atende cidades além da principal, gerar para esta */
  cidadeAlvo?: string;
}

export interface SiteServicoParams {
  servico: Servico;
  cidadeAlvo?: string;
}

export interface GoogleAdsParams {
  objetivoCampanha: ObjetivoCampanha;
  cidadeAlvo?: string;
  orcamentoMensal: number;
  oferta?: string;
  /** Nicho-alvo se objetivo = nicho-especifico */
  nichoAlvo?: Nicho;
  /** Serviço-alvo se objetivo = servico-especifico */
  servicoAlvo?: Servico;
}

export interface MetaAdsParams {
  objetivoCampanha: ObjetivoCampanha;
  estagioFunil: EstagioFunil;
  formatoCriativo: FormatoCriativoMeta;
  oferta?: string;
  cidadeAlvo?: string;
  nichoAlvo?: Nicho;
  servicoAlvo?: Servico;
}

// ------------------------------------------------------------
// Request unificado de geração
// ------------------------------------------------------------

export interface GmbDescricaoParams {
  /** Limite GMB: 750 caracteres */
  maxChars?: number;
}

export interface GmbPostParams {
  tema: GmbPostTema;
  /** Mês/contexto temporal opcional (ex: "fim do ano-calendário IRPF") */
  contextoTemporal?: string;
  /** Se quer CTA específico (default: learn_more) */
  ctaType?: GmbPostCtaType;
  ctaUrl?: string;
}

export interface GmbReviewReplyParams {
  /** Rating 1-5 da avaliação */
  rating: number;
  /** Texto da avaliação (pode ser vazio) */
  comentario: string;
  /** Nome do avaliador */
  nomeAvaliador: string;
}

export type CopyGenerationParams =
  | { modo: 'site-home'; params: SiteHomeParams }
  | { modo: 'site-lp-nicho'; params: SiteLpNichoParams }
  | { modo: 'site-servico'; params: SiteServicoParams }
  | { modo: 'google-ads'; params: GoogleAdsParams }
  | { modo: 'meta-ads'; params: MetaAdsParams }
  | { modo: 'gmb-descricao'; params: GmbDescricaoParams }
  | { modo: 'gmb-post'; params: GmbPostParams }
  | { modo: 'gmb-review-reply'; params: GmbReviewReplyParams };

export interface CopyGenerationRequest {
  escritorio: EscritorioProfile;
  geracao: CopyGenerationParams;
}

// ------------------------------------------------------------
// OUTPUTS — Site
// ------------------------------------------------------------

export type SectionType =
  | 'hero'
  | 'prova-social'
  | 'dores-pas'
  | 'servicos'
  | 'nichos'
  | 'processo'
  | 'diferenciais'
  | 'depoimentos'
  | 'faq'
  | 'cta-final';

export interface SiteSection {
  tipo: SectionType;
  headline?: string;
  subheadline?: string;
  bullets?: string[];
  /** Pares pergunta-resposta para FAQ */
  faq?: { pergunta: string; resposta: string }[];
  cta?: { texto: string; href: string };
  /** Bloco HTML pronto para colar no construtor de sites */
  copyHtml: string;
}

export interface SitePageOutput {
  /** URL relativa sugerida (ex: "/", "/contador-para-medicos") */
  url: string;
  /** <title> da página */
  title: string;
  metaDescription: string;
  h1: string;
  /** JSON-LD pronto para o <head> (AccountingService) */
  schemaJsonLd: Record<string, unknown>;
  sections: SiteSection[];
  /** Instruções de uso para Hostinger / Wix / Durable */
  instrucoesUso: string;
}

// ------------------------------------------------------------
// OUTPUTS — Google Ads
// ------------------------------------------------------------

export type MatchType = 'exact' | 'phrase' | 'broad';

export interface GoogleAdKeyword {
  termo: string;
  correspondencia: MatchType;
}

export interface GoogleSitelink {
  texto: string; // ≤ 25 chars
  descricao1: string; // ≤ 35 chars
  descricao2: string; // ≤ 35 chars
}

export interface GoogleAdGroup {
  nome: string;
  palavrasChave: GoogleAdKeyword[];
  /** 15 headlines, cada uma ≤ 30 caracteres */
  headlines: string[];
  /** 4 descriptions, cada uma ≤ 90 caracteres */
  descriptions: string[];
  /** 4 sitelinks */
  sitelinks: GoogleSitelink[];
  /** 10 callouts, cada um ≤ 25 caracteres */
  callouts: string[];
}

export interface GoogleAdsOutput {
  campanha: {
    nome: string;
    objetivo: ObjetivoCampanha;
    orcamentoMensalSugerido: number;
    geolocalizacao: string;
  };
  adGroups: GoogleAdGroup[];
  palavrasNegativas: string[];
  instrucoesUso: string;
}

// ------------------------------------------------------------
// OUTPUTS — Meta Ads
// ------------------------------------------------------------

export interface MetaAdVariation {
  angulo: AnguloMetaAd;
  /** Texto principal, ~125 chars (sem "ver mais") */
  primaryText: string;
  /** ≤ 40 chars */
  headline: string;
  /** ≤ 30 chars */
  description: string;
}

export interface MetaPublicoSugerido {
  interesses: string[];
  comportamentos: string[];
  geolocalizacao: string;
  faixaEtaria: string;
}

export interface MetaAdsOutput {
  conjuntoAnuncios: {
    nome: string;
    estagioFunil: EstagioFunil;
    formatoCriativo: FormatoCriativoMeta;
  };
  publicoSugerido: MetaPublicoSugerido;
  /** 5 variações de copy */
  variacoes: MetaAdVariation[];
  /** 3 sugestões visuais (descrição textual de imagem/vídeo) */
  ideiasCriativos: string[];
  instrucoesUso: string;
}

// ------------------------------------------------------------
// Output unificado (discriminated union)
// ------------------------------------------------------------

// ------------------------------------------------------------
// OUTPUTS — GMB
// ------------------------------------------------------------

export interface GmbDescricaoOutput {
  /** Descrição pronta (≤750 chars) */
  descricao: string;
  /** Categoria principal recomendada (string Google) */
  categoriaPrimariaRecomendada: string;
  /** Categorias secundárias sugeridas */
  categoriasSecundariasRecomendadas: string[];
  /** Lista de serviços sugeridos para preencher no GMB */
  servicosSugeridos: string[];
  /** Atributos sugeridos (ex: "atende remotamente", "estacionamento") */
  atributosSugeridos: string[];
}

export interface GmbPostOutput {
  /** Conteúdo do post (≤1500 chars; ideal ≤300) */
  conteudo: string;
  /** Tema usado */
  tema: GmbPostTema;
  /** Tipo de CTA do botão */
  ctaType: GmbPostCtaType;
  /** Texto do botão (auto baseado no ctaType) */
  ctaTexto: string;
  /** URL do CTA (se aplicável) */
  ctaUrl?: string;
  /** Sugestão de imagem (descrição textual) */
  ideiaCriativoVisual: string;
}

export interface GmbReviewReplyOutput {
  /** Resposta pronta para postar */
  resposta: string;
  /** Tom usado na resposta */
  tom: GmbReplyTom;
}

export type CopyGenerationOutput =
  | { tipo: 'site'; pagina: SitePageOutput }
  | { tipo: 'google-ads'; campanha: GoogleAdsOutput }
  | { tipo: 'meta-ads'; campanha: MetaAdsOutput }
  | { tipo: 'gmb-descricao'; conteudo: GmbDescricaoOutput }
  | { tipo: 'gmb-post'; conteudo: GmbPostOutput }
  | { tipo: 'gmb-review-reply'; conteudo: GmbReviewReplyOutput };

// ------------------------------------------------------------
// Resultado da geração (com metadados)
// ------------------------------------------------------------

export interface CopyGenerationResult {
  output: CopyGenerationOutput;
  /** Custo em créditos consumidos */
  creditosConsumidos: number;
  /** Tokens consumidos (auditoria) */
  tokensInput: number;
  tokensOutput: number;
  /** Avisos da validação (ex: headline X estourou limite e foi truncada) */
  avisos: string[];
  /** Modelo de IA usado */
  modeloIA: string;
  /** ID interno da geração (para histórico) */
  generationId?: string;
}

// ------------------------------------------------------------
// Custo em créditos por modo
// ------------------------------------------------------------

export const COPY_CREDITS_COST: Record<CopyMode, number> = {
  'site-home': 3,
  'site-lp-nicho': 1,
  'site-servico': 1,
  'google-ads': 2,
  'meta-ads': 2,
  'gmb-descricao': 1,
  'gmb-post': 1,
  'gmb-review-reply': 1,
};
