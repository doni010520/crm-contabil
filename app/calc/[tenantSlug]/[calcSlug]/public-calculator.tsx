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
      presumido?: number;
      real?: number;
      melhor?: string;
    };
    return (
      <div className="space-y-4">
        <h3 className="font-semibold text-slate-800 text-lg">Comparativo de Regimes</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Simples Nacional", value: r.simples, key: "simples" },
            { label: "Lucro Presumido", value: r.presumido, key: "presumido" },
            { label: "Lucro Real", value: r.real, key: "real" },
          ].map((regime) => (
            <div
              key={regime.key}
              className={`rounded-lg p-4 text-center ${
                r.melhor === regime.key
                  ? "bg-green-50 border-2 border-green-500"
                  : "bg-slate-50 border border-slate-200"
              }`}
            >
              <p className="text-xs font-medium text-slate-500 mb-1">{regime.label}</p>
              <p className="text-lg font-bold text-slate-800">
                {formatBRL(regime.value as number)}
              </p>
              {r.melhor === regime.key && (
                <span className="text-xs font-medium text-green-600 mt-1 block">
                  Melhor opção
                </span>
              )}
            </div>
          ))}
        </div>
        <p className="text-sm text-slate-600">
          Com base nos dados informados, o regime mais vantajoso é o{" "}
          <strong>
            {r.melhor === "simples"
              ? "Simples Nacional"
              : r.melhor === "presumido"
                ? "Lucro Presumido"
                : "Lucro Real"}
          </strong>
          , com uma economia estimada de{" "}
          <strong>
            {formatBRL(
              Math.max(r.simples || 0, r.presumido || 0, r.real || 0) -
                Math.min(r.simples || 0, r.presumido || 0, r.real || 0)
            )}
          </strong>{" "}
          por mês em relação ao regime mais caro.
        </p>
      </div>
    );
  }

  if (type === "clt_cost") {
    const r = result as {
      salarioBruto?: number;
      inss?: number;
      fgts?: number;
      ferias?: number;
      decimoTerceiro?: number;
      beneficios?: number;
      total?: number;
    };
    const items = [
      { label: "Salário Bruto", value: r.salarioBruto },
      { label: "INSS Patronal (20%)", value: r.inss },
      { label: "FGTS (8%)", value: r.fgts },
      { label: "Provisão Férias", value: r.ferias },
      { label: "Provisão 13º", value: r.decimoTerceiro },
      { label: "Benefícios", value: r.beneficios },
    ];
    return (
      <div className="space-y-4">
        <h3 className="font-semibold text-slate-800 text-lg">Custo Total do Funcionário</h3>
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.label} className="flex justify-between text-sm">
              <span className="text-slate-600">{item.label}</span>
              <span className="font-medium text-slate-800">
                {formatBRL(item.value as number)}
              </span>
            </div>
          ))}
          <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
            <span className="text-slate-800">Custo Total Mensal</span>
            <span className="text-blue-600 text-lg">{formatBRL(r.total as number)}</span>
          </div>
        </div>
        <p className="text-sm text-slate-600">
          O custo real de um funcionário é aproximadamente{" "}
          <strong>
            {r.salarioBruto && r.total
              ? ((r.total / r.salarioBruto) * 100).toFixed(0)
              : "---"}
            %
          </strong>{" "}
          do salário bruto.
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
      yellow: "text-yellow-600",
      red: "text-red-600",
    };
    const levelBg: Record<string, string> = {
      green: "bg-green-50 border-green-200",
      yellow: "bg-yellow-50 border-yellow-200",
      red: "bg-red-50 border-red-200",
    };
    const recommendations = result.recommendations as string[] | undefined;
    return (
      <div className="space-y-4">
        <h3 className="font-semibold text-slate-800 text-lg">Resultado do Quiz</h3>
        <div className={`rounded-lg p-4 border text-center ${levelBg[scoreLevel || "green"]}`}>
          <p className="text-3xl font-bold">{score ?? 0}/100</p>
          <p className={`font-semibold mt-1 ${levelColors[scoreLevel || "green"]}`}>
            {levelLabels[scoreLevel || "green"]}
          </p>
        </div>
        {recommendations && recommendations.length > 0 && (
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Recomendações:</p>
            <ul className="space-y-1">
              {recommendations.map((rec, i) => (
                <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  {rec}
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
      registroJuntaComercial?: number;
      alvara?: number;
      certificadoDigital?: number;
      contabilidade?: number;
      taxasEstadual?: number;
      outrosEstimados?: number;
      total?: number;
      estado?: string;
      tipoEmpresa?: string;
    };
    const items = [
      { label: "Registro na Junta Comercial", value: r.registroJuntaComercial },
      { label: "Alvará de Funcionamento", value: r.alvara },
      { label: "Certificado Digital", value: r.certificadoDigital },
      { label: "Honorários Contábeis", value: r.contabilidade },
      { label: "Taxas Estaduais", value: r.taxasEstadual },
      { label: "Outros (estimativa)", value: r.outrosEstimados },
    ];
    return (
      <div className="space-y-4">
        <h3 className="font-semibold text-slate-800 text-lg">
          Custo Estimado de Abertura
        </h3>
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.label} className="flex justify-between text-sm">
              <span className="text-slate-600">{item.label}</span>
              <span className="font-medium text-slate-800">
                {formatBRL(item.value as number)}
              </span>
            </div>
          ))}
          <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
            <span className="text-slate-800">Total Estimado</span>
            <span className="text-blue-600 text-lg">{formatBRL(r.total as number)}</span>
          </div>
        </div>
        <p className="text-sm text-slate-600">
          Valores estimados para abertura de {r.tipoEmpresa || "empresa"} no estado de{" "}
          {r.estado || "SP"}. Os valores reais podem variar.
        </p>
      </div>
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
// Calculator: Regime Simulator
// ---------------------------------------------------------------------------
function RegimeSimulator({
  onCalculate,
}: {
  onCalculate: (
    inputs: Record<string, unknown>,
    result: Record<string, unknown>
  ) => void;
}) {
  const [monthlyRevenue, setMonthlyRevenue] = useState("");
  const [annualRevenue, setAnnualRevenue] = useState("");
  const [activityType, setActivityType] = useState("servicos");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const monthly = parseFloat(monthlyRevenue.replace(/\D/g, "")) / 100 || 0;
    const annual = parseFloat(annualRevenue.replace(/\D/g, "")) / 100 || monthly * 12;

    // Simplified tax calculations
    const simplesRate = annual <= 180000 ? 0.06 : annual <= 360000 ? 0.112 : annual <= 720000 ? 0.135 : annual <= 1800000 ? 0.16 : 0.19;
    const simples = monthly * simplesRate;

    const presumidoBase = activityType === "servicos" ? 0.32 : 0.08;
    const presumidoIR = monthly * presumidoBase * 0.15;
    const presumidoCSLL = monthly * presumidoBase * 0.09;
    const presumidoPIS = monthly * 0.0065;
    const presumidoCOFINS = monthly * 0.03;
    const presumidoISS = activityType === "servicos" ? monthly * 0.05 : 0;
    const presumido = presumidoIR + presumidoCSLL + presumidoPIS + presumidoCOFINS + presumidoISS;

    const realPIS = monthly * 0.0165;
    const realCOFINS = monthly * 0.076;
    const estimatedProfit = monthly * 0.2;
    const realIR = estimatedProfit * 0.15;
    const realCSLL = estimatedProfit * 0.09;
    const real = realPIS + realCOFINS + realIR + realCSLL;

    const values = { simples, presumido, real };
    const melhor = Object.entries(values).reduce((a, b) => (a[1] < b[1] ? a : b))[0];

    onCalculate(
      { monthlyRevenue: monthly, annualRevenue: annual, activityType },
      { simples, presumido, real, melhor }
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-slate-600 mb-4">
        Compare os regimes tributários e descubra qual é o mais vantajoso para sua empresa.
      </p>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Faturamento mensal (R$)
        </label>
        <input
          type="text"
          required
          value={monthlyRevenue}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "");
            setMonthlyRevenue(v ? formatInputBRL(parseInt(v)) : "");
            if (v) {
              const m = parseInt(v) / 100;
              setAnnualRevenue(formatInputBRL(Math.round(m * 12 * 100)));
            }
          }}
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
          placeholder="R$ 0,00"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Faturamento anual (R$)
        </label>
        <input
          type="text"
          value={annualRevenue}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "");
            setAnnualRevenue(v ? formatInputBRL(parseInt(v)) : "");
          }}
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
          placeholder="R$ 0,00"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Tipo de atividade
        </label>
        <select
          value={activityType}
          onChange={(e) => setActivityType(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition bg-white"
        >
          <option value="servicos">Prestação de Serviços</option>
          <option value="comercio">Comércio</option>
          <option value="industria">Indústria</option>
        </select>
      </div>
      <button
        type="submit"
        className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition"
      >
        Comparar regimes
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Calculator: CLT Cost
// ---------------------------------------------------------------------------
function CltCostCalculator({
  onCalculate,
}: {
  onCalculate: (
    inputs: Record<string, unknown>,
    result: Record<string, unknown>
  ) => void;
}) {
  const [salary, setSalary] = useState("");
  const [valeTransporte, setValeTransporte] = useState(true);
  const [valeRefeicao, setValeRefeicao] = useState(true);
  const [planoSaude, setPlanoSaude] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const salarioBruto = parseFloat(salary.replace(/\D/g, "")) / 100 || 0;

    const inss = salarioBruto * 0.2;
    const fgts = salarioBruto * 0.08;
    const ferias = (salarioBruto * 1.3333) / 12;
    const decimoTerceiro = salarioBruto / 12;
    let beneficios = 0;
    if (valeTransporte) beneficios += 300;
    if (valeRefeicao) beneficios += 600;
    if (planoSaude) beneficios += 500;

    const total = salarioBruto + inss + fgts + ferias + decimoTerceiro + beneficios;

    onCalculate(
      { salarioBruto, valeTransporte, valeRefeicao, planoSaude },
      { salarioBruto, inss, fgts, ferias, decimoTerceiro, beneficios, total }
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-slate-600 mb-4">
        Descubra o custo real de um funcionário CLT incluindo todos os encargos.
      </p>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Salário bruto (R$)
        </label>
        <input
          type="text"
          required
          value={salary}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "");
            setSalary(v ? formatInputBRL(parseInt(v)) : "");
          }}
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
          placeholder="R$ 0,00"
        />
      </div>
      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-700">Benefícios</label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={valeTransporte}
            onChange={(e) => setValeTransporte(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-slate-600">Vale Transporte (~R$ 300)</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={valeRefeicao}
            onChange={(e) => setValeRefeicao(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-slate-600">Vale Refeição (~R$ 600)</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={planoSaude}
            onChange={(e) => setPlanoSaude(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-slate-600">Plano de Saúde (~R$ 500)</span>
        </label>
      </div>
      <button
        type="submit"
        className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition"
      >
        Calcular custo
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Calculator: Fiscal Health Quiz
// ---------------------------------------------------------------------------
const QUIZ_QUESTIONS = [
  {
    q: "Sua empresa está com todas as obrigações acessórias em dia?",
    options: ["Sim, todas", "A maioria", "Algumas atrasadas", "Não sei"],
    scores: [10, 7, 3, 0],
  },
  {
    q: "Você possui um controle de fluxo de caixa atualizado?",
    options: ["Sim, diário", "Sim, semanal", "Apenas mensal", "Não possuo"],
    scores: [10, 8, 4, 0],
  },
  {
    q: "Suas notas fiscais são emitidas corretamente e no prazo?",
    options: ["Sempre", "Na maioria das vezes", "Às vezes atrasam", "Raramente"],
    scores: [10, 7, 3, 0],
  },
  {
    q: "Você sabe qual é o regime tributário ideal para sua empresa?",
    options: ["Sim, foi analisado recentemente", "Sim, mas faz tempo", "Tenho dúvida", "Não sei"],
    scores: [10, 6, 3, 0],
  },
  {
    q: "Sua empresa possui certidões negativas válidas?",
    options: ["Sim, todas", "Algumas", "Não sei", "Tenho pendências"],
    scores: [10, 5, 2, 0],
  },
  {
    q: "Seus impostos são pagos em dia?",
    options: ["Sempre", "Quase sempre", "Às vezes atraso", "Frequentemente atraso"],
    scores: [10, 7, 3, 0],
  },
  {
    q: "Você faz uma análise mensal dos seus resultados financeiros?",
    options: ["Sim, com contador", "Sim, sozinho", "Raramente", "Nunca"],
    scores: [10, 7, 3, 0],
  },
  {
    q: "Sua folha de pagamento está regularizada?",
    options: ["Sim, totalmente", "Parcialmente", "Tenho informais", "Não se aplica"],
    scores: [10, 5, 0, 10],
  },
  {
    q: "Você possui planejamento tributário?",
    options: ["Sim, atualizado", "Já tive", "Nunca fiz", "Não sei o que é"],
    scores: [10, 5, 1, 0],
  },
  {
    q: "Quando foi a última vez que você revisou seus custos fixos?",
    options: ["Último mês", "Últimos 3 meses", "Último ano", "Nunca revisei"],
    scores: [10, 7, 3, 0],
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
      // Calculate final score
      const totalScore = newAnswers.reduce((sum, aIdx, qIdx) => {
        return sum + QUIZ_QUESTIONS[qIdx].scores[aIdx];
      }, 0);

      const level = totalScore >= 70 ? "green" : totalScore >= 40 ? "yellow" : "red";

      const recommendations: string[] = [];
      if (totalScore < 70) {
        if (QUIZ_QUESTIONS[0].scores[newAnswers[0]] < 7)
          recommendations.push("Regularize suas obrigações acessórias pendentes.");
        if (QUIZ_QUESTIONS[1].scores[newAnswers[1]] < 7)
          recommendations.push("Implemente um controle de fluxo de caixa mais frequente.");
        if (QUIZ_QUESTIONS[3].scores[newAnswers[3]] < 7)
          recommendations.push("Faça uma revisão do seu regime tributário com um contador.");
        if (QUIZ_QUESTIONS[4].scores[newAnswers[4]] < 7)
          recommendations.push("Verifique e regularize suas certidões negativas.");
        if (QUIZ_QUESTIONS[8].scores[newAnswers[8]] < 7)
          recommendations.push("Considere fazer um planejamento tributário.");
      }
      if (recommendations.length === 0) {
        recommendations.push("Continue mantendo sua gestão fiscal em dia!");
        recommendations.push("Considere revisar seu planejamento tributário anualmente.");
      }

      onCalculate(
        { answers: newAnswers.map((a, i) => ({ question: i, answer: a })) },
        { recommendations },
        totalScore,
        level
      );
    }
  }

  const question = QUIZ_QUESTIONS[currentQ];

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600">
        Responda 10 perguntas rápidas e descubra como está a saúde fiscal da sua empresa.
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
  { value: "mei", label: "MEI" },
  { value: "me", label: "Microempresa (ME)" },
  { value: "epp", label: "Empresa de Pequeno Porte (EPP)" },
  { value: "ltda", label: "Sociedade Limitada (LTDA)" },
  { value: "sa", label: "Sociedade Anônima (SA)" },
];

function OpeningCostCalculator({
  onCalculate,
}: {
  onCalculate: (
    inputs: Record<string, unknown>,
    result: Record<string, unknown>
  ) => void;
}) {
  const [state, setState] = useState("SP");
  const [companyType, setCompanyType] = useState("me");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Base costs vary by company type
    const baseCosts: Record<string, { junta: number; alvara: number; cert: number; cont: number; taxas: number; outros: number }> = {
      mei: { junta: 0, alvara: 0, cert: 150, cont: 200, taxas: 0, outros: 50 },
      me: { junta: 350, alvara: 200, cert: 200, cont: 800, taxas: 300, outros: 200 },
      epp: { junta: 350, alvara: 300, cert: 200, cont: 1200, taxas: 400, outros: 300 },
      ltda: { junta: 450, alvara: 300, cert: 200, cont: 1500, taxas: 500, outros: 400 },
      sa: { junta: 800, alvara: 500, cert: 200, cont: 3000, taxas: 800, outros: 600 },
    };

    // State multipliers (simplified)
    const stateMultipliers: Record<string, number> = {
      SP: 1.3, RJ: 1.25, MG: 1.1, PR: 1.05, RS: 1.1, SC: 1.05,
      BA: 0.95, PE: 0.95, CE: 0.9, DF: 1.2,
    };
    const multiplier = stateMultipliers[state] || 1.0;

    const costs = baseCosts[companyType] || baseCosts.me;
    const registroJuntaComercial = Math.round(costs.junta * multiplier);
    const alvara = Math.round(costs.alvara * multiplier);
    const certificadoDigital = costs.cert;
    const contabilidade = Math.round(costs.cont * multiplier);
    const taxasEstadual = Math.round(costs.taxas * multiplier);
    const outrosEstimados = Math.round(costs.outros * multiplier);
    const total = registroJuntaComercial + alvara + certificadoDigital + contabilidade + taxasEstadual + outrosEstimados;

    const typeLabel = COMPANY_TYPES.find((t) => t.value === companyType)?.label || companyType;

    onCalculate(
      { state, companyType },
      {
        registroJuntaComercial,
        alvara,
        certificadoDigital,
        contabilidade,
        taxasEstadual,
        outrosEstimados,
        total,
        estado: state,
        tipoEmpresa: typeLabel,
      }
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-slate-600 mb-4">
        Estime os custos para abrir sua empresa com base no estado e tipo societário.
      </p>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Estado
        </label>
        <select
          value={state}
          onChange={(e) => setState(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition bg-white"
        >
          {STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Tipo de empresa
        </label>
        <select
          value={companyType}
          onChange={(e) => setCompanyType(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition bg-white"
        >
          {COMPANY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition"
      >
        Calcular custos
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
