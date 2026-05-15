"use client";

import { useState } from "react";
import {
  Calculator,
  Briefcase,
  ClipboardCheck,
  Building2,
  Sparkles,
  MessageCircle,
  CheckCircle2,
  ArrowRight,
  Download,
  Zap,
  FileText,
} from "lucide-react";
import { LeadMagnetDialog } from "./lead-magnet-dialog";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const TENANT_SLUG = "teste-adonias";
const WHATSAPP_NUMBER = "557193061031";

const WHATSAPP_MESSAGES = {
  hero: encodeURIComponent("Oi Adonias! Vim pela página de iscas. Quero conhecer o CRM completo."),
  contratar: encodeURIComponent("Oi Adonias! Quero contratar o pacote 'Iscas Pronto'. Pode me passar os planos e formas de pagamento?"),
  copywriter: encodeURIComponent("Oi Adonias! Quero contratar o Copywriter (IA especialista em contabilidade). Pode me passar os planos e formas de pagamento?"),
  crm: encodeURIComponent("Oi Adonias! Quero contratar o CRM completo. Pode me explicar como funciona?"),
};

const ISCAS = [
  {
    slug: "simulador-regime-tributario",
    title: "Simulador de Regime",
    desc: "Compara Simples × Presumido × Real com IA explicando o melhor caso.",
    icon: Calculator,
  },
  {
    slug: "custo-funcionario-clt",
    title: "Custo CLT",
    desc: "Quanto um funcionário CLT realmente custa. Encargos + benefícios.",
    icon: Briefcase,
  },
  {
    slug: "quiz-saude-fiscal",
    title: "Diagnóstico Fiscal",
    desc: "Quiz de 10 perguntas → score 0-100 + relatório personalizado.",
    icon: ClipboardCheck,
  },
  {
    slug: "custo-abertura-empresa",
    title: "Custo de Abertura",
    desc: "Estima custos por estado + CNAE + roteiro dos próximos passos.",
    icon: Building2,
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function IscasPage() {
  const [dialog, setDialog] = useState<{
    magnet: "kit-iscas" | "prompts-pdf";
    title: string;
    description: string;
  } | null>(null);

  const heroWA = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGES.hero}`;
  const contratarWA = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGES.contratar}`;
  const copywriterWA = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGES.copywriter}`;
  const crmWA = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGES.crm}`;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ─── BANNER STICKY DO CRM ─── */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-amber-300" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-semibold text-white truncate">
                Quer o pacote completo? CRM + WhatsApp + IA
              </p>
              <p className="text-xs text-slate-300 hidden sm:block truncate">
                Fale comigo agora e veja como funciona
              </p>
            </div>
          </div>
          <a
            href={heroWA}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-2 rounded-full bg-emerald-500 hover:bg-emerald-600 transition px-4 py-2 text-sm font-semibold text-white shadow-md"
          >
            <MessageCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Falar no WhatsApp</span>
            <span className="sm:hidden">WhatsApp</span>
          </a>
        </div>
      </div>

      {/* ─── HERO ─── */}
      <section className="px-4 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto text-center">
          <p className="inline-flex items-center gap-2 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            Ferramentas de IA para escritórios de contabilidade
          </p>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900">
            Capture leads qualificados que vêm até você.
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 mt-6 max-w-2xl mx-auto">
            <strong>4 calculadoras inteligentes</strong> + <strong>banco de prompts</strong> de
            copywriting contábil. Escolha: <strong>grátis</strong> e você implementa, ou
            <strong> pronto</strong> e a gente cuida de tudo.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <a href="#iscas" className="inline-flex items-center gap-2 rounded-lg bg-slate-900 hover:bg-slate-800 transition px-6 py-3 text-sm font-semibold text-white shadow-md">
              Ver as 4 iscas <ArrowRight className="h-4 w-4" />
            </a>
            <a href="#copywriter" className="inline-flex items-center gap-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 transition px-6 py-3 text-sm font-semibold text-slate-900">
              Ver banco de prompts
            </a>
          </div>
        </div>
      </section>

      {/* ─── ISCAS — 2 CAMINHOS ─── */}
      <section id="iscas" className="px-4 py-16 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              🧮 As 4 Iscas Inteligentes
            </h2>
            <p className="text-slate-600 mt-3 max-w-2xl mx-auto">
              Calculadoras que o empresário preenche, vê resultado com análise de IA,
              e te entrega o contato em troca.
            </p>
          </div>

          {/* Preview das 4 iscas */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-12">
            {ISCAS.map((isca) => {
              const Icon = isca.icon;
              return (
                <div key={isca.slug} className="rounded-xl border border-slate-200 bg-white p-5">
                  <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center mb-3">
                    <Icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">{isca.title}</h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{isca.desc}</p>
                </div>
              );
            })}
          </div>

          {/* 2 caminhos */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* GRÁTIS DIY */}
            <div className="rounded-2xl border-2 border-slate-200 bg-white p-7 flex flex-col">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-1.5 mb-4 w-fit">
                <Download className="h-3.5 w-3.5" /> Grátis · você implementa
              </div>
              <h3 className="text-xl font-bold text-slate-900">Kit das Iscas (DIY)</h3>
              <p className="text-sm text-slate-600 mt-2">
                Receba os arquivos e implemente no seu site. Hospedagem por sua conta,
                análise IA roda no seu Claude/ChatGPT.
              </p>
              <div className="my-5 space-y-2 flex-1">
                {[
                  "4 templates HTML estilizados para colar no Hostinger/Wix/Carrd",
                  "Planilha Excel com cálculos prontos",
                  "PDF com instruções de implementação",
                  "Banco de 4 prompts de análise para Claude/ChatGPT",
                  "Templates de mensagem WhatsApp",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() =>
                  setDialog({
                    magnet: "kit-iscas",
                    title: "Receba o Kit das Iscas grátis",
                    description: "Templates HTML, planilha, prompts e instruções no seu e-mail em segundos.",
                  })
                }
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 hover:bg-slate-800 transition px-5 py-3 text-sm font-semibold text-white"
              >
                <Download className="h-4 w-4" /> Baixar grátis
              </button>
            </div>

            {/* PAGO PRONTO */}
            <div className="rounded-2xl border-2 border-emerald-500 bg-gradient-to-br from-emerald-50 to-white p-7 flex flex-col relative">
              <div className="absolute -top-3 right-7 rounded-full bg-emerald-600 text-white text-xs font-bold px-3 py-1">
                Recomendado
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-1.5 mb-4 w-fit">
                <Zap className="h-3.5 w-3.5" /> Tudo pronto para você
              </div>
              <h3 className="text-xl font-bold text-slate-900">Iscas Pronto</h3>
              <p className="text-sm text-slate-700 mt-2">
                Acesse a plataforma com as 4 iscas hospedadas e análise IA
                automática. Zero implementação técnica.
              </p>
              <div className="my-5 space-y-2 flex-1">
                {[
                  { item: "4 calculadoras hospedadas com URL própria do seu escritório", strong: true },
                  { item: "Análise IA personalizada em ~20s (lead vê na hora)", strong: true },
                  { item: "Painel para acompanhar todos os leads capturados", strong: false },
                  { item: "Dados completos do lead (nome, WhatsApp, e-mail, respostas, análise gerada)", strong: false },
                  { item: "Exportação dos leads em CSV/planilha", strong: false },
                  { item: "Suporte por WhatsApp", strong: false },
                ].map(({ item, strong }) => (
                  <div key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className={`text-sm ${strong ? "text-slate-900 font-semibold" : "text-slate-700"}`}>{item}</span>
                  </div>
                ))}
              </div>
              <a
                href={contratarWA}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 transition px-5 py-3 text-sm font-semibold text-white shadow-md"
              >
                <MessageCircle className="h-4 w-4" /> Falar com Adonias no WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── COPYWRITER — 2 CAMINHOS ─── */}
      <section id="copywriter" className="px-4 py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              ✍️ Copy especialista em contabilidade
            </h2>
            <p className="text-slate-600 mt-3 max-w-2xl mx-auto">
              Site, Google Ads, Meta Ads e posts de GMB escritos com voz de quem
              entende de regime tributário, Fator R, ICMS-ST e 17 nichos contábeis.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* GRÁTIS — PROMPTS */}
            <div className="rounded-2xl border-2 border-slate-200 bg-white p-7 flex flex-col">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-1.5 mb-4 w-fit">
                <FileText className="h-3.5 w-3.5" /> Grátis · você roda no Claude
              </div>
              <h3 className="text-xl font-bold text-slate-900">Banco de 20 Prompts</h3>
              <p className="text-sm text-slate-600 mt-2">
                PDF com prompts prontos para colar no seu Claude/ChatGPT. Gere texto de
                site, ads e GMB no seu próprio ritmo.
              </p>
              <div className="my-5 space-y-2 flex-1">
                {[
                  "Prompt de contexto (cole 1 vez, calibra todas as gerações)",
                  "11 prompts para Promessa 1 (GMB, Site, Google e Meta Ads)",
                  "1 prompt para análise de iscas",
                  "6 prompts para Promessa 3 (resumo conversa, sugerir resposta, quebrar objeção...)",
                  "Instruções pra salvar contexto no Claude.ai e ChatGPT",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() =>
                  setDialog({
                    magnet: "prompts-pdf",
                    title: "Receba o banco de prompts grátis",
                    description: "20 prompts em PDF prontos para colar no Claude/ChatGPT.",
                  })
                }
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 hover:bg-slate-800 transition px-5 py-3 text-sm font-semibold text-white"
              >
                <Download className="h-4 w-4" /> Baixar PDF grátis
              </button>
            </div>

            {/* PAGO — COPYWRITER */}
            <div className="rounded-2xl border-2 border-indigo-500 bg-gradient-to-br from-indigo-50 to-white p-7 flex flex-col relative">
              <div className="absolute -top-3 right-7 rounded-full bg-indigo-600 text-white text-xs font-bold px-3 py-1">
                Mais completo
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 text-indigo-800 text-xs font-semibold px-3 py-1.5 mb-4 w-fit">
                <Sparkles className="h-3.5 w-3.5" /> IA especialista para você
              </div>
              <h3 className="text-xl font-bold text-slate-900">Copywriter Standalone</h3>
              <p className="text-sm text-slate-700 mt-2">
                Plataforma com IA treinada especificamente em contabilidade. Você
                preenche perfil 1 vez e gera tudo com 1 clique.
              </p>
              <div className="my-5 space-y-2 flex-1">
                {[
                  { item: "Site completo (Home + LPs por nicho)", strong: true },
                  { item: "Google Ads com headlines validados em char", strong: true },
                  { item: "Meta Ads com 5 ângulos diferentes", strong: false },
                  { item: "GMB (descrição + posts por tema)", strong: false },
                  { item: "Validação automática (anti-clichê)", strong: false },
                  { item: "17 nichos cobertos com vocabulário próprio", strong: false },
                ].map(({ item, strong }) => (
                  <div key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span className={`text-sm ${strong ? "text-slate-900 font-semibold" : "text-slate-700"}`}>{item}</span>
                  </div>
                ))}
              </div>
              <a
                href={copywriterWA}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 transition px-5 py-3 text-sm font-semibold text-white shadow-md"
              >
                <MessageCircle className="h-4 w-4" /> Falar com Adonias no WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── BANNER CRM ─── */}
      <section className="px-4 py-16 bg-slate-900">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold px-3 py-1.5 mb-6">
            🚀 Upgrade · Sistema completo
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Quer transformar lead em cliente sem perder ninguém no caminho?
          </h2>
          <p className="text-lg text-slate-300 mt-6 max-w-2xl mx-auto">
            O <strong>CRM Contábil</strong> é o passo seguinte às iscas: o lead
            capturado entra direto num pipeline visual, você atende pelo
            WhatsApp da empresa, e a IA cuida de follow-up, propostas e
            contratos. Tudo conversando entre si.
          </p>

          <div className="grid sm:grid-cols-2 gap-4 mt-10 max-w-3xl mx-auto">
            {[
              { title: "Pipeline visual Kanban", desc: "Veja onde cada lead está e o que falta fazer" },
              { title: "WhatsApp Cloud API integrado", desc: "Atende do CRM no mesmo número que você usa" },
              { title: "AI Chat assistente lateral", desc: "Pergunte 'quem precisa de follow-up?' e ele responde" },
              { title: "Propostas + contratos digitais", desc: "Lead aceita online com link público" },
              { title: "Follow-up automatizado", desc: "Sequências que disparam sozinhas" },
              { title: "Iscas integradas no pipeline", desc: "Lead da calculadora cai já qualificado" },
            ].map((f) => (
              <div key={f.title} className="rounded-xl bg-slate-800/50 border border-slate-700 p-4 text-left">
                <p className="text-sm font-semibold text-white">{f.title}</p>
                <p className="text-xs text-slate-400 mt-1">{f.desc}</p>
              </div>
            ))}
          </div>

          <a
            href={crmWA}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 mt-10 rounded-full bg-emerald-500 hover:bg-emerald-600 transition px-8 py-4 text-base font-semibold text-white shadow-xl"
          >
            <MessageCircle className="h-5 w-5" />
            Falar com Adonias no WhatsApp agora
          </a>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-slate-950 px-4 py-8 text-center text-xs text-slate-500">
        <p>
          © {new Date().getFullYear()} — Ferramentas para escritórios de contabilidade brasileiros
        </p>
      </footer>

      {/* Dialog de captura de email (lead magnet) */}
      {dialog && (
        <LeadMagnetDialog
          open={true}
          magnet={dialog.magnet}
          title={dialog.title}
          description={dialog.description}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}
