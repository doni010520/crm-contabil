"use client";

import { useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface TenantInfo {
  id: string;
  name: string;
  slug: string;
}

interface CalculatorInfo {
  id: string;
  type: string;
  cta_text: string | null;
  cta_action: string | null;
  cta_url: string | null;
}

interface PublicCalculatorProps {
  tenant: TenantInfo;
  calculator: CalculatorInfo;
}

type Step = "form" | "gate" | "result";

const TITLES: Record<string, string> = {
  regime_simulator: "Simulador de Regime Tributário",
  clt_cost: "Custo de Funcionário CLT",
  fiscal_health: "Quiz de Saúde Fiscal",
  opening_cost: "Custo de Abertura de Empresa",
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
interface AiAnalysis {
  titulo: string;
  resumoExecutivo: string;
  analiseNarrativa: string;
  destaquesNumericos: { label: string; valor: string }[];
  proximosPassos: string[];
}

export function PublicCalculator({ tenant, calculator }: PublicCalculatorProps) {
  const [step, setStep] = useState<Step>("form");
  const [inputs, setInputs] = useState<Record<string, unknown>>({});
  const [result, setResult] = useState<Record<string, unknown>>({});
  const [score, setScore] = useState<number | null>(null);
  const [scoreLevel, setScoreLevel] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [leadData, setLeadData] = useState({ name: "", phone: "", email: "", company_name: "" });

  // IA analysis state
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysis | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  function handleCalculate(calcInputs: Record<string, unknown>, calcResult: Record<string, unknown>, calcScore?: number, calcScoreLevel?: string) {
    setInputs(calcInputs);
    setResult(calcResult);
    if (calcScore !== undefined) setScore(calcScore);
    if (calcScoreLevel) setScoreLevel(calcScoreLevel);
    setStep("gate");
  }

  async function handleLeadSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    // 1. Salva o lead (não bloqueia se falhar)
    try {
      await fetch("/api/public/calculator-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenant.id,
          calculator_id: calculator.id,
          calculator_type: calculator.type,
          name: leadData.name,
          phone: leadData.phone,
          email: leadData.email || null,
          company_name: leadData.company_name || null,
          inputs,
          result,
          score,
          score_level: scoreLevel,
        }),
      });
    } catch {
      // Silently continue
    }

    setSubmitting(false);
    setStep("result");

    // 2. Dispara geração da análise por IA em paralelo
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch("/api/public/calculator-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          calculator_id: calculator.id,
          calculator_type: calculator.type,
          inputs,
          result,
          lead_name: leadData.name,
          score: score ?? undefined,
          score_level: scoreLevel ?? undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setAiError(data?.error || "Não foi possível gerar a análise personalizada agora.");
      } else {
        const data = await res.json();
        setAiAnalysis(data.analysis as AiAnalysis);
      }
    } catch {
      setAiError("Erro de conexão ao gerar análise.");
    } finally {
      setAiLoading(false);
    }
  }

  function getCtaUrl() {
    if (!calculator.cta_url) return null;
    if (calculator.cta_action === "whatsapp") {
      const digits = calculator.cta_url.replace(/\D/g, "");
      return `https://wa.me/${digits}`;
    }
    if (calculator.cta_action === "email") {
      return `mailto:${calculator.cta_url}`;
    }
    return calculator.cta_url;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-8 text-center">
        <p className="text-sm font-medium text-slate-500 mb-1">{tenant.name}</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          {TITLES[calculator.type] || "Calculadora"}
        </h1>
      </div>

      {/* Calculator form */}
      {step === "form" && (
        <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-lg border border-slate-200">
          {calculator.type === "regime_simulator" && (
            <RegimeSimulator onCalculate={handleCalculate} />
          )}
          {calculator.type === "clt_cost" && (
            <CltCostCalculator onCalculate={handleCalculate} />
          )}
          {calculator.type === "fiscal_health" && (
            <FiscalHealthQuiz onCalculate={handleCalculate} />
          )}
          {calculator.type === "opening_cost" && (
            <OpeningCostCalculator onCalculate={handleCalculate} />
          )}
        </div>
      )}

      {/* Lead gate */}
      {step === "gate" && (
        <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-lg border border-slate-200">
          {/* Blurred preview */}
          <div className="relative mb-6 rounded-xl bg-slate-50 p-4 overflow-hidden">
            <div className="blur-sm pointer-events-none select-none">
              <ResultPreview type={calculator.type} result={result} score={score} scoreLevel={scoreLevel} />
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[2px]">
              <p className="text-center font-semibold text-slate-700 text-lg px-4">
                Preencha seus dados para ver o resultado completo
              </p>
            </div>
          </div>

          <form onSubmit={handleLeadSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Seu nome *
              </label>
              <input
                type="text"
                required
                value={leadData.name}
                onChange={(e) => setLeadData({ ...leadData, name: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                placeholder="Nome completo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                WhatsApp *
              </label>
              <input
                type="tel"
                required
                value={leadData.phone}
                onChange={(e) => setLeadData({ ...leadData, phone: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                placeholder="(11) 99999-9999"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                E-mail
              </label>
              <input
                type="email"
                value={leadData.email}
                onChange={(e) => setLeadData({ ...leadData, email: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nome da empresa
              </label>
              <input
                type="text"
                value={leadData.company_name}
                onChange={(e) => setLeadData({ ...leadData, company_name: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                placeholder="Nome da sua empresa"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50"
            >
              {submitting ? "Enviando..." : "Ver resultado completo"}
            </button>
            <p className="text-xs text-center text-slate-400">
              Seus dados estão seguros e não serão compartilhados.
            </p>
          </form>
        </div>
      )}

      {/* Full result */}
      {step === "result" && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-lg border border-slate-200">
            <ResultPreview type={calculator.type} result={result} score={score} scoreLevel={scoreLevel} />
          </div>

          {/* IA — análise personalizada */}
          <AiAnalysisCard loading={aiLoading} error={aiError} analysis={aiAnalysis} officeName={tenant.name} />

          {calculator.cta_url && (
            <div className="text-center">
              <a
                href={getCtaUrl() || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-6 py-3 text-sm font-semibold text-white hover:bg-green-700 transition shadow-lg"
              >
                {calculator.cta_text || "Fale com um especialista"}
              </a>
            </div>
          )}

          <p className="text-center text-xs text-slate-400">
            Calculadora oferecida por {tenant.name}
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// AI Analysis Card — análise personalizada por IA (pós-gate)
// ---------------------------------------------------------------------------
function AiAnalysisCard({
  loading,
  error,
  analysis,
  officeName,
}: {
  loading: boolean;
  error: string | null;
  analysis: AiAnalysis | null;
  officeName: string;
}) {
  if (!loading && !error && !analysis) return null;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-white p-6 sm:p-8 shadow-lg border border-indigo-200">
      <div className="flex items-center gap-2 mb-4">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold">
          IA
        </span>
        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
          Análise personalizada por {officeName}
        </span>
      </div>

      {loading && (
        <div className="space-y-3 animate-pulse">
          <div className="h-5 bg-slate-200 rounded w-2/3" />
          <div className="h-4 bg-slate-200 rounded w-full" />
          <div className="h-4 bg-slate-200 rounded w-5/6" />
          <div className="h-4 bg-slate-200 rounded w-4/6" />
          <p className="text-xs text-slate-500 mt-3">
            Gerando análise personalizada... isso leva ~20 segundos.
          </p>
        </div>
      )}

      {error && !loading && (
        <p className="text-sm text-slate-600">
          A análise personalizada não pôde ser gerada agora, mas seus dados
          foram salvos. {officeName} entrará em contato com a análise completa.
        </p>
      )}

      {analysis && !loading && (
        <div className="space-y-5">
          <div>
            <h3 className="text-xl font-bold text-slate-900">{analysis.titulo}</h3>
            <p className="text-base font-medium text-indigo-900 mt-2">
              {analysis.resumoExecutivo}
            </p>
          </div>

          {analysis.destaquesNumericos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {analysis.destaquesNumericos.map((d, i) => (
                <div
                  key={i}
                  className="rounded-lg bg-white border border-indigo-100 p-3"
                >
                  <p className="text-xs font-medium text-slate-500 mb-1">{d.label}</p>
                  <p className="text-lg font-bold text-indigo-700">{d.valor}</p>
                </div>
              ))}
            </div>
          )}

          <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap">
            {analysis.analiseNarrativa}
          </div>

          {analysis.proximosPassos.length > 0 && (
            <div>
              <h4 className="font-semibold text-slate-800 mb-2">Próximos passos sugeridos</h4>
              <ul className="space-y-1.5 text-sm text-slate-700">
                {analysis.proximosPassos.map((p, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                      {i + 1}
                    </span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Result preview (used both blurred and full)
// ---------------------------------------------------------------------------
function ResultPreview({
  type,
  result,
  score,
  scoreLevel,
}: {
  type: string;
  result: Record<string, unknown>;
  score: number | null;
  scoreLevel: string | null;
}) {
  if (type === "regime_simulator") {
    const r = result as {
      simples?: number;
      simplesAliquota?: number;
      simplesAnexo?: string;
      presumido?: number;
      presumidoBreakdown?: {
        irpj?: number;
        adicional?: number;
        csll?: number;
        pis?: number;
        cofins?: number;
        iss?: number;
        icms?: number;
      };
      real?: number;
      realBreakdown?: {
        irpj?: number;
        adicional?: number;
        csll?: number;
        pis?: number;
        cofins?: number;
        iss?: number;
        icms?: number;
        lucroEstimado?: number;
      };
      melhor?: string;
      economiaAnual?: number;
      fatorR?: number;
    };

    const regimeLabel: Record<string, string> = {
      simples: "Simples Nacional",
      presumido: "Lucro Presumido",
      real: "Lucro Real",
    };

    return (
      <div className="space-y-5">
        <div>
          <h3 className="font-semibold text-slate-800 text-lg mb-1">
            Comparativo dos 3 Regimes
          </h3>
          <p className="text-xs text-slate-500">
            Cálculo com alíquotas reais da legislação 2024/2025
          </p>
        </div>

        {/* DESTAQUE — Melhor regime */}
        <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 p-5">
          <p className="text-xs font-medium text-emerald-700 uppercase tracking-wide">
            🏆 Melhor opção pro seu caso
          </p>
          <p className="text-2xl font-bold text-emerald-900 mt-1">
            {regimeLabel[r.melhor || "simples"]}
          </p>
          <p className="text-sm text-emerald-700 mt-2">
            Economia anual estimada de{" "}
            <strong>{formatBRL(r.economiaAnual as number)}</strong> em relação ao regime
            mais caro.
          </p>
        </div>

        {/* 3 CARDS COMPARATIVOS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { key: "simples", label: "Simples Nacional", value: r.simples, sub: r.simplesAnexo ? `Anexo ${r.simplesAnexo}` : undefined },
            { key: "presumido", label: "Lucro Presumido", value: r.presumido },
            { key: "real", label: "Lucro Real", value: r.real },
          ].map((regime) => (
            <div
              key={regime.key}
              className={`rounded-lg p-4 text-center ${
                r.melhor === regime.key
                  ? "bg-emerald-50 border-2 border-emerald-500"
                  : "bg-slate-50 border border-slate-200"
              }`}
            >
              <p className="text-xs font-medium text-slate-500">{regime.label}</p>
              {regime.sub && (
                <p className="text-[10px] text-slate-400 mb-1">{regime.sub}</p>
              )}
              <p className="text-lg font-bold text-slate-800 mt-1">
                {formatBRL(regime.value as number)}
              </p>
              <p className="text-[10px] text-slate-500">/ mês</p>
              {r.melhor === regime.key && (
                <span className="inline-block mt-2 text-[10px] font-semibold text-emerald-700 bg-emerald-100 rounded-full px-2 py-0.5">
                  ✓ Mais econômico
                </span>
              )}
            </div>
          ))}
        </div>

        {/* DETALHAMENTO — SIMPLES */}
        {r.simples !== undefined && (
          <div className="rounded-lg border border-slate-200 p-3">
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
              📊 Simples Nacional — detalhamento
            </h4>
            <div className="flex justify-between text-sm py-1">
              <span className="text-slate-600">Alíquota efetiva</span>
              <span className="font-medium">
                {((r.simplesAliquota || 0) * 100).toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between text-sm py-1">
              <span className="text-slate-600">Anexo aplicável</span>
              <span className="font-medium">Anexo {r.simplesAnexo}</span>
            </div>
            {r.fatorR !== undefined && r.fatorR > 0 && (
              <div className="flex justify-between text-sm py-1">
                <span className="text-slate-600">Fator R</span>
                <span className="font-medium">
                  {(r.fatorR * 100).toFixed(1)}%{" "}
                  {r.fatorR >= 0.28 ? "✓ favorável" : "✗ desfavorável"}
                </span>
              </div>
            )}
          </div>
        )}

        {/* DETALHAMENTO — PRESUMIDO */}
        {r.presumidoBreakdown && (
          <div className="rounded-lg border border-slate-200 p-3">
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
              📊 Lucro Presumido — quebra
            </h4>
            {[
              { label: "IRPJ (15% sobre presunção)", v: r.presumidoBreakdown.irpj },
              { label: "Adicional IRPJ (10% acima de R$ 20k)", v: r.presumidoBreakdown.adicional },
              { label: "CSLL (9% sobre presunção)", v: r.presumidoBreakdown.csll },
              { label: "PIS (0,65%)", v: r.presumidoBreakdown.pis },
              { label: "COFINS (3%)", v: r.presumidoBreakdown.cofins },
              { label: "ISS", v: r.presumidoBreakdown.iss },
              { label: "ICMS", v: r.presumidoBreakdown.icms },
            ]
              .filter((x) => x.v && (x.v as number) > 0)
              .map((x) => (
                <div key={x.label} className="flex justify-between text-sm py-1">
                  <span className="text-slate-600">{x.label}</span>
                  <span className="font-medium">{formatBRL(x.v as number)}</span>
                </div>
              ))}
          </div>
        )}

        {/* DETALHAMENTO — REAL */}
        {r.realBreakdown && (
          <div className="rounded-lg border border-slate-200 p-3">
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
              📊 Lucro Real — quebra
            </h4>
            <div className="flex justify-between text-sm py-1">
              <span className="text-slate-600">Lucro estimado (receita − despesas)</span>
              <span className="font-medium">
                {formatBRL(r.realBreakdown.lucroEstimado || 0)}
              </span>
            </div>
            {[
              { label: "IRPJ (15% sobre lucro)", v: r.realBreakdown.irpj },
              { label: "Adicional IRPJ (10% acima de R$ 20k)", v: r.realBreakdown.adicional },
              { label: "CSLL (9% sobre lucro)", v: r.realBreakdown.csll },
              { label: "PIS (1,65% c/ créditos)", v: r.realBreakdown.pis },
              { label: "COFINS (7,6% c/ créditos)", v: r.realBreakdown.cofins },
              { label: "ISS", v: r.realBreakdown.iss },
              { label: "ICMS", v: r.realBreakdown.icms },
            ]
              .filter((x) => x.v && (x.v as number) > 0)
              .map((x) => (
                <div key={x.label} className="flex justify-between text-sm py-1">
                  <span className="text-slate-600">{x.label}</span>
                  <span className="font-medium">{formatBRL(x.v as number)}</span>
                </div>
              ))}
          </div>
        )}

        <p className="text-xs text-slate-500 italic border-t border-slate-200 pt-3">
          ⚠️ Estimativa baseada nos dados informados. Há outras variáveis (substituição
          tributária, benefícios fiscais, tipo de atividade específica) que podem alterar
          o resultado. Consulte seu contador para análise definitiva.
        </p>
      </div>
    );
  }

  if (type === "clt_cost") {
    const r = result as {
      salarioBase?: number;
      salarioEfetivo?: number;
      adicionais?: {
        periculosidade?: number;
        insalubridade?: number;
        horasExtras?: number;
        adicionalNoturno?: number;
        anuenio?: number;
      };
      encargos?: {
        inssPatronal?: number;
        rfap?: number;
        sistemaS?: number;
        salEduc?: number;
        fgts?: number;
        multaFgts?: number;
        total?: number;
      };
      provisoes?: { decimoTerceiro?: number; ferias?: number };
      beneficios?: {
        vt?: number;
        descontoVT?: number;
        vr?: number;
        va?: number;
        planoSaude?: number;
        planoOdonto?: number;
        seguroVida?: number;
        auxCreche?: number;
        auxEducacao?: number;
        auxHomeOffice?: number;
        academia?: number;
        outros?: number;
        total?: number;
      };
      indiretos?: {
        epiMensal?: number;
        treinaMensal?: number;
        examesMensal?: number;
        equipMensal?: number;
        total?: number;
      };
      custoMensal?: number;
      custoAnual?: number;
      fatorMultiplicador?: number;
    };

    const adicionaisItens = Object.entries({
      "Horas Extras": r.adicionais?.horasExtras,
      "Adicional Noturno": r.adicionais?.adicionalNoturno,
      "Periculosidade (30%)": r.adicionais?.periculosidade,
      "Insalubridade": r.adicionais?.insalubridade,
      "Anuênio/Tempo de Serviço": r.adicionais?.anuenio,
    }).filter(([, v]) => v && v > 0);

    const beneficiosItens = Object.entries({
      "Vale-Transporte (líquido)": r.beneficios?.vt,
      "Vale-Refeição": r.beneficios?.vr,
      "Vale-Alimentação": r.beneficios?.va,
      "Plano de Saúde": r.beneficios?.planoSaude,
      "Plano Odontológico": r.beneficios?.planoOdonto,
      "Seguro de Vida": r.beneficios?.seguroVida,
      "Auxílio-Creche": r.beneficios?.auxCreche,
      "Auxílio-Educação": r.beneficios?.auxEducacao,
      "Auxílio Home Office": r.beneficios?.auxHomeOffice,
      "Gympass/Academia": r.beneficios?.academia,
      "Outros Benefícios": r.beneficios?.outros,
    }).filter(([, v]) => v && v > 0);

    return (
      <div className="space-y-5">
        <div>
          <h3 className="font-semibold text-slate-800 text-lg mb-1">
            Custo Real do Funcionário CLT
          </h3>
          <p className="text-xs text-slate-500">
            Cálculo conforme legislação trabalhista vigente
          </p>
        </div>

        {/* DESTAQUE — CUSTO TOTAL */}
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-5">
          <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">
            Custo Total Mensal
          </p>
          <p className="text-3xl font-bold text-blue-900 mt-1">
            {formatBRL(r.custoMensal as number)}
          </p>
          <p className="text-sm text-blue-700 mt-2">
            Equivale a{" "}
            <strong>
              {r.fatorMultiplicador ? (r.fatorMultiplicador * 100).toFixed(0) : "0"}%
            </strong>{" "}
            do salário bruto. Custo anual:{" "}
            <strong>{formatBRL(r.custoAnual as number)}</strong>
          </p>
        </div>

        {/* SALÁRIO E ADICIONAIS */}
        <div className="rounded-lg border border-slate-200 p-3">
          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
            💰 Salário e Adicionais
          </h4>
          <div className="flex justify-between text-sm py-1">
            <span className="text-slate-600">Salário Base</span>
            <span className="font-medium">{formatBRL(r.salarioBase as number)}</span>
          </div>
          {adicionaisItens.map(([label, v]) => (
            <div key={label} className="flex justify-between text-sm py-1">
              <span className="text-slate-600">+ {label}</span>
              <span className="font-medium">{formatBRL(v as number)}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm pt-2 mt-1 border-t border-slate-100 font-semibold">
            <span className="text-slate-700">Salário Efetivo (base p/ encargos)</span>
            <span className="text-slate-900">
              {formatBRL(r.salarioEfetivo as number)}
            </span>
          </div>
        </div>

        {/* ENCARGOS */}
        <div className="rounded-lg border border-slate-200 p-3">
          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
            📋 Encargos Patronais
          </h4>
          {[
            { label: "INSS Patronal (20%)", v: r.encargos?.inssPatronal },
            { label: "RAT × FAP", v: r.encargos?.rfap },
            { label: "Sistema S (5,8%)", v: r.encargos?.sistemaS },
            { label: "Salário-Educação (2,5%)", v: r.encargos?.salEduc },
            { label: "FGTS (8%)", v: r.encargos?.fgts },
            { label: "Provisão Multa Rescisória FGTS (40%)", v: r.encargos?.multaFgts },
          ]
            .filter((x) => x.v && (x.v as number) > 0)
            .map((x) => (
              <div key={x.label} className="flex justify-between text-sm py-1">
                <span className="text-slate-600">{x.label}</span>
                <span className="font-medium">{formatBRL(x.v as number)}</span>
              </div>
            ))}
          <div className="flex justify-between text-sm pt-2 mt-1 border-t border-slate-100 font-semibold">
            <span className="text-slate-700">Total Encargos</span>
            <span className="text-slate-900">{formatBRL(r.encargos?.total as number)}</span>
          </div>
        </div>

        {/* PROVISÕES */}
        <div className="rounded-lg border border-slate-200 p-3">
          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
            📅 Provisões Mensais (já com encargos)
          </h4>
          <div className="flex justify-between text-sm py-1">
            <span className="text-slate-600">13º Salário (1/12 + encargos)</span>
            <span className="font-medium">
              {formatBRL(r.provisoes?.decimoTerceiro as number)}
            </span>
          </div>
          <div className="flex justify-between text-sm py-1">
            <span className="text-slate-600">Férias + 1/3 (1/12 + encargos)</span>
            <span className="font-medium">{formatBRL(r.provisoes?.ferias as number)}</span>
          </div>
        </div>

        {/* BENEFÍCIOS */}
        {beneficiosItens.length > 0 && (
          <div className="rounded-lg border border-slate-200 p-3">
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
              🎁 Benefícios
            </h4>
            {beneficiosItens.map(([label, v]) => (
              <div key={label} className="flex justify-between text-sm py-1">
                <span className="text-slate-600">{label}</span>
                <span className="font-medium">{formatBRL(v as number)}</span>
              </div>
            ))}
            {r.beneficios?.descontoVT && r.beneficios.descontoVT > 0 && (
              <p className="text-[10px] text-slate-500 mt-1 italic">
                * VT já considera desconto de até 6% do salário do funcionário (
                {formatBRL(r.beneficios.descontoVT)})
              </p>
            )}
            <div className="flex justify-between text-sm pt-2 mt-1 border-t border-slate-100 font-semibold">
              <span className="text-slate-700">Total Benefícios</span>
              <span className="text-slate-900">
                {formatBRL(r.beneficios?.total as number)}
              </span>
            </div>
          </div>
        )}

        {/* INDIRETOS */}
        {r.indiretos && (r.indiretos.total as number) > 0 && (
          <div className="rounded-lg border border-slate-200 p-3">
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
              🛠 Custos Indiretos (rateados mensal)
            </h4>
            {[
              { label: "EPI / Uniformes", v: r.indiretos.epiMensal },
              { label: "Treinamentos", v: r.indiretos.treinaMensal },
              { label: "Exames Médicos", v: r.indiretos.examesMensal },
              { label: "Equipamentos (amortizado)", v: r.indiretos.equipMensal },
            ]
              .filter((x) => x.v && (x.v as number) > 0)
              .map((x) => (
                <div key={x.label} className="flex justify-between text-sm py-1">
                  <span className="text-slate-600">{x.label}</span>
                  <span className="font-medium">{formatBRL(x.v as number)}</span>
                </div>
              ))}
          </div>
        )}

        <p className="text-xs text-slate-500 italic border-t border-slate-200 pt-3">
          ⚠️ Valores estimativos. Variações podem ocorrer conforme acordo
          coletivo da categoria, sindicato, convenções específicas e
          particularidades do regime tributário.
        </p>
      </div>
    );
  }

  if (type === "fiscal_health") {
    const levelLabels: Record<string, string> = {
      green: "Boa Saúde Fiscal",
      yellow: "Atenção Necessária",
      red: "Situação Crítica",
    };
    const levelColors: Record<string, string> = {
      green: "text-green-600",
      yellow: "text-amber-600",
      red: "text-red-600",
    };
    const levelBg: Record<string, string> = {
      green: "bg-green-50 border-green-200",
      yellow: "bg-amber-50 border-amber-200",
      red: "bg-red-50 border-red-200",
    };
    const recommendations = result.recommendations as string[] | undefined;
    const categoryScores = result.categoryScores as
      | Record<string, number>
      | undefined;

    const CAT_INFO: Record<string, { label: string; emoji: string }> = {
      fiscal: { label: "Conformidade Fiscal", emoji: "📋" },
      financeiro: { label: "Organização Financeira", emoji: "💰" },
      tributario: { label: "Planejamento Tributário", emoji: "📊" },
      trabalhista: { label: "Obrigações Trabalhistas", emoji: "👥" },
      tecnologia: { label: "Tecnologia e Gestão", emoji: "💻" },
    };

    function catBarColor(s: number): string {
      if (s >= 75) return "bg-green-500";
      if (s >= 50) return "bg-amber-500";
      return "bg-red-500";
    }

    return (
      <div className="space-y-5">
        <div>
          <h3 className="font-semibold text-slate-800 text-lg">
            Resultado do Diagnóstico
          </h3>
          <p className="text-xs text-slate-500">
            15 perguntas em 5 áreas técnicas
          </p>
        </div>

        {/* Score geral */}
        <div
          className={`rounded-xl p-5 border-2 text-center ${levelBg[scoreLevel || "green"]}`}
        >
          <p className="text-5xl font-bold text-slate-900">{score ?? 0}/100</p>
          <p
            className={`text-lg font-bold mt-2 ${levelColors[scoreLevel || "green"]}`}
          >
            {levelLabels[scoreLevel || "green"]}
          </p>
        </div>

        {/* Scores por categoria com barras */}
        {categoryScores && (
          <div className="rounded-lg border border-slate-200 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">
              Score por área
            </h4>
            <div className="space-y-3">
              {Object.entries(categoryScores).map(([cat, s]) => {
                const info = CAT_INFO[cat] || { label: cat, emoji: "" };
                return (
                  <div key={cat}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-700">
                        {info.emoji} {info.label}
                      </span>
                      <span className="font-semibold text-slate-900">{s}/100</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${catBarColor(s)} transition-all`}
                        style={{ width: `${s}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recomendações */}
        {recommendations && recommendations.length > 0 && (
          <div className="rounded-lg border border-slate-200 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">
              {scoreLevel === "green" ? "✅ Pontos fortes" : "⚠️ Pontos de atenção"}
            </h4>
            <ul className="space-y-2">
              {recommendations.map((rec, i) => (
                <li
                  key={i}
                  className="text-sm text-slate-700 flex items-start gap-2"
                >
                  <span className="text-blue-500 mt-0.5 shrink-0">→</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  if (type === "opening_cost") {
    const r = result as {
      abertura?: {
        registroJunta?: number;
        inscEstadual?: number;
        inscMunicipal?: number;
        alvara?: number;
        certificadoDigital?: number;
        licencaSanitaria?: number;
        licencaBombeiros?: number;
        licencaAmbiental?: number;
        conselhoProfissional?: number;
        honorAbertura?: number;
        outros?: number;
        total?: number;
      };
      recorrente?: {
        honorMensal?: number;
        renovAlvara?: number;
        totalAnual?: number;
      };
      capitalSocial?: number;
      estado?: string;
      cidade?: string;
      tipoEmpresa?: string;
      atividade?: string;
    };

    const aberturaItens = [
      { label: "Registro Junta Comercial / Cartório", v: r.abertura?.registroJunta },
      { label: "Inscrição Estadual", v: r.abertura?.inscEstadual },
      { label: "Inscrição Municipal", v: r.abertura?.inscMunicipal },
      { label: "Alvará de Funcionamento", v: r.abertura?.alvara },
      { label: "Certificado Digital (e-CNPJ A1)", v: r.abertura?.certificadoDigital },
      { label: "Licença Sanitária", v: r.abertura?.licencaSanitaria },
      { label: "AVCB / Bombeiros", v: r.abertura?.licencaBombeiros },
      { label: "Licença Ambiental", v: r.abertura?.licencaAmbiental },
      { label: "Conselho de Classe", v: r.abertura?.conselhoProfissional },
      { label: "Honorário Contábil (abertura)", v: r.abertura?.honorAbertura },
      { label: "Outros (autenticações, livros)", v: r.abertura?.outros },
    ].filter((x) => x.v && (x.v as number) > 0);

    return (
      <div className="space-y-5">
        <div>
          <h3 className="font-semibold text-slate-800 text-lg">
            Custo Completo de Abertura
          </h3>
          <p className="text-xs text-slate-500">
            {r.tipoEmpresa} · {r.cidade}/{r.estado} · {r.atividade}
          </p>
        </div>

        {/* DESTAQUE — Total único */}
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-5">
          <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">
            💰 Investimento único de abertura
          </p>
          <p className="text-3xl font-bold text-blue-900 mt-1">
            {formatBRL(r.abertura?.total as number)}
          </p>
          {r.recorrente && (r.recorrente.totalAnual as number) > 0 && (
            <p className="text-sm text-blue-700 mt-2">
              + custo recorrente:{" "}
              <strong>{formatBRL(r.recorrente.honorMensal || 0)}/mês</strong>{" "}
              de contador
              {(r.recorrente.renovAlvara as number) > 0
                ? ` + renovação anual de alvará ${formatBRL(r.recorrente.renovAlvara as number)}`
                : ""}
            </p>
          )}
        </div>

        {/* QUEBRA DETALHADA */}
        <div className="rounded-lg border border-slate-200 p-3">
          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
            📋 Custos únicos de abertura
          </h4>
          {aberturaItens.map((item) => (
            <div key={item.label} className="flex justify-between text-sm py-1">
              <span className="text-slate-600">{item.label}</span>
              <span className="font-medium text-slate-800">
                {formatBRL(item.v as number)}
              </span>
            </div>
          ))}
          <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
            <span className="text-slate-800">Total único</span>
            <span className="text-blue-600 text-lg">
              {formatBRL(r.abertura?.total as number)}
            </span>
          </div>
        </div>

        {/* CUSTOS RECORRENTES */}
        {r.recorrente && (r.recorrente.totalAnual as number) > 0 && (
          <div className="rounded-lg border border-slate-200 p-3">
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
              🔄 Custos recorrentes (anual)
            </h4>
            {(r.recorrente.honorMensal as number) > 0 && (
              <div className="flex justify-between text-sm py-1">
                <span className="text-slate-600">
                  Honorário contábil mensal × 12
                </span>
                <span className="font-medium text-slate-800">
                  {formatBRL((r.recorrente.honorMensal || 0) * 12)}
                </span>
              </div>
            )}
            {(r.recorrente.renovAlvara as number) > 0 && (
              <div className="flex justify-between text-sm py-1">
                <span className="text-slate-600">Renovação de alvará</span>
                <span className="font-medium text-slate-800">
                  {formatBRL(r.recorrente.renovAlvara as number)}
                </span>
              </div>
            )}
            <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
              <span className="text-slate-800">Total anual recorrente</span>
              <span className="text-slate-900">
                {formatBRL(r.recorrente.totalAnual as number)}
              </span>
            </div>
          </div>
        )}

        {/* CAPITAL SOCIAL (informativo) */}
        {(r.capitalSocial as number) > 0 && (
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-sm">
            <p className="text-slate-600">
              ℹ️ Capital social informado:{" "}
              <strong>{formatBRL(r.capitalSocial as number)}</strong> — esse valor
              fica integralizado na empresa e pertence aos sócios, não é "custo"
              do contador.
            </p>
          </div>
        )}

        <p className="text-xs text-slate-500 italic border-t border-slate-200 pt-3">
          ⚠️ Valores estimados conforme legislação vigente e médias de mercado.
          Taxas variam por município, conselho de classe e atividade específica.
          Consulte seu contador para análise definitiva.
        </p>
      </div>
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
// Calculator: Regime Simulator
// ---------------------------------------------------------------------------
// Helper compartilhado para inputs em BRL
function MoneyInput({
  label,
  value,
  setValue,
  hint,
  required,
}: {
  label: string;
  value: string;
  setValue: (v: string) => void;
  hint?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        required={required}
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, "");
          setValue(v ? formatInputBRL(parseInt(v)) : "");
        }}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
        placeholder="R$ 0,00"
      />
      {hint && <p className="text-[10px] text-slate-500 mt-0.5">{hint}</p>}
    </div>
  );
}

type AnexoSimples = "I" | "II" | "III" | "IV" | "V";
type TipoAtividade = "servicos" | "comercio" | "industria";

// Tabela Simples Nacional 2024/2025 (alíquota + parcela a deduzir)
// 6 faixas por anexo
const SIMPLES_TABELA: Record<
  AnexoSimples,
  Array<{ ate: number; aliq: number; pd: number }>
> = {
  // Anexo I - Comércio
  I: [
    { ate: 180000, aliq: 0.04, pd: 0 },
    { ate: 360000, aliq: 0.073, pd: 5940 },
    { ate: 720000, aliq: 0.095, pd: 13860 },
    { ate: 1800000, aliq: 0.107, pd: 22500 },
    { ate: 3600000, aliq: 0.143, pd: 87300 },
    { ate: 4800000, aliq: 0.19, pd: 378000 },
  ],
  // Anexo II - Indústria
  II: [
    { ate: 180000, aliq: 0.045, pd: 0 },
    { ate: 360000, aliq: 0.078, pd: 5940 },
    { ate: 720000, aliq: 0.1, pd: 13860 },
    { ate: 1800000, aliq: 0.112, pd: 22500 },
    { ate: 3600000, aliq: 0.147, pd: 85500 },
    { ate: 4800000, aliq: 0.3, pd: 720000 },
  ],
  // Anexo III - Serviços com Fator R favorável
  III: [
    { ate: 180000, aliq: 0.06, pd: 0 },
    { ate: 360000, aliq: 0.112, pd: 9360 },
    { ate: 720000, aliq: 0.135, pd: 17640 },
    { ate: 1800000, aliq: 0.16, pd: 35640 },
    { ate: 3600000, aliq: 0.21, pd: 125640 },
    { ate: 4800000, aliq: 0.33, pd: 648000 },
  ],
  // Anexo IV - Construção, serviços (sem CPP)
  IV: [
    { ate: 180000, aliq: 0.045, pd: 0 },
    { ate: 360000, aliq: 0.09, pd: 8100 },
    { ate: 720000, aliq: 0.102, pd: 12420 },
    { ate: 1800000, aliq: 0.14, pd: 39780 },
    { ate: 3600000, aliq: 0.22, pd: 183780 },
    { ate: 4800000, aliq: 0.33, pd: 828000 },
  ],
  // Anexo V - Serviços sem Fator R favorável
  V: [
    { ate: 180000, aliq: 0.155, pd: 0 },
    { ate: 360000, aliq: 0.18, pd: 4500 },
    { ate: 720000, aliq: 0.195, pd: 9900 },
    { ate: 1800000, aliq: 0.205, pd: 17100 },
    { ate: 3600000, aliq: 0.23, pd: 62100 },
    { ate: 4800000, aliq: 0.305, pd: 540000 },
  ],
};

function calcSimplesNacional(rbt12: number, anexo: AnexoSimples): {
  aliquotaEfetiva: number;
  imposto: number;
} {
  const tabela = SIMPLES_TABELA[anexo];
  const faixa = tabela.find((f) => rbt12 <= f.ate) || tabela[tabela.length - 1];
  const aliquotaEfetiva = rbt12 > 0 ? (rbt12 * faixa.aliq - faixa.pd) / rbt12 : 0;
  return { aliquotaEfetiva: Math.max(aliquotaEfetiva, 0), imposto: 0 };
}

function RegimeSimulator({
  onCalculate,
}: {
  onCalculate: (
    inputs: Record<string, unknown>,
    result: Record<string, unknown>
  ) => void;
}) {
  // Receita
  const [monthlyRevenue, setMonthlyRevenue] = useState("");
  const [annualRevenue, setAnnualRevenue] = useState("");
  const [activityType, setActivityType] = useState<TipoAtividade>("servicos");
  const [usaFatorR, setUsaFatorR] = useState(false);
  const [folhaSalarios, setFolhaSalarios] = useState(""); // mensal — pra Fator R

  // Lucro Real
  const [despesasOperacionais, setDespesasOperacionais] = useState(""); // mensal
  const [comprasInsumos, setComprasInsumos] = useState(""); // mensal (cred PIS/COFINS no Real)

  // ISS (municipal — quem presta serviço)
  const [aliquotaIss, setAliquotaIss] = useState("5"); // %

  // ICMS (estadual — comércio/indústria)
  const [aliquotaIcms, setAliquotaIcms] = useState("18"); // % média

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const monthly = parseFloat(monthlyRevenue.replace(/\D/g, "")) / 100 || 0;
    const annual = parseFloat(annualRevenue.replace(/\D/g, "")) / 100 || monthly * 12;
    const folha = parseFloat(folhaSalarios.replace(/\D/g, "")) / 100 || 0;
    const despesas = parseFloat(despesasOperacionais.replace(/\D/g, "")) / 100 || 0;
    const compras = parseFloat(comprasInsumos.replace(/\D/g, "")) / 100 || 0;
    const issPercent = parseFloat(aliquotaIss) / 100 || 0;
    const icmsPercent = parseFloat(aliquotaIcms) / 100 || 0;

    // ─── SIMPLES NACIONAL ───
    let anexo: AnexoSimples;
    if (activityType === "comercio") anexo = "I";
    else if (activityType === "industria") anexo = "II";
    else {
      // Serviços: Fator R decide entre III e V
      // Fator R = folha 12m / receita 12m. Se >= 0.28, usa Anexo III; senão V.
      const fatorR = annual > 0 ? (folha * 12) / annual : 0;
      if (usaFatorR && fatorR >= 0.28) anexo = "III";
      else if (usaFatorR) anexo = "V";
      else anexo = "III"; // default razoável
    }

    const { aliquotaEfetiva: simplesAliq } = calcSimplesNacional(annual, anexo);
    const simplesImposto = monthly * simplesAliq;
    const fatorR = annual > 0 ? (folha * 12) / annual : 0;

    // ─── LUCRO PRESUMIDO ───
    // Presunção: serviços 32%, comércio/indústria 8% (ou 1,6% para revenda de combustíveis, etc.)
    const presumidoBase =
      activityType === "servicos" ? 0.32 : activityType === "industria" ? 0.08 : 0.08;
    const lucroPresumido = monthly * presumidoBase;

    const presIRPJ = lucroPresumido * 0.15;
    const presAdicional =
      lucroPresumido > 20000 ? (lucroPresumido - 20000) * 0.1 : 0;
    const presCSLL = lucroPresumido * 0.09;
    const presPIS = monthly * 0.0065;
    const presCOFINS = monthly * 0.03;
    const presISS = activityType === "servicos" ? monthly * issPercent : 0;
    const presICMS =
      activityType === "comercio" || activityType === "industria"
        ? monthly * icmsPercent
        : 0;

    const presumidoTotal =
      presIRPJ + presAdicional + presCSLL + presPIS + presCOFINS + presISS + presICMS;

    // ─── LUCRO REAL ───
    // Lucro real estimado = receita - despesas operacionais - compras de insumos
    const lucroReal = Math.max(monthly - despesas - compras, 0);

    const realIRPJ = lucroReal * 0.15;
    const realAdicional = lucroReal > 20000 ? (lucroReal - 20000) * 0.1 : 0;
    const realCSLL = lucroReal * 0.09;
    // PIS/COFINS não-cumulativo: 1,65% + 7,6% sobre receita, com crédito sobre compras
    const realPIS = monthly * 0.0165 - compras * 0.0165;
    const realCOFINS = monthly * 0.076 - compras * 0.076;
    const realISS = activityType === "servicos" ? monthly * issPercent : 0;
    const realICMS =
      activityType === "comercio" || activityType === "industria"
        ? monthly * icmsPercent
        : 0;

    const realTotal =
      realIRPJ +
      realAdicional +
      realCSLL +
      Math.max(realPIS, 0) +
      Math.max(realCOFINS, 0) +
      realISS +
      realICMS;

    // Determinar melhor
    const values = {
      simples: simplesImposto,
      presumido: presumidoTotal,
      real: realTotal,
    };
    const melhor = Object.entries(values).reduce((a, b) =>
      a[1] < b[1] ? a : b
    )[0];

    const economiaAnual =
      (Math.max(...Object.values(values)) - Math.min(...Object.values(values))) * 12;

    onCalculate(
      {
        monthlyRevenue: monthly,
        annualRevenue: annual,
        activityType,
        anexo,
        folhaSalarios: folha,
        despesasOperacionais: despesas,
        comprasInsumos: compras,
        aliquotaIss: issPercent,
        aliquotaIcms: icmsPercent,
        fatorR,
      },
      {
        simples: simplesImposto,
        simplesAliquota: simplesAliq,
        simplesAnexo: anexo,
        presumido: presumidoTotal,
        presumidoBreakdown: {
          irpj: presIRPJ,
          adicional: presAdicional,
          csll: presCSLL,
          pis: presPIS,
          cofins: presCOFINS,
          iss: presISS,
          icms: presICMS,
        },
        real: realTotal,
        realBreakdown: {
          irpj: realIRPJ,
          adicional: realAdicional,
          csll: realCSLL,
          pis: Math.max(realPIS, 0),
          cofins: Math.max(realCOFINS, 0),
          iss: realISS,
          icms: realICMS,
          lucroEstimado: lucroReal,
        },
        melhor,
        economiaAnual,
        fatorR,
      }
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-sm text-slate-600">
        Compare <strong>Simples Nacional</strong>, <strong>Lucro Presumido</strong> e{" "}
        <strong>Lucro Real</strong> com todas as variáveis que influenciam o resultado.
      </p>

      {/* SEÇÃO 1: Receita */}
      <fieldset className="rounded-lg border border-slate-200 p-4 space-y-3">
        <legend className="text-xs font-bold uppercase tracking-wide text-slate-500 px-1">
          1. Receita e atividade
        </legend>
        <div className="grid grid-cols-2 gap-3">
          <MoneyInput
            label="Faturamento mensal médio"
            value={monthlyRevenue}
            setValue={(v) => {
              setMonthlyRevenue(v);
              const digits = v.replace(/\D/g, "");
              if (digits) {
                const m = parseInt(digits) / 100;
                setAnnualRevenue(formatInputBRL(Math.round(m * 12 * 100)));
              }
            }}
            required
          />
          <MoneyInput
            label="Faturamento anual (12 meses)"
            value={annualRevenue}
            setValue={setAnnualRevenue}
            hint="Auto-calculado, mas você pode ajustar"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Tipo de atividade *
          </label>
          <select
            value={activityType}
            onChange={(e) => setActivityType(e.target.value as TipoAtividade)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white"
          >
            <option value="servicos">Prestação de Serviços</option>
            <option value="comercio">Comércio (venda de mercadorias)</option>
            <option value="industria">Indústria / Fabricação</option>
          </select>
        </div>
      </fieldset>

      {/* SEÇÃO 2: Folha (afeta Fator R no Simples) */}
      {activityType === "servicos" && (
        <fieldset className="rounded-lg border border-slate-200 p-4 space-y-3">
          <legend className="text-xs font-bold uppercase tracking-wide text-slate-500 px-1">
            2. Folha de pagamento (decisivo no Simples)
          </legend>
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={usaFatorR}
              onChange={(e) => setUsaFatorR(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 mt-0.5"
            />
            <span className="text-xs text-slate-700">
              <strong>Quero calcular Fator R</strong> (se folha ≥ 28% do faturamento,
              cai no Anexo III; senão, Anexo V)
            </span>
          </label>
          {usaFatorR && (
            <MoneyInput
              label="Folha de pagamento mensal (salários + Pró-Labore)"
              value={folhaSalarios}
              setValue={setFolhaSalarios}
              hint="Inclua Pró-Labore se for sócio; afeta Anexo III/V do Simples"
            />
          )}
        </fieldset>
      )}

      {/* SEÇÃO 3: Despesas (afeta Lucro Real) */}
      <fieldset className="rounded-lg border border-slate-200 p-4 space-y-3">
        <legend className="text-xs font-bold uppercase tracking-wide text-slate-500 px-1">
          {activityType === "servicos" ? "3" : "2"}. Despesas (decisivo no Lucro Real)
        </legend>
        <div className="grid grid-cols-2 gap-3">
          <MoneyInput
            label="Despesas operacionais mensais"
            value={despesasOperacionais}
            setValue={setDespesasOperacionais}
            hint="Aluguel, folha, contas, etc."
          />
          <MoneyInput
            label="Compras de insumos / mercadorias"
            value={comprasInsumos}
            setValue={setComprasInsumos}
            hint="Geram crédito de PIS/COFINS no Real"
          />
        </div>
      </fieldset>

      {/* SEÇÃO 4: Alíquotas ISS/ICMS */}
      <fieldset className="rounded-lg border border-slate-200 p-4 space-y-3">
        <legend className="text-xs font-bold uppercase tracking-wide text-slate-500 px-1">
          {activityType === "servicos" ? "4" : "3"}. Alíquotas estadual/municipal
        </legend>
        <div className="grid grid-cols-2 gap-3">
          {activityType === "servicos" && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                ISS do município (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={aliquotaIss}
                onChange={(e) => setAliquotaIss(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">
                Varia de 2% a 5% conforme município e atividade
              </p>
            </div>
          )}
          {(activityType === "comercio" || activityType === "industria") && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                ICMS médio (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="25"
                value={aliquotaIcms}
                onChange={(e) => setAliquotaIcms(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">
                Varia conforme produto e UF (geralmente 17% a 19%)
              </p>
            </div>
          )}
        </div>
      </fieldset>

      <button
        type="submit"
        className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition shadow-md"
      >
        Comparar os 3 regimes
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Calculator: CLT Cost (legislação completa, todos valores digitáveis)
// ---------------------------------------------------------------------------
type RegimeEmpresa = "simples" | "presumido_real";
type Insalubridade = "nao" | "minimo_10" | "medio_20" | "maximo_40";

function CltMoney({
  label,
  value,
  setValue,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  setValue: (v: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-700 mb-1">{label}</label>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, "");
          setValue(v ? formatInputBRL(parseInt(v)) : "");
        }}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
        placeholder={placeholder ?? "R$ 0,00"}
      />
      {hint && <p className="text-[10px] text-slate-500 mt-0.5">{hint}</p>}
    </div>
  );
}

function CltCostCalculator({
  onCalculate,
}: {
  onCalculate: (
    inputs: Record<string, unknown>,
    result: Record<string, unknown>
  ) => void;
}) {
  // ── Salário e adicionais ──
  const [salary, setSalary] = useState("");
  const [horasExtras, setHorasExtras] = useState(""); // valor mensal em R$
  const [adicionalNoturno, setAdicionalNoturno] = useState(""); // R$ mensal
  const [periculosidade, setPericulosidade] = useState(false);
  const [insalubridade, setInsalubridade] = useState<Insalubridade>("nao");
  const [anuenio, setAnuenio] = useState("");

  // ── Regime e encargos ──
  const [regime, setRegime] = useState<RegimeEmpresa>("presumido_real");
  const [rat, setRat] = useState("3"); // 1, 2 ou 3
  const [fap, setFap] = useState("1.0"); // 0.5 a 2.0
  const [diasUteis, setDiasUteis] = useState("22");

  // ── Benefícios mensais (R$) ──
  const [vt, setVt] = useState(""); // vale-transporte mensal
  const [vrDia, setVrDia] = useState(""); // vale-refeição por dia
  const [vaMensal, setVaMensal] = useState(""); // vale-alimentação mensal
  const [planoSaude, setPlanoSaude] = useState("");
  const [planoOdonto, setPlanoOdonto] = useState("");
  const [seguroVida, setSeguroVida] = useState("");
  const [auxCreche, setAuxCreche] = useState("");
  const [auxEducacao, setAuxEducacao] = useState("");
  const [auxHomeOffice, setAuxHomeOffice] = useState("");
  const [academia, setAcademia] = useState("");
  const [outrosBeneficios, setOutrosBeneficios] = useState("");

  // ── Custos anuais (rateados) ──
  const [epiUniforme, setEpiUniforme] = useState(""); // anual
  const [treinamentos, setTreinamentos] = useState(""); // anual
  const [exames, setExames] = useState(""); // anual
  const [equipamentos, setEquipamentos] = useState(""); // one-time, amortizar 24 meses

  function parseBRL(s: string): number {
    return parseFloat(s.replace(/\D/g, "")) / 100 || 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const salarioBase = parseBRL(salary);
    const valHE = parseBRL(horasExtras);
    const valAdNoturno = parseBRL(adicionalNoturno);
    const valAnuenio = parseBRL(anuenio);
    const ratNum = parseFloat(rat) / 100;
    const fapNum = parseFloat(fap);
    const dias = parseInt(diasUteis) || 22;

    // Insalubridade incide sobre salário mínimo (R$ 1.518 em 2025)
    const SAL_MIN = 1518;
    const insalubridadeValor =
      insalubridade === "minimo_10"
        ? SAL_MIN * 0.1
        : insalubridade === "medio_20"
          ? SAL_MIN * 0.2
          : insalubridade === "maximo_40"
            ? SAL_MIN * 0.4
            : 0;

    // Periculosidade = 30% sobre salário base
    const periculosidadeValor = periculosidade ? salarioBase * 0.3 : 0;

    // Salário bruto efetivo (base para FGTS, INSS, 13º, férias)
    const salarioEfetivo =
      salarioBase +
      valHE +
      valAdNoturno +
      valAnuenio +
      insalubridadeValor +
      periculosidadeValor;

    // ── Encargos patronais ──
    const inssPatronal = regime === "simples" ? 0 : salarioEfetivo * 0.2;
    const rfap = salarioEfetivo * ratNum * fapNum;
    const sistemaS = regime === "simples" ? 0 : salarioEfetivo * 0.058;
    const salEduc = regime === "simples" ? 0 : salarioEfetivo * 0.025;
    const fgts = salarioEfetivo * 0.08;
    const multaFgts = fgts * 0.4; // provisão p/ rescisão (média)

    const totalEncargosBase = inssPatronal + rfap + sistemaS + salEduc + fgts + multaFgts;
    const taxaEncargos =
      salarioEfetivo > 0 ? totalEncargosBase / salarioEfetivo : 0;

    // ── Provisões (com encargos) ──
    const decimoTerceiroBase = salarioEfetivo / 12;
    const decimoTerceiro = decimoTerceiroBase * (1 + taxaEncargos);

    const feriasBase = (salarioEfetivo * (1 + 1 / 3)) / 12;
    const ferias = feriasBase * (1 + taxaEncargos);

    // ── Benefícios mensais ──
    const vtValor = parseBRL(vt);
    // Desconto VT: até 6% do salário do funcionário (lei 7.418/85). Empresa paga o restante.
    const descontoVT = Math.min(vtValor, salarioBase * 0.06);
    const custoVT = Math.max(vtValor - descontoVT, 0);

    const custoVR = parseBRL(vrDia) * dias;
    const custoVA = parseBRL(vaMensal);
    const custoSaude = parseBRL(planoSaude);
    const custoOdonto = parseBRL(planoOdonto);
    const custoSeguro = parseBRL(seguroVida);
    const custoCreche = parseBRL(auxCreche);
    const custoEducacao = parseBRL(auxEducacao);
    const custoHO = parseBRL(auxHomeOffice);
    const custoAcademia = parseBRL(academia);
    const custoOutros = parseBRL(outrosBeneficios);

    const totalBeneficios =
      custoVT +
      custoVR +
      custoVA +
      custoSaude +
      custoOdonto +
      custoSeguro +
      custoCreche +
      custoEducacao +
      custoHO +
      custoAcademia +
      custoOutros;

    // ── Custos anuais rateados (mensal) ──
    const epiMensal = parseBRL(epiUniforme) / 12;
    const treinaMensal = parseBRL(treinamentos) / 12;
    const examesMensal = parseBRL(exames) / 12;
    const equipMensal = parseBRL(equipamentos) / 24; // amortiza 2 anos
    const totalIndiretos = epiMensal + treinaMensal + examesMensal + equipMensal;

    // ── Totais ──
    const totalEncargosMes =
      inssPatronal + rfap + sistemaS + salEduc + fgts + multaFgts;

    const custoMensal =
      salarioEfetivo +
      totalEncargosMes +
      decimoTerceiro +
      ferias +
      totalBeneficios +
      totalIndiretos;

    const custoAnual = custoMensal * 12;
    const fatorMultiplicador = salarioBase > 0 ? custoMensal / salarioBase : 0;

    onCalculate(
      {
        salarioBase,
        horasExtras: valHE,
        adicionalNoturno: valAdNoturno,
        periculosidade,
        insalubridade,
        insalubridadeValor,
        anuenio: valAnuenio,
        regime,
        rat: ratNum,
        fap: fapNum,
        diasUteis: dias,
        beneficios: {
          vtValor,
          vrDia: parseBRL(vrDia),
          vaMensal: custoVA,
          planoSaude: custoSaude,
          planoOdonto: custoOdonto,
          seguroVida: custoSeguro,
          auxCreche: custoCreche,
          auxEducacao: custoEducacao,
          auxHomeOffice: custoHO,
          academia: custoAcademia,
          outros: custoOutros,
        },
        custosAnuais: {
          epiUniforme: parseBRL(epiUniforme),
          treinamentos: parseBRL(treinamentos),
          exames: parseBRL(exames),
          equipamentos: parseBRL(equipamentos),
        },
      },
      {
        salarioBase,
        salarioEfetivo,
        adicionais: {
          periculosidade: periculosidadeValor,
          insalubridade: insalubridadeValor,
          horasExtras: valHE,
          adicionalNoturno: valAdNoturno,
          anuenio: valAnuenio,
        },
        encargos: {
          inssPatronal,
          rfap,
          sistemaS,
          salEduc,
          fgts,
          multaFgts,
          total: totalEncargosMes,
        },
        provisoes: {
          decimoTerceiro,
          ferias,
        },
        beneficios: {
          vt: custoVT,
          descontoVT,
          vr: custoVR,
          va: custoVA,
          planoSaude: custoSaude,
          planoOdonto: custoOdonto,
          seguroVida: custoSeguro,
          auxCreche: custoCreche,
          auxEducacao: custoEducacao,
          auxHomeOffice: custoHO,
          academia: custoAcademia,
          outros: custoOutros,
          total: totalBeneficios,
        },
        indiretos: {
          epiMensal,
          treinaMensal,
          examesMensal,
          equipMensal,
          total: totalIndiretos,
        },
        custoMensal,
        custoAnual,
        fatorMultiplicador,
      }
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-sm text-slate-600">
        Calcule o custo <strong>completo</strong> de um funcionário CLT incluindo
        todos os encargos, adicionais legais, provisões e benefícios.
      </p>

      {/* ─── SALÁRIO + ADICIONAIS ─── */}
      <fieldset className="rounded-lg border border-slate-200 p-4 space-y-3">
        <legend className="text-xs font-bold uppercase tracking-wide text-slate-500 px-1">
          1. Salário e Adicionais
        </legend>
        <CltMoney
          label="Salário Bruto Mensal (R$) *"
          value={salary}
          setValue={setSalary}
        />
        <div className="grid grid-cols-2 gap-3">
          <CltMoney
            label="Horas Extras (R$/mês)"
            value={horasExtras}
            setValue={setHorasExtras}
            hint="Valor médio mensal"
          />
          <CltMoney
            label="Adicional Noturno (R$/mês)"
            value={adicionalNoturno}
            setValue={setAdicionalNoturno}
            hint="20% sobre horas após 22h"
          />
          <CltMoney
            label="Anuênio / Tempo de Serviço (R$/mês)"
            value={anuenio}
            setValue={setAnuenio}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={periculosidade}
              onChange={(e) => setPericulosidade(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 mt-0.5"
            />
            <span className="text-xs text-slate-700">
              <strong>Periculosidade (30%)</strong>
              <br />
              <span className="text-slate-500">Incide sobre salário base</span>
            </span>
          </label>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Insalubridade
            </label>
            <select
              value={insalubridade}
              onChange={(e) => setInsalubridade(e.target.value as Insalubridade)}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs"
            >
              <option value="nao">Não tem</option>
              <option value="minimo_10">Grau Mínimo (10%)</option>
              <option value="medio_20">Grau Médio (20%)</option>
              <option value="maximo_40">Grau Máximo (40%)</option>
            </select>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Incide sobre salário mínimo
            </p>
          </div>
        </div>
      </fieldset>

      {/* ─── REGIME E ENCARGOS ─── */}
      <fieldset className="rounded-lg border border-slate-200 p-4 space-y-3">
        <legend className="text-xs font-bold uppercase tracking-wide text-slate-500 px-1">
          2. Regime da empresa e RAT
        </legend>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Regime tributário
          </label>
          <select
            value={regime}
            onChange={(e) => setRegime(e.target.value as RegimeEmpresa)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="presumido_real">
              Lucro Presumido / Lucro Real (INSS 20% + Sistema S)
            </option>
            <option value="simples">
              Simples Nacional (sem INSS Patronal e Sistema S)
            </option>
          </select>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              RAT (Risco)
            </label>
            <select
              value={rat}
              onChange={(e) => setRat(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs"
            >
              <option value="1">1% (Leve)</option>
              <option value="2">2% (Médio)</option>
              <option value="3">3% (Grave)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              FAP (Multiplicador)
            </label>
            <input
              type="number"
              step="0.05"
              min="0.5"
              max="2"
              value={fap}
              onChange={(e) => setFap(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Dias úteis/mês
            </label>
            <input
              type="number"
              min="20"
              max="22"
              value={diasUteis}
              onChange={(e) => setDiasUteis(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs"
            />
          </div>
        </div>
      </fieldset>

      {/* ─── BENEFÍCIOS ─── */}
      <fieldset className="rounded-lg border border-slate-200 p-4 space-y-3">
        <legend className="text-xs font-bold uppercase tracking-wide text-slate-500 px-1">
          3. Benefícios Mensais (deixe em branco o que não oferecer)
        </legend>
        <div className="grid grid-cols-2 gap-3">
          <CltMoney
            label="Vale-Transporte (R$/mês)"
            value={vt}
            setValue={setVt}
            hint="Empresa cobra 6% do funcionário; resto é custo seu"
          />
          <CltMoney
            label="Vale-Refeição (R$/dia)"
            value={vrDia}
            setValue={setVrDia}
            hint="Multiplicado por dias úteis"
          />
          <CltMoney
            label="Vale-Alimentação (R$/mês)"
            value={vaMensal}
            setValue={setVaMensal}
          />
          <CltMoney
            label="Plano de Saúde (R$/mês)"
            value={planoSaude}
            setValue={setPlanoSaude}
          />
          <CltMoney
            label="Plano Odontológico (R$/mês)"
            value={planoOdonto}
            setValue={setPlanoOdonto}
          />
          <CltMoney
            label="Seguro de Vida (R$/mês)"
            value={seguroVida}
            setValue={setSeguroVida}
          />
          <CltMoney
            label="Auxílio-Creche (R$/mês)"
            value={auxCreche}
            setValue={setAuxCreche}
          />
          <CltMoney
            label="Auxílio-Educação (R$/mês)"
            value={auxEducacao}
            setValue={setAuxEducacao}
          />
          <CltMoney
            label="Auxílio Home Office (R$/mês)"
            value={auxHomeOffice}
            setValue={setAuxHomeOffice}
          />
          <CltMoney
            label="Gympass / Academia (R$/mês)"
            value={academia}
            setValue={setAcademia}
          />
          <CltMoney
            label="Outros Benefícios (R$/mês)"
            value={outrosBeneficios}
            setValue={setOutrosBeneficios}
            hint="Premiações, PLR, etc."
          />
        </div>
      </fieldset>

      {/* ─── CUSTOS ANUAIS ─── */}
      <fieldset className="rounded-lg border border-slate-200 p-4 space-y-3">
        <legend className="text-xs font-bold uppercase tracking-wide text-slate-500 px-1">
          4. Custos Anuais (rateados no mês)
        </legend>
        <div className="grid grid-cols-2 gap-3">
          <CltMoney
            label="EPI / Uniformes (R$/ano)"
            value={epiUniforme}
            setValue={setEpiUniforme}
          />
          <CltMoney
            label="Treinamentos (R$/ano)"
            value={treinamentos}
            setValue={setTreinamentos}
          />
          <CltMoney
            label="Exames Médicos (R$/ano)"
            value={exames}
            setValue={setExames}
            hint="Admissional, periódico, demissional"
          />
          <CltMoney
            label="Equipamentos (R$ único)"
            value={equipamentos}
            setValue={setEquipamentos}
            hint="Notebook, mesa, cadeira — amortizado em 24 meses"
          />
        </div>
      </fieldset>

      <button
        type="submit"
        className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition shadow-md"
      >
        Calcular custo completo
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Calculator: Fiscal Health Quiz
// ---------------------------------------------------------------------------
// Quiz expandido — 15 perguntas em 5 categorias (3 cada)
// Categorias: Conformidade Fiscal, Organização Financeira,
// Planejamento Tributário, Obrigações Trabalhistas, Tecnologia/Gestão
type QuizCategory =
  | "fiscal"
  | "financeiro"
  | "tributario"
  | "trabalhista"
  | "tecnologia";

const QUIZ_QUESTIONS: Array<{
  category: QuizCategory;
  q: string;
  options: string[];
  scores: number[];
}> = [
  // ── CONFORMIDADE FISCAL ──
  {
    category: "fiscal",
    q: "Suas obrigações acessórias (SPED, DCTFWeb, EFD-Reinf, EFD-Contribuições) estão em dia?",
    options: ["Sim, todas", "A maioria", "Algumas atrasadas", "Estou com pendências graves"],
    scores: [10, 6, 2, 0],
  },
  {
    category: "fiscal",
    q: "Todas as notas fiscais (entrada e saída) são registradas corretamente no SPED Fiscal?",
    options: ["Sim, 100%", "Maioria sim", "Só as de saída", "Não tenho controle"],
    scores: [10, 6, 2, 0],
  },
  {
    category: "fiscal",
    q: "Você possui certidões negativas válidas (Federal, Estadual, Municipal, FGTS, Trabalhista)?",
    options: ["Sim, todas vigentes", "Algumas vigentes", "Tenho pendências", "Não verifico há tempo"],
    scores: [10, 5, 1, 0],
  },

  // ── ORGANIZAÇÃO FINANCEIRA ──
  {
    category: "financeiro",
    q: "Você separa as contas pessoais (PF) das contas da empresa (PJ)?",
    options: ["Sim, completamente", "Na maioria das vezes", "Às vezes misturo", "Uso a mesma conta"],
    scores: [10, 6, 2, 0],
  },
  {
    category: "financeiro",
    q: "Você possui controle de fluxo de caixa atualizado?",
    options: ["Sim, diário", "Sim, semanal", "Apenas mensal", "Não possuo"],
    scores: [10, 8, 4, 0],
  },
  {
    category: "financeiro",
    q: "Você concilia mensalmente extrato bancário com lançamentos contábeis?",
    options: ["Sim, todo mês", "A cada 2-3 meses", "Anualmente", "Nunca fiz"],
    scores: [10, 6, 2, 0],
  },

  // ── PLANEJAMENTO TRIBUTÁRIO ──
  {
    category: "tributario",
    q: "Você sabe qual regime tributário (Simples / Presumido / Real) economiza mais imposto pra sua empresa?",
    options: ["Sim, analisado nos últimos 12m", "Sim, mas faz mais de 2 anos", "Tenho dúvida", "Não sei"],
    scores: [10, 5, 2, 0],
  },
  {
    category: "tributario",
    q: "Seu Pró-Labore está otimizado considerando IR e INSS?",
    options: ["Sim, calculado a cada ano", "Está há 2+ anos sem revisão", "Não tenho Pró-Labore definido", "Não sei o que é"],
    scores: [10, 4, 2, 0],
  },
  {
    category: "tributario",
    q: "Você usa todos os créditos fiscais a que tem direito (PIS/COFINS, ICMS, IPI)?",
    options: ["Sim, controle ativo", "Em parte", "Não controlo", "Não se aplica"],
    scores: [10, 5, 1, 8],
  },

  // ── OBRIGAÇÕES TRABALHISTAS ──
  {
    category: "trabalhista",
    q: "Sua folha de pagamento, eSocial e DCTFWeb estão regularizados?",
    options: ["Sim, totalmente", "Tenho pendências menores", "Tenho pendências sérias", "Sem funcionários"],
    scores: [10, 5, 0, 10],
  },
  {
    category: "trabalhista",
    q: "Os funcionários têm registro CLT formalizado e contratos atualizados?",
    options: ["Sim, todos", "Maioria sim", "Alguns informais", "Não se aplica"],
    scores: [10, 5, 0, 10],
  },
  {
    category: "trabalhista",
    q: "Você faz provisões de 13º, férias e multa rescisória FGTS no caixa?",
    options: ["Sim, provisiono mensal", "Faço quando lembro", "Não provisiono", "Não se aplica"],
    scores: [10, 4, 1, 10],
  },

  // ── TECNOLOGIA E GESTÃO ──
  {
    category: "tecnologia",
    q: "Você possui certificado digital e-CNPJ A1 ou A3 vigente?",
    options: ["Sim, vigente", "Vencido há pouco tempo", "Não tenho", "Não sei o que é"],
    scores: [10, 5, 0, 0],
  },
  {
    category: "tecnologia",
    q: "Quanto tempo leva pra você ter um relatório atualizado de receitas/despesas?",
    options: ["Vejo a qualquer momento (sistema integrado)", "Recebo do contador no dia 15", "Recebo até o fim do mês seguinte", "Demora 2+ meses"],
    scores: [10, 7, 3, 0],
  },
  {
    category: "tecnologia",
    q: "Seu contador atual te responde dúvidas em até 24h úteis?",
    options: ["Sim, sempre", "Às vezes", "Quase nunca", "Não sei nem quem é"],
    scores: [10, 5, 1, 0],
  },
];

function FiscalHealthQuiz({
  onCalculate,
}: {
  onCalculate: (
    inputs: Record<string, unknown>,
    result: Record<string, unknown>,
    score: number,
    scoreLevel: string
  ) => void;
}) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);

  function handleAnswer(scoreValue: number, answerIdx: number) {
    const newAnswers = [...answers, answerIdx];
    setAnswers(newAnswers);

    if (currentQ < QUIZ_QUESTIONS.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      // Score total = soma de cada resposta. Máx = 15*10 = 150.
      // Normaliza pra 0-100 pra facilitar interpretação.
      const totalRaw = newAnswers.reduce((sum, aIdx, qIdx) => {
        return sum + QUIZ_QUESTIONS[qIdx].scores[aIdx];
      }, 0);
      const totalScore = Math.round((totalRaw / (QUIZ_QUESTIONS.length * 10)) * 100);

      const level = totalScore >= 75 ? "green" : totalScore >= 50 ? "yellow" : "red";

      // Score por categoria (média 0-10)
      const categories: Record<QuizCategory, { total: number; count: number }> = {
        fiscal: { total: 0, count: 0 },
        financeiro: { total: 0, count: 0 },
        tributario: { total: 0, count: 0 },
        trabalhista: { total: 0, count: 0 },
        tecnologia: { total: 0, count: 0 },
      };
      newAnswers.forEach((aIdx, qIdx) => {
        const cat = QUIZ_QUESTIONS[qIdx].category;
        categories[cat].total += QUIZ_QUESTIONS[qIdx].scores[aIdx];
        categories[cat].count += 1;
      });
      const categoryScores: Record<string, number> = {};
      Object.entries(categories).forEach(([cat, { total, count }]) => {
        categoryScores[cat] = count > 0 ? Math.round((total / (count * 10)) * 100) : 0;
      });

      // Recomendações por categoria fraca (< 60)
      const recommendations: string[] = [];
      const CAT_LABEL: Record<QuizCategory, string> = {
        fiscal: "conformidade fiscal (obrigações acessórias, SPED, certidões)",
        financeiro: "organização financeira (separação PF/PJ, fluxo de caixa, conciliação)",
        tributario: "planejamento tributário (regime, Pró-Labore, créditos fiscais)",
        trabalhista: "obrigações trabalhistas (eSocial, folha, provisões)",
        tecnologia: "tecnologia e gestão (certificado digital, relatórios, agilidade do contador)",
      };
      (Object.entries(categoryScores) as [QuizCategory, number][]).forEach(
        ([cat, score]) => {
          if (score < 60) {
            recommendations.push(
              `Atenção em ${CAT_LABEL[cat]} — score ${score}/100`
            );
          }
        }
      );
      if (recommendations.length === 0) {
        recommendations.push("Sua gestão fiscal está em boa forma — continue!");
        recommendations.push(
          "Recomendamos revisar planejamento tributário anualmente para manter."
        );
      }

      onCalculate(
        { answers: newAnswers.map((a, i) => ({ question: i, answer: a })) },
        { recommendations, categoryScores, totalRaw, maxRaw: QUIZ_QUESTIONS.length * 10 },
        totalScore,
        level
      );
    }
  }

  const question = QUIZ_QUESTIONS[currentQ];

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600">
        Responda 15 perguntas técnicas e descubra a saúde fiscal da sua empresa
        em 5 áreas: conformidade, finanças, tributário, trabalhista e gestão.
      </p>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-slate-500">
          <span>Pergunta {currentQ + 1} de {QUIZ_QUESTIONS.length}</span>
          <span>{Math.round(((currentQ) / QUIZ_QUESTIONS.length) * 100)}%</span>
        </div>
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-300"
            style={{ width: `${((currentQ) / QUIZ_QUESTIONS.length) * 100}%` }}
          />
        </div>
      </div>

      <div>
        <h3 className="text-base font-medium text-slate-800 mb-4">{question.q}</h3>
        <div className="space-y-2">
          {question.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleAnswer(question.scores[idx], idx)}
              className="w-full text-left rounded-lg border border-slate-200 px-4 py-3 text-sm hover:border-blue-500 hover:bg-blue-50 transition"
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Calculator: Opening Cost
// ---------------------------------------------------------------------------
const STATES = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA",
  "MG", "MS", "MT", "PA", "PB", "PE", "PI", "PR", "RJ", "RN",
  "RO", "RR", "RS", "SC", "SE", "SP", "TO",
];

const COMPANY_TYPES = [
  { value: "mei", label: "MEI — Microempreendedor Individual" },
  { value: "ei", label: "EI — Empresário Individual" },
  { value: "slu", label: "SLU — Sociedade Limitada Unipessoal" },
  { value: "ltda", label: "LTDA — Sociedade Limitada (≥ 2 sócios)" },
  { value: "ss", label: "S/S — Sociedade Simples (profissões regulamentadas)" },
  { value: "sa", label: "S/A — Sociedade Anônima" },
];

function OpeningCostCalculator({
  onCalculate,
}: {
  onCalculate: (
    inputs: Record<string, unknown>,
    result: Record<string, unknown>
  ) => void;
}) {
  // Dados básicos
  const [state, setState] = useState("SP");
  const [city, setCity] = useState("");
  const [companyType, setCompanyType] = useState("slu");
  const [activity, setActivity] = useState<"servicos" | "comercio" | "industria">("servicos");
  const [capitalSocial, setCapitalSocial] = useState("");
  const [numSocios, setNumSocios] = useState("1");

  // Atividades reguladas
  const [vigSanitaria, setVigSanitaria] = useState(false);
  const [bombeiros, setBombeiros] = useState(false);
  const [meioAmbiente, setMeioAmbiente] = useState(false);
  const [conselhoClasse, setConselhoClasse] = useState(false);

  // Mensalidades pós-abertura
  const [hireContador, setHireContador] = useState(true);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const capital = parseFloat(capitalSocial.replace(/\D/g, "")) / 100 || 0;

    // ── Custos únicos de abertura ──

    // Junta Comercial / Cartório (registro do contrato social ou requerimento)
    let registroJunta = 0;
    if (companyType === "mei") registroJunta = 0; // MEI é gratuito
    else if (companyType === "ei") registroJunta = 95;
    else if (companyType === "slu") registroJunta = 220;
    else if (companyType === "ltda") registroJunta = 220;
    else if (companyType === "ss") registroJunta = 320; // cartório de PJ
    else if (companyType === "sa") registroJunta = 850;

    // Multiplicador por estado (taxas variam — SP/RJ caros, NE mais baratos)
    const stateMultipliers: Record<string, number> = {
      SP: 1.3, RJ: 1.25, MG: 1.1, PR: 1.1, RS: 1.1, SC: 1.05,
      ES: 1.0, MS: 0.95, MT: 0.95, GO: 0.95,
      BA: 0.95, PE: 0.95, CE: 0.9, MA: 0.9, PI: 0.85, RN: 0.9,
      PB: 0.9, AL: 0.85, SE: 0.85,
      DF: 1.2, AM: 1.05, AC: 0.95, AP: 0.95, PA: 0.95, RO: 0.95, RR: 0.95, TO: 0.9,
    };
    const multiplier = stateMultipliers[state] || 1.0;
    registroJunta = Math.round(registroJunta * multiplier);

    // CNPJ é gratuito na Receita Federal — só taxa de DBE/coleta web
    const cnpj = 0;

    // Inscrição Estadual (somente comércio/indústria) — taxa varia
    const inscEstadual =
      activity === "comercio" || activity === "industria"
        ? Math.round(150 * multiplier)
        : 0;

    // Inscrição Municipal (todas as empresas)
    const inscMunicipal = companyType === "mei" ? 0 : Math.round(120 * multiplier);

    // Alvará de funcionamento
    const alvara = companyType === "mei" ? 0 : Math.round(250 * multiplier);

    // Certificado Digital (e-CNPJ A1: ~R$ 220, A3 com token: ~R$ 350)
    const certificadoDigital = 220;

    // Licenças específicas (somente se aplicáveis)
    const licencaSanitaria = vigSanitaria ? Math.round(450 * multiplier) : 0;
    const licencaBombeiros = bombeiros ? Math.round(380 * multiplier) : 0;
    const licencaAmbiental = meioAmbiente ? Math.round(900 * multiplier) : 0;
    const conselhoProfissional = conselhoClasse ? Math.round(700 * multiplier) : 0;

    // Honorário contábil — abertura (uma vez)
    let honorAbertura = 0;
    if (companyType === "mei") honorAbertura = 250;
    else if (companyType === "ei" || companyType === "slu") honorAbertura = 800;
    else if (companyType === "ltda") honorAbertura = 1200;
    else if (companyType === "ss") honorAbertura = 1500;
    else if (companyType === "sa") honorAbertura = 3500;

    // Outros custos (autenticações, carimbo, livros contábeis)
    const outros = companyType === "mei" ? 50 : Math.round(180 * multiplier);

    // Total único
    const totalAbertura =
      registroJunta +
      cnpj +
      inscEstadual +
      inscMunicipal +
      alvara +
      certificadoDigital +
      licencaSanitaria +
      licencaBombeiros +
      licencaAmbiental +
      conselhoProfissional +
      honorAbertura +
      outros;

    // ── Custos recorrentes (mensais) ──
    let honorMensal = 0;
    if (hireContador) {
      if (companyType === "mei") honorMensal = 80;
      else if (companyType === "ei" || companyType === "slu")
        honorMensal = activity === "servicos" ? 350 : 450;
      else if (companyType === "ltda")
        honorMensal = activity === "servicos" ? 450 : 600;
      else if (companyType === "ss") honorMensal = 550;
      else if (companyType === "sa") honorMensal = 1500;
    }

    // Renovação alvará (anual)
    const renovAlvara = companyType === "mei" ? 0 : Math.round(150 * multiplier);

    const totalRecorrenteAnual = honorMensal * 12 + renovAlvara;

    const typeLabel =
      COMPANY_TYPES.find((t) => t.value === companyType)?.label || companyType;

    onCalculate(
      {
        state,
        city,
        companyType,
        activity,
        capitalSocial: capital,
        numSocios: parseInt(numSocios) || 1,
        licencas: { vigSanitaria, bombeiros, meioAmbiente, conselhoClasse },
        hireContador,
      },
      {
        abertura: {
          registroJunta,
          inscEstadual,
          inscMunicipal,
          alvara,
          certificadoDigital,
          licencaSanitaria,
          licencaBombeiros,
          licencaAmbiental,
          conselhoProfissional,
          honorAbertura,
          outros,
          total: totalAbertura,
        },
        recorrente: {
          honorMensal,
          renovAlvara,
          totalAnual: totalRecorrenteAnual,
        },
        capitalSocial: capital,
        estado: state,
        cidade: city || state,
        tipoEmpresa: typeLabel,
        atividade: activity,
      }
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-sm text-slate-600">
        Estime <strong>todos os custos</strong> para abrir sua empresa: registros,
        licenças, honorários e mensalidades pós-abertura.
      </p>

      {/* ─── DADOS BÁSICOS ─── */}
      <fieldset className="rounded-lg border border-slate-200 p-4 space-y-3">
        <legend className="text-xs font-bold uppercase tracking-wide text-slate-500 px-1">
          1. Dados básicos
        </legend>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Tipo de empresa *
          </label>
          <select
            value={companyType}
            onChange={(e) => setCompanyType(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white"
          >
            {COMPANY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Estado *
            </label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white"
            >
              {STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Cidade
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Ex: Salvador"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Atividade econômica *
            </label>
            <select
              value={activity}
              onChange={(e) => setActivity(e.target.value as "servicos" | "comercio" | "industria")}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white"
            >
              <option value="servicos">Prestação de Serviços</option>
              <option value="comercio">Comércio (venda)</option>
              <option value="industria">Indústria / Fabricação</option>
            </select>
          </div>
          {companyType === "ltda" || companyType === "ss" || companyType === "sa" ? (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Número de sócios
              </label>
              <input
                type="number"
                min="2"
                value={numSocios}
                onChange={(e) => setNumSocios(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          ) : null}
        </div>
        {companyType !== "mei" && (
          <MoneyInput
            label="Capital social"
            value={capitalSocial}
            setValue={setCapitalSocial}
            hint="Valor inicial integralizado pelos sócios — pode ser baixo (R$ 100 já vale)"
          />
        )}
      </fieldset>

      {/* ─── LICENÇAS ESPECÍFICAS ─── */}
      {companyType !== "mei" && (
        <fieldset className="rounded-lg border border-slate-200 p-4 space-y-3">
          <legend className="text-xs font-bold uppercase tracking-wide text-slate-500 px-1">
            2. Licenças específicas (marque se sua atividade exige)
          </legend>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={vigSanitaria}
                onChange={(e) => setVigSanitaria(e.target.checked)}
                className="h-4 w-4 mt-0.5"
              />
              <span className="text-xs text-slate-700">
                <strong>Vigilância Sanitária</strong>
                <br />
                <span className="text-slate-500">Alimentos, saúde, beleza</span>
              </span>
            </label>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={bombeiros}
                onChange={(e) => setBombeiros(e.target.checked)}
                className="h-4 w-4 mt-0.5"
              />
              <span className="text-xs text-slate-700">
                <strong>Corpo de Bombeiros</strong>
                <br />
                <span className="text-slate-500">Local com público</span>
              </span>
            </label>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={meioAmbiente}
                onChange={(e) => setMeioAmbiente(e.target.checked)}
                className="h-4 w-4 mt-0.5"
              />
              <span className="text-xs text-slate-700">
                <strong>Meio Ambiente</strong>
                <br />
                <span className="text-slate-500">Indústria, postos</span>
              </span>
            </label>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={conselhoClasse}
                onChange={(e) => setConselhoClasse(e.target.checked)}
                className="h-4 w-4 mt-0.5"
              />
              <span className="text-xs text-slate-700">
                <strong>Conselho de Classe</strong>
                <br />
                <span className="text-slate-500">CRC, CREA, OAB, CRM</span>
              </span>
            </label>
          </div>
        </fieldset>
      )}

      {/* ─── HONORÁRIOS ─── */}
      <fieldset className="rounded-lg border border-slate-200 p-4 space-y-3">
        <legend className="text-xs font-bold uppercase tracking-wide text-slate-500 px-1">
          3. Contador (recomendado)
        </legend>
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={hireContador}
            onChange={(e) => setHireContador(e.target.checked)}
            className="h-4 w-4 mt-0.5"
          />
          <span className="text-xs text-slate-700">
            <strong>Contratar contador</strong>
            <br />
            <span className="text-slate-500">
              Incluir honorário de abertura (uma vez) + mensalidade no cálculo.
              Recomendado para tudo exceto MEI muito simples.
            </span>
          </span>
        </label>
      </fieldset>

      <button
        type="submit"
        className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition shadow-md"
      >
        Calcular custos completos
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatBRL(value: number) {
  if (value === undefined || value === null || isNaN(value)) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatInputBRL(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}
