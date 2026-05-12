"use client";

import { useState, useTransition } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MessageSquare, Download, Eye, ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  getCalculatorLeads,
  markLeadViewed,
  exportLeadsCsv,
} from "../actions";
import type { CalculatorLead } from "../actions";

const TYPE_LABELS: Record<string, string> = {
  regime_simulator: "Simulador de Regime",
  clt_cost: "Custo CLT",
  fiscal_health: "Saúde Fiscal",
  opening_cost: "Custo Abertura",
};

const SCORE_COLORS: Record<string, string> = {
  green: "bg-green-100 text-green-800",
  yellow: "bg-yellow-100 text-yellow-800",
  red: "bg-red-100 text-red-800",
};

interface CalculatorLeadsClientProps {
  initialLeads: CalculatorLead[];
}

export function CalculatorLeadsClient({
  initialLeads,
}: CalculatorLeadsClientProps) {
  const [leads, setLeads] = useState(initialLeads);
  const [typeFilter, setTypeFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [selectedLead, setSelectedLead] = useState<CalculatorLead | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleFilter(type: string, period: string) {
    startTransition(async () => {
      const filtered = await getCalculatorLeads(type, period);
      setLeads(filtered);
    });
  }

  function handleTypeChange(value: string) {
    setTypeFilter(value);
    handleFilter(value, periodFilter);
  }

  function handlePeriodChange(value: string) {
    setPeriodFilter(value);
    handleFilter(typeFilter, value);
  }

  function handleViewLead(lead: CalculatorLead) {
    setSelectedLead(lead);
    if (!lead.viewed) {
      startTransition(async () => {
        await markLeadViewed(lead.id);
      });
    }
  }

  function handleExport() {
    startTransition(async () => {
      const csv = await exportLeadsCsv();
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leads-calculadoras-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  function formatWhatsAppUrl(phone: string) {
    const digits = phone.replace(/\D/g, "");
    return `https://wa.me/${digits}`;
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href="/calculators">
            <ArrowLeft className="mr-1 h-3 w-3" />
            Voltar
          </Link>
        </Button>

        <Select value={typeFilter} onValueChange={handleTypeChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Todas calculadoras" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas calculadoras</SelectItem>
            <SelectItem value="regime_simulator">Simulador de Regime</SelectItem>
            <SelectItem value="clt_cost">Custo CLT</SelectItem>
            <SelectItem value="fiscal_health">Saúde Fiscal</SelectItem>
            <SelectItem value="opening_cost">Custo Abertura</SelectItem>
          </SelectContent>
        </Select>

        <Select value={periodFilter} onValueChange={handlePeriodChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo período</SelectItem>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="90d">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={isPending || leads.length === 0}
        >
          <Download className="mr-1 h-3 w-3" />
          Exportar CSV
        </Button>

        <span className="ml-auto text-sm text-muted-foreground">
          {leads.length} lead{leads.length !== 1 ? "s" : ""}
        </span>
      </div>

      {leads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">Nenhum lead encontrado.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Ative suas calculadoras para começar a captar leads.
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Calculadora</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow
                  key={lead.id}
                  className={!lead.viewed ? "bg-primary/5" : ""}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {!lead.viewed && (
                          <span className="mr-1 inline-block h-2 w-2 rounded-full bg-primary" />
                        )}
                        {lead.name}
                      </p>
                      {lead.company_name && (
                        <p className="text-xs text-muted-foreground">
                          {lead.company_name}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{lead.phone}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {TYPE_LABELS[lead.calculator_type] ||
                        lead.calculator_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {lead.score_level ? (
                      <Badge
                        className={SCORE_COLORS[lead.score_level] || ""}
                        variant="secondary"
                      >
                        {lead.score ?? "-"}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(lead.created_at).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleViewLead(lead)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" asChild>
                        <a
                          href={formatWhatsAppUrl(lead.phone)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <MessageSquare className="h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Lead Detail Dialog */}
      <Dialog
        open={!!selectedLead}
        onOpenChange={() => setSelectedLead(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do Lead</DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Nome</p>
                  <p className="font-medium">{selectedLead.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Telefone</p>
                  <p className="font-medium">{selectedLead.phone}</p>
                </div>
                {selectedLead.email && (
                  <div>
                    <p className="text-muted-foreground">E-mail</p>
                    <p className="font-medium">{selectedLead.email}</p>
                  </div>
                )}
                {selectedLead.company_name && (
                  <div>
                    <p className="text-muted-foreground">Empresa</p>
                    <p className="font-medium">{selectedLead.company_name}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Calculadora</p>
                  <p className="font-medium">
                    {TYPE_LABELS[selectedLead.calculator_type] ||
                      selectedLead.calculator_type}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Data</p>
                  <p className="font-medium">
                    {new Date(selectedLead.created_at).toLocaleString("pt-BR")}
                  </p>
                </div>
                {selectedLead.score !== null && (
                  <div>
                    <p className="text-muted-foreground">Score</p>
                    <Badge
                      className={
                        SCORE_COLORS[selectedLead.score_level || ""] || ""
                      }
                      variant="secondary"
                    >
                      {selectedLead.score} - {selectedLead.score_level}
                    </Badge>
                  </div>
                )}
              </div>

              {selectedLead.inputs &&
                Object.keys(selectedLead.inputs).length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Dados informados
                    </p>
                    <pre className="rounded-md bg-muted p-3 text-xs overflow-auto max-h-40">
                      {JSON.stringify(selectedLead.inputs, null, 2)}
                    </pre>
                  </div>
                )}

              {selectedLead.result &&
                Object.keys(selectedLead.result).length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Resultado
                    </p>
                    <pre className="rounded-md bg-muted p-3 text-xs overflow-auto max-h-40">
                      {JSON.stringify(selectedLead.result, null, 2)}
                    </pre>
                  </div>
                )}

              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" asChild>
                  <a
                    href={formatWhatsAppUrl(selectedLead.phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageSquare className="mr-1 h-3 w-3" />
                    WhatsApp
                  </a>
                </Button>
                {selectedLead.contact_id && (
                  <Button size="sm" asChild>
                    <Link href={`/contacts/${selectedLead.contact_id}`}>
                      Ver contato
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
