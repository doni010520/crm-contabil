import Link from "next/link";
import type { Metadata } from "next";
import {
  Calculator,
  Briefcase,
  ClipboardCheck,
  Building2,
  Sparkles,
  MessageCircle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Config — edite estas constantes pra apontar pras suas iscas e contato
// ---------------------------------------------------------------------------
const TENANT_SLUG =
  process.env.NEXT_PUBLIC_ISCAS_TENANT_SLUG || "teste-adonias";

const WHATSAPP_NUMBER = "557193061031";
const WHATSAPP_MESSAGE_HERO = encodeURIComponent(
  "Oi Paulo! Vim pela página de iscas e quero conhecer o CRM completo."
);
const WHATSAPP_MESSAGE_FOOTER = encodeURIComponent(
  "Oi Paulo! Quero contratar o CRM contábil. Pode me explicar como funciona?"
);

const COPYWRITER_URL = "/copy";

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------
export const metadata: Metadata = {
  title: "Iscas para Contadores — Ferramentas de IA",
  description:
    "4 calculadoras inteligentes + Copywriter especializado para escritórios de contabilidade. Use grátis e capture leads qualificados.",
};

// ---------------------------------------------------------------------------
// Iscas
// ---------------------------------------------------------------------------
const ISCAS = [
  {
    slug: "simulador-regime-tributario",
    title: "Simulador de Regime Tributário",
    desc: "O empresário descobre se Simples, Presumido ou Lucro Real economiza mais imposto pro negócio dele.",
    icon: Calculator,
    color: "from-blue-500 to-blue-600",
    badge: "Mais popular",
  },
  {
    slug: "custo-funcionario-clt",
    title: "Calculadora de Custo CLT",
    desc: "Mostra quanto um funcionário CLT realmente custa — salário + encargos + benefícios.",
    icon: Briefcase,
    color: "from-emerald-500 to-emerald-600",
  },
  {
    slug: "quiz-saude-fiscal",
    title: "Diagnóstico de Saúde Fiscal",
    desc: "Quiz de 10 perguntas que gera score 0-100 e relatório com riscos e oportunidades.",
    icon: ClipboardCheck,
    color: "from-amber-500 to-amber-600",
  },
  {
    slug: "custo-abertura-empresa",
    title: "Estimativa de Custo de Abertura",
    desc: "Calcula custos para abrir empresa por estado + CNAE, com roteiro dos próximos passos.",
    icon: Building2,
    color: "from-purple-500 to-purple-600",
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function IscasParaContadoresPage() {
  const whatsappHeroUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE_HERO}`;
  const whatsappFooterUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE_FOOTER}`;

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
            href={whatsappHeroUrl}
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
            Ferramentas grátis de IA para escritórios de contabilidade
          </p>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900">
            Capture leads qualificados sem empurrar venda.
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 mt-6 max-w-2xl mx-auto">
            4 calculadoras inteligentes + 1 gerador de copy especializada em
            contabilidade. Use grátis, copie pra seu escritório, ou contrate o
            atalho completo.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <a
              href="#iscas"
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 hover:bg-slate-800 transition px-6 py-3 text-sm font-semibold text-white shadow-md"
            >
              Ver as 4 iscas <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#copywriter"
              className="inline-flex items-center gap-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 transition px-6 py-3 text-sm font-semibold text-slate-900"
            >
              Conhecer o Copywriter
            </a>
          </div>
        </div>
      </section>

      {/* ─── 4 ISCAS ─── */}
      <section id="iscas" className="px-4 py-16 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              🧮 As 4 Iscas Inteligentes
            </h2>
            <p className="text-slate-600 mt-3 max-w-2xl mx-auto">
              Cada isca é uma página pública que você compartilha. O empresário
              preenche, vê o resultado calculado + análise por IA, e você recebe
              o lead já qualificado.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {ISCAS.map((isca) => {
              const Icon = isca.icon;
              const href = `/calc/${TENANT_SLUG}/${isca.slug}`;
              return (
                <Link
                  key={isca.slug}
                  href={href}
                  target="_blank"
                  className="group relative rounded-2xl border border-slate-200 bg-white p-6 hover:border-slate-300 hover:shadow-lg transition"
                >
                  {isca.badge && (
                    <div className="absolute top-4 right-4 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold px-2.5 py-1">
                      {isca.badge}
                    </div>
                  )}
                  <div
                    className={`h-12 w-12 rounded-xl bg-gradient-to-br ${isca.color} flex items-center justify-center mb-4 shadow-md`}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {isca.title}
                  </h3>
                  <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                    {isca.desc}
                  </p>
                  <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 group-hover:gap-2.5 transition-all">
                    Acessar isca <ArrowRight className="h-4 w-4" />
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="mt-10 rounded-xl bg-blue-50 border border-blue-100 p-5 max-w-3xl mx-auto">
            <p className="text-sm text-blue-900 text-center">
              <strong>Como funciona:</strong> cada link acima leva à página pública
              da isca. O empresário preenche dados, entrega o contato pra ver o
              resultado, e a IA gera análise personalizada com nome dele.
            </p>
          </div>
        </div>
      </section>

      {/* ─── COPYWRITER ─── */}
      <section id="copywriter" className="px-4 py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              ✍️ Copywriter — IA especialista em contabilidade
            </h2>
            <p className="text-slate-600 mt-3 max-w-2xl mx-auto">
              Gere site, anúncios e conteúdo de GMB com voz de quem entende de
              regime tributário, Fator R, ICMS-ST e os 17 nichos contábeis.
            </p>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 p-8 sm:p-10 shadow-xl">
            <div className="grid sm:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/20 text-white text-xs font-semibold px-3 py-1.5 mb-4">
                  <Sparkles className="h-3.5 w-3.5" />
                  5 créditos grátis no signup
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-white">
                  Site, Google Ads, Meta Ads e GMB com voz de especialista
                </h3>
                <p className="text-indigo-100 mt-4 leading-relaxed">
                  Marina Costa (a IA por trás) escreve como copywriter sênior
                  com 12 anos em escritórios de contabilidade. Vocabulário do
                  nicho, frameworks comprovados (PAS, StoryBrand), validação
                  automática de char limits.
                </p>
                <Link
                  href={COPYWRITER_URL}
                  className="inline-flex items-center gap-2 mt-6 rounded-lg bg-white text-indigo-700 hover:bg-indigo-50 transition px-6 py-3 text-sm font-semibold shadow-md"
                >
                  Começar grátis <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="space-y-3">
                {[
                  "Site (Home + LPs por nicho + páginas de serviço)",
                  "Google Ads (15 headlines + descriptions + negativas)",
                  "Meta Ads (5 variações + público sugerido)",
                  "Google Meu Negócio (descrição + posts)",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-5 w-5 text-emerald-300 shrink-0 mt-0.5" />
                    <span className="text-sm text-white">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── BANNER CRM (destaque, fundo escuro) ─── */}
      <section className="px-4 py-16 bg-slate-900">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold px-3 py-1.5 mb-6">
            💼 Pacote completo
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Quer todas essas ferramentas + WhatsApp + Pipeline + IA num
            sistema só?
          </h2>
          <p className="text-lg text-slate-300 mt-6 max-w-2xl mx-auto">
            O CRM Contábil reúne tudo: as 4 iscas já integradas, WhatsApp
            Cloud API com co-existência, pipeline visual, propostas com link
            público, contratos digitais e um assistente de IA que conversa
            com você.
          </p>

          <div className="grid sm:grid-cols-3 gap-4 mt-10 max-w-3xl mx-auto">
            {[
              { title: "WhatsApp embutido", desc: "Sem trocar de número" },
              { title: "AI Chat lateral", desc: "17 ferramentas no comando" },
              { title: "Iscas integradas", desc: "Lead cai direto no pipeline" },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-xl bg-slate-800/50 border border-slate-700 p-4"
              >
                <p className="text-sm font-semibold text-white">{f.title}</p>
                <p className="text-xs text-slate-400 mt-1">{f.desc}</p>
              </div>
            ))}
          </div>

          <a
            href={whatsappFooterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 mt-10 rounded-full bg-emerald-500 hover:bg-emerald-600 transition px-8 py-4 text-base font-semibold text-white shadow-xl"
          >
            <MessageCircle className="h-5 w-5" />
            Falar com Paulo no WhatsApp agora
          </a>

          <p className="text-xs text-slate-500 mt-4">
            (71) 9 3061-031 · resposta em até 4h úteis
          </p>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-slate-950 px-4 py-8 text-center text-xs text-slate-500">
        <p>
          © {new Date().getFullYear()} — Iscas e ferramentas para escritórios
          de contabilidade brasileiros
        </p>
      </footer>
    </div>
  );
}
