"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Copy,
  Check,
  ExternalLink,
  Users,
  Settings2,
  BarChart3,
  DollarSign,
  ClipboardCheck,
  Building2,
} from "lucide-react";
import { toggleCalculator, updateCalculatorCta } from "./actions";
import type { TenantCalculator } from "./actions";

const CALCULATOR_META: Record<
  string,
  { title: string; description: string; icon: React.ElementType }
> = {
  regime_simulator: {
    title: "Simulador de Regime Tributário",
    description:
      "Compara Simples Nacional, Lucro Presumido e Lucro Real para o cliente.",
    icon: BarChart3,
  },
  clt_cost: {
    title: "Custo de Funcionário CLT",
    description:
      "Calcula o custo total de um funcionário incluindo encargos e benefícios.",
    icon: DollarSign,
  },
  fiscal_health: {
    title: "Quiz Saúde Fiscal",
    description:
      "Quiz com 10 perguntas que avalia a saúde fiscal da empresa do lead.",
    icon: ClipboardCheck,
  },
  opening_cost: {
    title: "Custo de Abertura de Empresa",
    description:
      "Estima os custos para abrir uma empresa por estado e tipo societário.",
    icon: Building2,
  },
};

interface CalculatorCardsProps {
  calculators: TenantCalculator[];
  tenantSlug: string;
}

export function CalculatorCards({
  calculators,
  tenantSlug,
}: CalculatorCardsProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [ctaCalc, setCtaCalc] = useState<TenantCalculator | null>(null);
  const [isPending, startTransition] = useTransition();

  function getPublicUrl(slug: string) {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/calc/${tenantSlug}/${slug}`;
    }
    return `/calc/${tenantSlug}/${slug}`;
  }

  function handleCopy(calc: TenantCalculator) {
    const url = getPublicUrl(calc.slug);
    navigator.clipboard.writeText(url);
    setCopiedId(calc.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleToggle(calc: TenantCalculator) {
    startTransition(async () => {
      await toggleCalculator(calc.id, !calc.is_active);
    });
  }

  function handleCtaSave(formData: FormData) {
    if (!ctaCalc) return;
    startTransition(async () => {
      await updateCalculatorCta(ctaCalc.id, formData);
      setCtaCalc(null);
    });
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {calculators.map((calc) => {
          const meta = CALCULATOR_META[calc.type];
          if (!meta) return null;
          const Icon = meta.icon;

          return (
            <Card key={calc.id} className="relative">
              <CardHeader className="flex flex-row items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{meta.title}</CardTitle>
                    <Badge variant={calc.is_active ? "default" : "secondary"}>
                      {calc.is_active ? "Ativa" : "Inativa"}
                    </Badge>
                  </div>
                  <CardDescription>{meta.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{calc.leads_count} leads capturados</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={calc.is_active ? "outline" : "default"}
                    onClick={() => handleToggle(calc)}
                    disabled={isPending}
                  >
                    {calc.is_active ? "Desativar" : "Ativar"}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(calc)}
                  >
                    {copiedId === calc.id ? (
                      <>
                        <Check className="mr-1 h-3 w-3" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1 h-3 w-3" />
                        Copiar link
                      </>
                    )}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCtaCalc(calc)}
                  >
                    <Settings2 className="mr-1 h-3 w-3" />
                    CTA
                  </Button>

                  {calc.is_active && (
                    <Button size="sm" variant="ghost" asChild>
                      <a
                        href={getPublicUrl(calc.slug)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="mr-1 h-3 w-3" />
                        Abrir
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-center pt-2">
        <Button variant="outline" asChild>
          <Link href="/calculators/leads">
            <Users className="mr-2 h-4 w-4" />
            Ver todos os leads das calculadoras
          </Link>
        </Button>
      </div>

      {/* CTA Config Dialog */}
      <Dialog open={!!ctaCalc} onOpenChange={() => setCtaCalc(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurar CTA</DialogTitle>
          </DialogHeader>
          <form action={handleCtaSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cta_text">Texto do botão CTA</Label>
              <Input
                id="cta_text"
                name="cta_text"
                defaultValue={ctaCalc?.cta_text || ""}
                placeholder="Ex: Fale com um contador"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cta_action">Ação do CTA</Label>
              <Select
                name="cta_action"
                defaultValue={ctaCalc?.cta_action || "whatsapp"}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                  <SelectItem value="link">Link externo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cta_url">
                URL / Número WhatsApp / E-mail
              </Label>
              <Input
                id="cta_url"
                name="cta_url"
                defaultValue={ctaCalc?.cta_url || ""}
                placeholder="Ex: 5511999999999"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCtaCalc(null)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
