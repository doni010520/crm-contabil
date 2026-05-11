"use client";

import { useTransition, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Trash2 } from "lucide-react";
import {
  createContact,
  updateContact,
  deleteContact,
  enrichContact,
} from "./actions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface Contact {
  id: string;
  type: string;
  person_type: string;
  company_name: string | null;
  trade_name: string | null;
  contact_name: string;
  email: string | null;
  phone: string | null;
  cnpj: string | null;
  cpf: string | null;
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  tax_regime: string | null;
  employee_count: number;
  monthly_revenue: number | null;
  current_accountant: string | null;
  source: string | null;
  assigned_to: string | null;
  tags: string[];
  notes: string | null;
  score: number;
  enriched_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ContactSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: Contact | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const CONTACT_TYPES = [
  { value: "lead", label: "Lead" },
  { value: "client", label: "Cliente" },
  { value: "former_client", label: "Ex-cliente" },
  { value: "partner", label: "Parceiro" },
];

const TAX_REGIMES = [
  { value: "simples", label: "Simples Nacional" },
  { value: "presumido", label: "Lucro Presumido" },
  { value: "real", label: "Lucro Real" },
  { value: "mei", label: "MEI" },
  { value: "isento", label: "Isento" },
];

const LEAD_SOURCES = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "website", label: "Website" },
  { value: "referral", label: "Indicação" },
  { value: "google", label: "Google" },
  { value: "social", label: "Redes Sociais" },
  { value: "event", label: "Evento" },
  { value: "outbound", label: "Outbound" },
  { value: "other", label: "Outro" },
];

const STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function ContactSheet({ open, onOpenChange, contact }: ContactSheetProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isEnriching, startEnrich] = useTransition();
  const [isDeleting, startDelete] = useTransition();
  const [personType, setPersonType] = useState<string>(
    contact?.person_type ?? "pj"
  );
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!contact;

  // Sync person_type when contact changes
  useEffect(() => {
    setPersonType(contact?.person_type ?? "pj");
    setError(null);
  }, [contact]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(null);
      const formData = new FormData(e.currentTarget);

      startTransition(async () => {
        try {
          if (isEditing && contact) {
            await updateContact(contact.id, formData);
          } else {
            await createContact(formData);
          }
          onOpenChange(false);
          router.refresh();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Erro ao salvar contato.");
        }
      });
    },
    [isEditing, contact, onOpenChange, router]
  );

  const handleDelete = useCallback(() => {
    if (!contact) return;
    startDelete(async () => {
      try {
        await deleteContact(contact.id);
        onOpenChange(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao excluir contato.");
      }
    });
  }, [contact, onOpenChange, router]);

  const handleEnrich = useCallback(() => {
    if (!contact) return;
    startEnrich(async () => {
      try {
        await enrichContact(contact.id);
        router.refresh();
        // Close and reopen to see updated data
        onOpenChange(false);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao enriquecer contato."
        );
      }
    });
  }, [contact, router, onOpenChange]);

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------
  const defaultVal = (field: keyof Contact) =>
    contact ? (contact[field] as string) ?? "" : "";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle>
            {isEditing ? "Editar contato" : "Novo contato"}
          </SheetTitle>
          <SheetDescription>
            {isEditing
              ? "Altere os dados do contato abaixo."
              : "Preencha os dados para criar um novo contato."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6 px-4 pb-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* ---- Tipo & Pessoa ---- */}
          <fieldset className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select name="type" defaultValue={contact?.type ?? "lead"}>
                <SelectTrigger id="type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTACT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="person_type">Pessoa</Label>
              <Select
                name="person_type"
                defaultValue={personType}
                onValueChange={setPersonType}
              >
                <SelectTrigger id="person_type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pj">Pessoa Jurídica</SelectItem>
                  <SelectItem value="pf">Pessoa Física</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </fieldset>

          {/* ---- Dados principais ---- */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-medium text-muted-foreground mb-2">
              Dados principais
            </legend>

            <div className="space-y-2">
              <Label htmlFor="contact_name">Nome do contato *</Label>
              <Input
                id="contact_name"
                name="contact_name"
                required
                defaultValue={defaultVal("contact_name")}
              />
            </div>

            {personType === "pj" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="company_name">Razão Social</Label>
                  <Input
                    id="company_name"
                    name="company_name"
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
                  {contact?.enriched_at && (
                    <p className="text-xs text-muted-foreground">
                      Enriquecido em{" "}
                      {new Date(contact.enriched_at).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                </div>
              </>
            )}

            {personType === "pf" && (
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  name="cpf"
                  placeholder="000.000.000-00"
                  defaultValue={defaultVal("cpf")}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={defaultVal("email")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  name="phone"
                  placeholder="(00) 00000-0000"
                  defaultValue={defaultVal("phone")}
                />
              </div>
            </div>
          </fieldset>

          {/* ---- Endereço ---- */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-medium text-muted-foreground mb-2">
              Endereço
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
                <Label htmlFor="address_number">Número</Label>
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
              <div className="col-span-1 space-y-2">
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
                  defaultValue={contact?.address_state ?? ""}
                >
                  <SelectTrigger id="address_state" className="w-full">
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
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
                  placeholder="00000-000"
                  defaultValue={defaultVal("address_zip")}
                />
              </div>
            </div>
          </fieldset>

          {/* ---- Dados fiscais ---- */}
          {personType === "pj" && (
            <fieldset className="space-y-4">
              <legend className="text-sm font-medium text-muted-foreground mb-2">
                Dados fiscais
              </legend>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tax_regime">Regime tributário</Label>
                  <Select
                    name="tax_regime"
                    defaultValue={contact?.tax_regime ?? ""}
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
                  <Label htmlFor="employee_count">Funcionários</Label>
                  <Input
                    id="employee_count"
                    name="employee_count"
                    type="number"
                    min={0}
                    defaultValue={contact?.employee_count ?? 0}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="monthly_revenue">Faturamento mensal (R$)</Label>
                  <Input
                    id="monthly_revenue"
                    name="monthly_revenue"
                    type="number"
                    step="0.01"
                    min={0}
                    defaultValue={contact?.monthly_revenue ?? ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="current_accountant">Contador atual</Label>
                  <Input
                    id="current_accountant"
                    name="current_accountant"
                    defaultValue={defaultVal("current_accountant")}
                  />
                </div>
              </div>
            </fieldset>
          )}

          {/* ---- Origem & Score ---- */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-medium text-muted-foreground mb-2">
              Origem e classificação
            </legend>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="source">Origem</Label>
                <Select name="source" defaultValue={contact?.source ?? ""}>
                  <SelectTrigger id="source" className="w-full">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_SOURCES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="score">Score</Label>
                <Input
                  id="score"
                  name="score"
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={contact?.score ?? 0}
                />
              </div>
            </div>
          </fieldset>

          {/* ---- Tags & Notas ---- */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-medium text-muted-foreground mb-2">
              Tags e observações
            </legend>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
              <Input
                id="tags"
                name="tags"
                placeholder="ex: vip, indicação, urgente"
                defaultValue={contact?.tags?.join(", ") ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                name="notes"
                rows={3}
                defaultValue={defaultVal("notes")}
              />
            </div>
          </fieldset>

          {/* ---- Actions ---- */}
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
                {isEditing ? "Salvar" : "Criar contato"}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
