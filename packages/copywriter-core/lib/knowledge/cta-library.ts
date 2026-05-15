// ============================================================
// Biblioteca de CTAs — mapeamento de CTAPrimario para texto/href
// ============================================================

import type { CTAPrimario } from '../types';

export interface CTADefinition {
  /** Texto curto (para botões compactos, ads) */
  textoCurto: string;
  /** Texto completo (para botões da home) */
  textoLongo: string;
  /** Href sugerido (geralmente WhatsApp ou âncora) */
  hrefSugerido: string;
  /** Estágio do funil onde mais converte */
  estagioFunil: 'topo' | 'meio' | 'fundo';
  /** Justificativa de uso (embutida no prompt) */
  contexto: string;
}

export const CTA_LIBRARY: Record<CTAPrimario, CTADefinition> = {
  'diagnostico-gratuito': {
    textoCurto: 'Diagnóstico Gratuito',
    textoLongo: 'Agendar diagnóstico gratuito de 30 minutos',
    hrefSugerido: '#contato',
    estagioFunil: 'topo',
    contexto:
      'Topo/meio de funil. Promessa de valor sem fricção. Converte ~93% mais que "Nossos Serviços".',
  },
  'falar-especialista': {
    textoCurto: 'Falar com Especialista',
    textoLongo: 'Falar com um contador especialista agora',
    hrefSugerido: 'https://wa.me/{whatsapp}',
    estagioFunil: 'meio',
    contexto:
      'Meio de funil. Posiciona quem atende como especialista (não "atendente"). Ativa autoridade.',
  },
  'solicitar-proposta': {
    textoCurto: 'Solicitar Proposta',
    textoLongo: 'Solicitar proposta personalizada em 24h',
    hrefSugerido: '#proposta',
    estagioFunil: 'fundo',
    contexto:
      'Fundo de funil. Para leads já decididos. Assusta lead frio — use em LPs específicas, não na home.',
  },
  'abrir-empresa': {
    textoCurto: 'Abrir minha Empresa',
    textoLongo: 'Abrir minha empresa sem burocracia',
    hrefSugerido: '#abertura',
    estagioFunil: 'fundo',
    contexto:
      'LP de abertura de empresa. Oferta concreta na ação inicial (cobra mensalidade depois).',
  },
  'simular-economia': {
    textoCurto: 'Simular Economia',
    textoLongo: 'Simular quanto posso economizar de imposto',
    hrefSugerido: '#simulador',
    estagioFunil: 'topo',
    contexto:
      'Topo de funil. Ativa curiosidade + autoatendimento. Lead chega aquecido após o simulador.',
  },
};

/**
 * Frases-gancho para CTA secundário (sempre WhatsApp).
 */
export const CTA_SECUNDARIO_WHATSAPP = [
  'Prefiro falar no WhatsApp',
  'Conversar agora no WhatsApp',
  'Tirar dúvida pelo WhatsApp',
];
