"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Building2,
  Loader2,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  type CompanyListItem,
  type Company,
  getCompany,
  createCompany,
  updateCompany,
  deleteCompany,
  enrichCompany,
} from "./actions";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatCnpj(cnpj: string | null): string {
  if (!cnpj) return "";
  const digits = cnpj.replace(/\D/g, "");
  if (digits.length !== 14) return cnpj;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

const TAX_LABELS: Record<string, string> = {
  simples: "Simples",
  presumido: "Presumido",
  real: "Real",
  mei: "MEI",
  unknown: "N/I",
};

const TAX_REGIMES = [
  { value: "simples", label: "Simples Nacional" },
  { value: "presumido", label: "Lucro Presumido" },
  { value: "real", label: "Lucro Real" },
  { value: "mei", label: "MEI" },
];

const SIZE_OPTIONS = [
  { value: "mei", label: "MEI" },
  { value: "me", label: "ME" },
  { value: "epp", label: "EPP" },
  { value: "medium", label: "Media" },
  { value: "large", label: "Grande" },
];

const STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
interface CompaniesClientProps {
  companies: CompanyListItem[];
  search?: string;
}

export function CompaniesClient({ companies, search }: CompaniesClientProps) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [loadingCompany, setLoadingCompany] = useState(false);

  function openCreate() {
    setSelectedCompany(null);
    setSheetOpen(true);
  }

  async function openEdit(id: string) {
    setLoadingCompany(true);
    setSheetOpen(true);
    try {
      const company = await getCompany(id);
      setSelectedCompany(company);
    } catch {
      setSheetOpen(false);
    } finally {
      setLoadingCompany(false);
    }
  }

  function handleSearch(value: string) {
    const params = new URLSearchParams();
    if (value) params.set("search", value);
    router.push(`/companies?${params.toString()}`);
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Empresas</h1>
          <p className="mt-1 text-muted-foreground">
            Gerencie as empresas do seu escritorio.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Nova empresa
        </Button>
      </div>

      {/* Search */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por razao social, fantasia, CNPJ..."
            className="pl-9"
            defaultValue={search ?? ""}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch((e.target as HTMLInputElement).value);
              }
            }}
          />
        </div>
      </div>

      {/* Table or empty */}
      {companies.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border p-12 text-center">
          <Building2 className="size-10 text-muted-foreground" />
          <p className="text-muted-foreground">Nenhuma empresa encontrada.</p>
          <Button variant="outline" size="sm" onClick={openCreate}>
            <Plus className="size-4" />
            Criar primeira empresa
          </Button>
        </div>
      ) : (
        <div className="mt-4 rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Razao Social</TableHead>
                <TableHead className="hidden md:table-cell">
                  Nome Fantasia
                </TableHead>
                <TableHead className="hidden lg:table-cell">CNPJ</TableHead>
                <TableHead className="hidden md:table-cell">Regime</TableHead>
                <TableHead className="hidden lg:table-cell">Cidade/UF</TableHead>
                <TableHead className="hidden xl:table-cell">Telefone</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map((c) => (
                <TableRow
                  key={c.id}
                  className="cursor-pointer"
                  onClick={() => openEdit(c.id)}
                >
                  <TableCell className="font-medium">
                    {c.company_name}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {c.trade_name ?? ""}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell font-mono text-xs">
                    {formatCnpj(c.cnpj)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {c.tax_regime ? (
                      <Badge variant="secondary">
                        {TAX_LABELS[c.tax_regime] ?? c.tax_regime}
                      </Badge>
                    ) : (
                      ""
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {[c.address_city, c.address_state]
                      .filter(Boolean)
                      .join("/") || ""}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    {c.phone ?? ""}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Sheet for create / edit */}
      <CompanySheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setSelectedCompany(null);
        }}
        company={selectedCompany}
        loading={loadingCompany}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Company Sheet (create / edit)
// ---------------------------------------------------------------------------
function CompanySheet({
  open,
  onOpenChange,
  company,
  loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: Company | null;
  loading: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isEnriching, startEnrich] = useTransition();
  const [isDeleting, startDelete] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!company;

  useEffect(() => {
    setError(null);
  }, [company]);

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(null);
      const formData = new FormData(e.currentTarget);

      startTransition(async () => {
        try {
          if (isEditing && company) {
            await updateCompany(company.id, formData);
          } else {
            await createCompany(formData);
          }
          onOpenChange(false);
          router.refresh();
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Erro ao salvar empresa."
          );
        }
      });
    },
    [isEditing, company, onOpenChange, router]
  );

  const handleDelete = useCallback(() => {
    if (!company) return;
    startDelete(async () => {
      try {
        await deleteCompany(company.id);
        onOpenChange(false);
        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao excluir empresa."
        );
      }
    });
  }, [company, onOpenChange, router]);

  const handleEnrich = useCallback(() => {
    if (!company) return;
    startEnrich(async () => {
      try {
        await enrichCompany(company.id);
        router.refresh();
        onOpenChange(false);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao enriquecer empresa."
        );
      }
    });
  }, [company, router, onOpenChange]);

  const defaultVal = (field: keyof Company) =>
    company ? (company[field] as string) ?? "" : "";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {isEditing ? "Editar empresa" : "Nova empresa"}
          </SheetTitle>
          <SheetDescription>
            {isEditing
              ? "Altere os dados da empresa abaixo."
              : "Preencha os dados para criar uma nova empresa."}
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-6 px-4 pb-4"
          >
            {error && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Dados principais */}
            <fieldset className="space-y-4">
              <legend className="text-sm font-medium text-muted-foreground mb-2">
                Dados principais
              </legend>

              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <div className="flex gap-2">
                  <Input
                    id="cnpj"
                    name="cnpj"
                    placeholder="00.000.000/0000-00"
                    defaultValue={defaultVal("cnpj")}
                    className="flex-1"
                  />
                  {isEditing && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleEnrich}
                      disabled={isEnriching}
                    >
                      {isEnriching ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Sparkles className="size-4" />
                      )}
                      Enriquecer
                    </Button>
                  )}
                </div>
                {company?.enriched_at && (
                  <p className="text-xs text-muted-foreground">
                    Enriquecido em{" "}
                    {new Date(company.enriched_at).toLocaleDateString("pt-BR")}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_name">Razao Social *</Label>
                <Input
                  id="company_name"
                  name="company_name"
                  required
                  defaultValue={defaultVal("company_name")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="trade_name">Nome Fantasia</Label>
                <Input
                  id="trade_name"
                  name="trade_name"
                  defaultValue={defaultVal("trade_name")}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    defaultValue={defaultVal("phone")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={defaultVal("email")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  name="website"
                  defaultValue={defaultVal("website")}
                />
              </div>
            </fieldset>

            {/* Endereco */}
            <fieldset className="space-y-4">
              <legend className="text-sm font-medium text-muted-foreground mb-2">
                Endereco
              </legend>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="address_street">Rua</Label>
                  <Input
                    id="address_street"
                    name="address_street"
                    defaultValue={defaultVal("address_street")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address_number">Numero</Label>
                  <Input
                    id="address_number"
                    name="address_number"
                    defaultValue={defaultVal("address_number")}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address_complement">Complemento</Label>
                  <Input
                    id="address_complement"
                    name="address_complement"
                    defaultValue={defaultVal("address_complement")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address_neighborhood">Bairro</Label>
                  <Input
                    id="address_neighborhood"
                    name="address_neighborhood"
                    defaultValue={defaultVal("address_neighborhood")}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address_city">Cidade</Label>
                  <Input
                    id="address_city"
                    name="address_city"
                    defaultValue={defaultVal("address_city")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address_state">UF</Label>
                  <Select
                    name="address_state"
                    defaultValue={company?.address_state ?? ""}
                  >
                    <SelectTrigger id="address_state" className="w-full">
                      <SelectValue placeholder="UF" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">--</SelectItem>
                      {STATES.map((uf) => (
                        <SelectItem key={uf} value={uf}>
                          {uf}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address_zip">CEP</Label>
                  <Input
                    id="address_zip"
                    name="address_zip"
                    defaultValue={defaultVal("address_zip")}
                  />
                </div>
              </div>
            </fieldset>

            {/* Dados fiscais / empresa */}
            <fieldset className="space-y-4">
              <legend className="text-sm font-medium text-muted-foreground mb-2">
                Dados fiscais
              </legend>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tax_regime">Regime tributario</Label>
                  <Select
                    name="tax_regime"
                    defaultValue={company?.tax_regime ?? ""}
                  >
                    <SelectTrigger id="tax_regime" className="w-full">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {TAX_REGIMES.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_size">Porte</Label>
                  <Select
                    name="company_size"
                    defaultValue={company?.company_size ?? ""}
                  >
                    <SelectTrigger id="company_size" className="w-full">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {SIZE_OPTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employee_count">Funcionarios</Label>
                  <Input
                    id="employee_count"
                    name="employee_count"
                    type="number"
                    min={0}
                    defaultValue={company?.employee_count ?? ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthly_revenue">Faturamento (R$)</Label>
                  <Input
                    id="monthly_revenue"
                    name="monthly_revenue"
                    type="number"
                    step="0.01"
                    min={0}
                    defaultValue={company?.monthly_revenue ?? ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthly_invoices">NFs/mes</Label>
                  <Input
                    id="monthly_invoices"
                    name="monthly_invoices"
                    type="number"
                    min={0}
                    defaultValue={company?.monthly_invoices ?? ""}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="niche">Nicho/Setor</Label>
                  <Input
                    id="niche"
                    name="niche"
                    defaultValue={defaultVal("niche")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="founding_date">Data de fundacao</Label>
                  <Input
                    id="founding_date"
                    name="founding_date"
                    type="date"
                    defaultValue={company?.founding_date ?? ""}
                  />
                </div>
              </div>
            </fieldset>

            {/* Observacoes */}
            <fieldset className="space-y-4">
              <legend className="text-sm font-medium text-muted-foreground mb-2">
                Observacoes
              </legend>
              <div className="space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  defaultValue={defaultVal("notes")}
                />
              </div>
            </fieldset>

            {/* Actions */}
            <SheetFooter className="flex-row justify-between gap-2 px-0">
              {isEditing && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                  Excluir
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="size-4 animate-spin" />}
                  {isEditing ? "Salvar" : "Criar empresa"}
                </Button>
              </div>
            </SheetFooter>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
