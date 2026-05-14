"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  ArrowLeft,
  Loader2,
  Copy,
  Check,
  RefreshCw,
  Smartphone,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import type { MeetingBriefing } from "../actions";
import {
  getBriefing,
  updateManualInputs,
  generateBriefing,
} from "../actions";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const SECTION_TITLES: Record<string, string> = {
  summary: "Resumo do Prospect",
  tax_simulation: "Simulação de Regime Tributário",
  opportunities: "Oportunidades Identificadas",
  risks: "Pontos de Atenção e Riscos",
  sector_data: "Dados do Setor",
  meeting_agenda: "Agenda Sugerida para a Reunião",
  spin_questions: "Perguntas SPIN Personalizadas",
  objection_handling: "Objeções Prováveis e Respostas",
  roi_estimate: "Estimativa de ROI",
  obligation_calendar: "Calendário de Obrigações",
  onboarding_checklist: "Checklist de Onboarding",
  cheat_sheet: "Cola Rápida",
};

const SECTION_ORDER = [
  "summary",
  "tax_simulation",
  "opportunities",
  "risks",
  "sector_data",
  "meeting_agenda",
  "spin_questions",
  "objection_handling",
  "roi_estimate",
  "obligation_calendar",
  "onboarding_checklist",
  "cheat_sheet",
];

const PAIN_OPTIONS = [
  "Atendimento ruim do contador atual",
  "Atrasos em guias e obrigações",
  "Falta de relatórios gerenciais",
  "Problemas com eSocial / folha",
  "Não recebe planejamento tributário",
  "Preço alto sem valor percebido",
  "Multas e penalidades recorrentes",
  "Falta de suporte para decisões",
];

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  draft: { label: "Rascunho", variant: "secondary" },
  enriching: { label: "Enriquecendo...", variant: "outline" },
  generating: { label: "Gerando...", variant: "outline" },
  completed: { label: "Concluído", variant: "default" },
  error: { label: "Erro", variant: "destructive" },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const formatCnpj = (cnpj: string | null) => {
  if (!cnpj) return "—";
  const d = cnpj.replace(/\D/g, "");
  if (d.length !== 14) return cnpj;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
};

// ---------------------------------------------------------------------------
// Simple Markdown Renderer
// ---------------------------------------------------------------------------
function MarkdownContent({ text }: { text: string }) {
  const lines = text.split("\n");

  const rendered = lines.map((line, i) => {
    // Table detection
    if (line.startsWith("|") && line.endsWith("|")) {
      return null; // Handled below
    }

    // Bold
    let processed = line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

    // Checklist
    if (processed.startsWith("- [ ] ")) {
      return (
        <div key={i} className="flex items-start gap-2 py-0.5">
          <input type="checkbox" disabled className="mt-1" />
          <span dangerouslySetInnerHTML={{ __html: processed.slice(6) }} />
        </div>
      );
    }
    if (processed.startsWith("- [x] ")) {
      return (
        <div key={i} className="flex items-start gap-2 py-0.5">
          <input type="checkbox" checked disabled className="mt-1" />
          <span dangerouslySetInnerHTML={{ __html: processed.slice(6) }} />
        </div>
      );
    }

    // Numbered list
    const numberedMatch = processed.match(/^(\d+)\.\s+(.*)/);
    if (numberedMatch) {
      return (
        <div key={i} className="flex gap-2 py-0.5">
          <span className="shrink-0 text-muted-foreground">
            {numberedMatch[1]}.
          </span>
          <span dangerouslySetInnerHTML={{ __html: numberedMatch[2] }} />
        </div>
      );
    }

    // Bullet list
    if (processed.startsWith("- ")) {
      return (
        <div key={i} className="flex gap-2 py-0.5 pl-2">
          <span className="shrink-0 text-muted-foreground">•</span>
          <span dangerouslySetInnerHTML={{ __html: processed.slice(2) }} />
        </div>
      );
    }

    // Empty line
    if (!processed.trim()) return <div key={i} className="h-2" />;

    // Regular text
    return (
      <p key={i} className="py-0.5" dangerouslySetInnerHTML={{ __html: processed }} />
    );
  });

  // Check for tables
  const tableBlocks: { startIdx: number; rows: string[][] }[] = [];
  let currentTable: string[][] | null = null;
  let tableStart = -1;
  lines.forEach((line, i) => {
    if (line.startsWith("|") && line.endsWith("|")) {
      if (!currentTable) {
        currentTable = [];
        tableStart = i;
      }
      // Skip separator rows
      if (/^\|[-|\s:]+\|$/.test(line)) return;
      const cells = line
        .split("|")
        .slice(1, -1)
        .map((c) => c.trim());
      currentTable.push(cells);
    } else if (currentTable) {
      tableBlocks.push({ startIdx: tableStart, rows: currentTable });
      currentTable = null;
    }
  });
  if (currentTable) {
    tableBlocks.push({ startIdx: tableStart, rows: currentTable });
  }

  // Merge tables into rendered output
  if (tableBlocks.length > 0) {
    const finalElements: React.ReactNode[] = [];
    let lastInserted = 0;
    const lineIsTable = new Set<number>();

    for (const block of tableBlocks) {
      // Mark lines as table
      for (let i = block.startIdx; i < block.startIdx + block.rows.length + 1; i++) {
        lineIsTable.add(i);
      }
    }

    let blockIdx = 0;
    for (let i = 0; i < rendered.length; i++) {
      if (lineIsTable.has(i)) {
        if (blockIdx < tableBlocks.length && tableBlocks[blockIdx].startIdx === i) {
          const block = tableBlocks[blockIdx];
          finalElements.push(
            <div key={`table-${i}`} className="my-2 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    {block.rows[0]?.map((cell, ci) => (
                      <th
                        key={ci}
                        className="border border-border bg-muted px-3 py-1.5 text-left font-medium"
                      >
                        {cell}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.slice(1).map((row, ri) => (
                    <tr key={ri}>
                      {row.map((cell, ci) => (
                        <td
                          key={ci}
                          className="border border-border px-3 py-1.5"
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
          blockIdx++;
        }
        continue;
      }
      if (rendered[i] !== null) finalElements.push(rendered[i]);
    }
    return <div>{finalElements}</div>;
  }

  return <div>{rendered}</div>;
}

// ---------------------------------------------------------------------------
// Copy Button
// ---------------------------------------------------------------------------
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <Button variant="ghost" size="sm" onClick={handleCopy}>
      {copied ? (
        <>
          <Check className="mr-1 h-3 w-3" /> Copiado
        </>
      ) : (
        <>
          <Copy className="mr-1 h-3 w-3" /> Copiar
        </>
      )}
    </Button>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------
export default function BriefingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [briefing, setBriefing] = useState<MeetingBriefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Manual inputs form
  const [monthlyRevenue, setMonthlyRevenue] = useState("");
  const [monthlyPayroll, setMonthlyPayroll] = useState("");
  const [employeeCount, setEmployeeCount] = useState("");
  const [monthlyInvoices, setMonthlyInvoices] = useState("");
  const [currentAccountant, setCurrentAccountant] = useState("");
  const [switchingReason, setSwitchingReason] = useState("");
  const [mainPain, setMainPain] = useState<string[]>([]);
  const [additionalNotes, setAdditionalNotes] = useState("");

  // Load briefing
  const loadBriefing = useCallback(async () => {
    try {
      const data = await getBriefing(id);
      setBriefing(data);

      // Populate form from existing manual inputs
      if (data?.manual_inputs) {
        const m = data.manual_inputs as Record<string, unknown>;
        if (m.monthly_revenue) setMonthlyRevenue(String(m.monthly_revenue));
        if (m.monthly_payroll) setMonthlyPayroll(String(m.monthly_payroll));
        if (m.employee_count) setEmployeeCount(String(m.employee_count));
        if (m.monthly_invoices) setMonthlyInvoices(String(m.monthly_invoices));
        if (m.current_accountant) setCurrentAccountant(m.current_accountant as string);
        if (m.switching_reason) setSwitchingReason(m.switching_reason as string);
        if (Array.isArray(m.main_pain)) setMainPain(m.main_pain as string[]);
        if (m.additional_notes) setAdditionalNotes(m.additional_notes as string);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadBriefing();
  }, [loadBriefing]);

  // Poll while generating
  useEffect(() => {
    if (briefing?.status !== "generating") return;
    const interval = setInterval(async () => {
      const data = await getBriefing(id);
      if (data && data.status !== "generating") {
        setBriefing(data);
        clearInterval(interval);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [briefing?.status, id]);

  function handleSaveAndGenerate() {
    startTransition(async () => {
      try {
        const manualData: Record<string, unknown> = {
          monthly_revenue: monthlyRevenue ? parseFloat(monthlyRevenue) : null,
          monthly_payroll: monthlyPayroll ? parseFloat(monthlyPayroll) : null,
          employee_count: employeeCount ? parseInt(employeeCount) : null,
          monthly_invoices: monthlyInvoices ? parseInt(monthlyInvoices) : null,
          current_accountant: currentAccountant || null,
          switching_reason: switchingReason || null,
          main_pain: mainPain,
          additional_notes: additionalNotes || null,
        };
        await updateManualInputs(id, manualData);
        await generateBriefing(id);
        await loadBriefing();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Erro ao gerar briefing.");
        await loadBriefing();
      }
    });
  }

  function handleRetry() {
    startTransition(async () => {
      try {
        await generateBriefing(id);
        await loadBriefing();
      } catch {
        await loadBriefing();
      }
    });
  }

  function togglePain(pain: string) {
    setMainPain((prev) =>
      prev.includes(pain) ? prev.filter((p) => p !== pain) : [...prev, pain]
    );
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!briefing) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Diagnóstico não encontrado.</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/diagnostics">Voltar</Link>
        </Button>
      </div>
    );
  }

  const sc = statusConfig[briefing.status] ?? statusConfig.draft;
  const sections = (briefing.content_sections || {}) as Record<string, string>;

  return (
    <div className="mx-auto max-w-5xl p-6">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/diagnostics">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Link>
        </Button>
      </div>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {briefing.name}
            </h1>
            <Badge variant={sc.variant}>
              {briefing.status === "generating" && (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              )}
              {sc.label}
            </Badge>
          </div>
          <div className="mt-1 flex flex-wrap gap-4 text-sm text-muted-foreground">
            {briefing.cnpj && (
              <span className="font-mono">{formatCnpj(briefing.cnpj)}</span>
            )}
            {briefing.contact && (
              <span>
                Contato: {briefing.contact.name}
                {briefing.contact.company_name &&
                  ` — ${briefing.contact.company_name}`}
              </span>
            )}
          </div>
        </div>
        {briefing.status === "completed" && sections.cheat_sheet && (
          <Button variant="outline" asChild>
            <Link href={`/diagnostics/${id}/cheatsheet`}>
              <Smartphone className="mr-2 h-4 w-4" />
              Cola Rápida
            </Link>
          </Button>
        )}
      </div>

      {/* DRAFT: Manual inputs form */}
      {briefing.status === "draft" && (
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">
            Dados Complementares do Prospect
          </h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Preencha o que souber. Quanto mais dados, melhor o briefing gerado.
          </p>

          {/* Enrichment preview */}
          {briefing.enrichment_data &&
            Object.keys(briefing.enrichment_data).length > 0 &&
            (() => {
              const ed = briefing.enrichment_data as Record<string, string>;
              return (
                <div className="mb-6 rounded-md bg-muted p-4">
                  <h3 className="mb-2 text-sm font-semibold">
                    Dados do CNPJ (automáticos)
                  </h3>
                  <div className="grid gap-1 text-sm">
                    {ed.company_name && (
                      <p>
                        <span className="text-muted-foreground">Razão social:</span>{" "}
                        {ed.company_name}
                      </p>
                    )}
                    {ed.trade_name && (
                      <p>
                        <span className="text-muted-foreground">Fantasia:</span>{" "}
                        {ed.trade_name}
                      </p>
                    )}
                    {ed.cnae_description && (
                      <p>
                        <span className="text-muted-foreground">CNAE:</span>{" "}
                        {ed.cnae_description}
                      </p>
                    )}
                    {ed.tax_regime && (
                      <p>
                        <span className="text-muted-foreground">Regime:</span>{" "}
                        {ed.tax_regime}
                      </p>
                    )}
                  </div>
                </div>
              );
            })()}

          <div className="grid gap-6 md:grid-cols-2">
            {/* Left column */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="monthly_revenue">
                  Faturamento Mensal (R$)
                </Label>
                <Input
                  id="monthly_revenue"
                  type="number"
                  placeholder="50000"
                  value={monthlyRevenue}
                  onChange={(e) => setMonthlyRevenue(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthly_payroll">
                  Folha de Pagamento Mensal (R$)
                </Label>
                <Input
                  id="monthly_payroll"
                  type="number"
                  placeholder="15000"
                  value={monthlyPayroll}
                  onChange={(e) => setMonthlyPayroll(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employee_count">
                  Quantidade de Funcionários
                </Label>
                <Input
                  id="employee_count"
                  type="number"
                  placeholder="10"
                  value={employeeCount}
                  onChange={(e) => setEmployeeCount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthly_invoices">
                  Notas Fiscais Emitidas/Mês
                </Label>
                <Input
                  id="monthly_invoices"
                  type="number"
                  placeholder="30"
                  value={monthlyInvoices}
                  onChange={(e) => setMonthlyInvoices(e.target.value)}
                />
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current_accountant">Contador Atual</Label>
                <Input
                  id="current_accountant"
                  placeholder="Nome do escritório"
                  value={currentAccountant}
                  onChange={(e) => setCurrentAccountant(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="switching_reason">Motivo da Troca</Label>
                <Input
                  id="switching_reason"
                  placeholder="Por que está buscando outro contador?"
                  value={switchingReason}
                  onChange={(e) => setSwitchingReason(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Principais Dores</Label>
                <div className="grid gap-2">
                  {PAIN_OPTIONS.map((pain) => (
                    <label
                      key={pain}
                      className="flex cursor-pointer items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={mainPain.includes(pain)}
                        onChange={() => togglePain(pain)}
                        className="rounded"
                      />
                      {pain}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <Label htmlFor="additional_notes">
              Observações Adicionais
            </Label>
            <Textarea
              id="additional_notes"
              placeholder="Algo mais que saiba sobre o prospect..."
              rows={3}
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
            />
          </div>

          <Separator className="my-6" />

          <div className="flex justify-end">
            <Button onClick={handleSaveAndGenerate} disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Salvar e Gerar Briefing
            </Button>
          </div>
        </Card>
      )}

      {/* GENERATING: Loading state */}
      {briefing.status === "generating" && (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary" />
          <h3 className="text-lg font-semibold">
            Gerando seu briefing...
          </h3>
          <p className="text-sm text-muted-foreground">
            Isso pode levar alguns segundos. A página atualiza automaticamente.
          </p>
        </Card>
      )}

      {/* ERROR: Error state */}
      {briefing.status === "error" && (
        <Card className="p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div className="flex-1">
              <h3 className="font-semibold text-destructive">
                Erro ao gerar briefing
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {briefing.error_message || "Erro desconhecido."}
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={handleRetry}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Tentar Novamente
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* COMPLETED: Section viewer */}
      {briefing.status === "completed" && Object.keys(sections).length > 0 && (
        <Tabs defaultValue={SECTION_ORDER[0]}>
          <TabsList className="mb-4 flex flex-wrap">
            {SECTION_ORDER.filter((key) => sections[key]).map((key) => (
              <TabsTrigger key={key} value={key} className="text-xs">
                {SECTION_TITLES[key]?.split(" ").slice(0, 2).join(" ") || key}
              </TabsTrigger>
            ))}
          </TabsList>

          {SECTION_ORDER.filter((key) => sections[key]).map((key) => (
            <TabsContent key={key} value={key}>
              <Card className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">
                    {SECTION_TITLES[key] || key}
                  </h2>
                  <CopyButton text={sections[key]} />
                </div>
                <MarkdownContent text={sections[key]} />
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
