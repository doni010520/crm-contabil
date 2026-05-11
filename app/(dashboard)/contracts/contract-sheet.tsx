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
import { Loader2, Plus, Trash2, Search } from "lucide-react";
import {
  createContract,
  updateContract,
  deleteContract,
  searchContacts,
} from "./actions";
import type { Contract, ServiceItem } from "./actions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ContactOption {
  id: string;
  contact_name: string;
  company_name: string | null;
  email: string | null;
}

interface ContractSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract?: Contract | null;
}

// ---------------------------------------------------------------------------
// Currency formatter
// ---------------------------------------------------------------------------
const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

// ---------------------------------------------------------------------------
// Empty service
// ---------------------------------------------------------------------------
function emptyService(): ServiceItem {
  return { name: "", value: 0 };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function ContractSheet({
  open,
  onOpenChange,
  contract,
}: ContractSheetProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDelete] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!contract;

  // --- Contact selector state ---
  const [contactSearch, setContactSearch] = useState("");
  const [contactResults, setContactResults] = useState<ContactOption[]>([]);
  const [selectedContact, setSelectedContact] = useState<ContactOption | null>(
    null
  );
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // --- Services state ---
  const [services, setServices] = useState<ServiceItem[]>([emptyService()]);

  // --- Auto-renew state ---
  const [autoRenew, setAutoRenew] = useState(true);

  // --- Sync state when contract changes ---
  useEffect(() => {
    setError(null);
    if (contract) {
      setServices(
        contract.services && contract.services.length > 0
          ? contract.services
          : [emptyService()]
      );
      setAutoRenew(contract.auto_renew ?? true);
      if (contract.contacts) {
        setSelectedContact({
          id: contract.contacts.id,
          contact_name: contract.contacts.contact_name,
          company_name: contract.contacts.company_name ?? null,
          email: contract.contacts.email ?? null,
        });
        setContactSearch(contract.contacts.contact_name);
      }
    } else {
      setServices([emptyService()]);
      setAutoRenew(true);
      setSelectedContact(null);
      setContactSearch("");
    }
  }, [contract]);

  // --- Contact search ---
  useEffect(() => {
    if (contactSearch.length < 2) {
      setContactResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchContacts(contactSearch);
        setContactResults(results);
        setShowContactDropdown(true);
      } catch {
        // ignore
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [contactSearch]);

  // --- Service handlers ---
  function updateService(
    index: number,
    field: keyof ServiceItem,
    value: string
  ) {
    setServices((prev) => {
      const next = [...prev];
      const item = { ...next[index] };

      if (field === "name") {
        item.name = value;
      } else if (field === "value") {
        item.value = Math.max(0, Number(value) || 0);
      }

      next[index] = item;
      return next;
    });
  }

  function addService() {
    setServices((prev) => [...prev, emptyService()]);
  }

  function removeService(index: number) {
    setServices((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }

  const monthlyTotal = services.reduce((sum, s) => sum + s.value, 0);

  // --- Submit ---
  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(null);

      if (!selectedContact) {
        setError("Selecione um contato.");
        return;
      }

      const formData = new FormData(e.currentTarget);
      formData.set("contact_id", selectedContact.id);
      formData.set("services", JSON.stringify(services));
      formData.set("auto_renew", String(autoRenew));

      startTransition(async () => {
        try {
          if (isEditing && contract) {
            await updateContract(contract.id, formData);
          } else {
            await createContract(formData);
          }
          onOpenChange(false);
          router.refresh();
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Erro ao salvar contrato."
          );
        }
      });
    },
    [isEditing, contract, selectedContact, services, autoRenew, onOpenChange, router]
  );

  // --- Delete ---
  const handleDelete = useCallback(() => {
    if (!contract) return;
    startDelete(async () => {
      try {
        await deleteContract(contract.id);
        onOpenChange(false);
        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao excluir contrato."
        );
      }
    });
  }, [contract, onOpenChange, router]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle>
            {isEditing ? "Editar contrato" : "Novo contrato"}
          </SheetTitle>
          <SheetDescription>
            {isEditing
              ? "Altere os dados do contrato abaixo."
              : "Preencha os dados para criar um novo contrato."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6 px-4 pb-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* ---- Contato ---- */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-medium text-muted-foreground mb-2">
              Contato
            </legend>
            <div className="relative">
              <Label htmlFor="contact_search">Contato *</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="contact_search"
                  placeholder="Buscar contato por nome ou e-mail..."
                  className="pl-9"
                  value={contactSearch}
                  onChange={(e) => {
                    setContactSearch(e.target.value);
                    setSelectedContact(null);
                  }}
                  onFocus={() => {
                    if (contactResults.length > 0) setShowContactDropdown(true);
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowContactDropdown(false), 200);
                  }}
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {showContactDropdown && contactResults.length > 0 && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 shadow-md max-h-48 overflow-y-auto">
                  {contactResults.map((contact) => (
                    <button
                      key={contact.id}
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setSelectedContact(contact);
                        setContactSearch(contact.contact_name);
                        setShowContactDropdown(false);
                      }}
                    >
                      <span className="font-medium">
                        {contact.contact_name}
                      </span>
                      {contact.company_name && (
                        <span className="text-muted-foreground">
                          {" "}
                          &mdash; {contact.company_name}
                        </span>
                      )}
                      {contact.email && (
                        <span className="block text-xs text-muted-foreground">
                          {contact.email}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
              {selectedContact && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Selecionado: {selectedContact.contact_name}
                  {selectedContact.email ? ` (${selectedContact.email})` : ""}
                </p>
              )}
            </div>
          </fieldset>

          {/* ---- Dados do contrato ---- */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-medium text-muted-foreground mb-2">
              Dados do contrato
            </legend>
            <div className="space-y-2">
              <Label htmlFor="title">Titulo *</Label>
              <Input
                id="title"
                name="title"
                required
                defaultValue={contract?.title ?? ""}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Data de inicio *</Label>
                <Input
                  id="start_date"
                  name="start_date"
                  type="date"
                  required
                  defaultValue={contract?.start_date ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">Data de termino</Label>
                <Input
                  id="end_date"
                  name="end_date"
                  type="date"
                  defaultValue={contract?.end_date ?? ""}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={autoRenew}
                onClick={() => setAutoRenew(!autoRenew)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  autoRenew ? "bg-primary" : "bg-input"
                }`}
              >
                <span
                  className={`pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                    autoRenew ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
              <Label className="cursor-pointer" onClick={() => setAutoRenew(!autoRenew)}>
                Renovacao automatica
              </Label>
            </div>
          </fieldset>

          {/* ---- Servicos ---- */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-medium text-muted-foreground mb-2">
              Servicos
            </legend>

            <div className="space-y-3">
              {services.map((service, index) => (
                <div
                  key={index}
                  className="rounded-md border p-3 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      Servico {index + 1}
                    </span>
                    {services.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeService(index)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Nome do servico</Label>
                      <Input
                        value={service.name}
                        onChange={(e) =>
                          updateService(index, "name", e.target.value)
                        }
                        placeholder="Ex: Contabilidade"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Valor (R$)</Label>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={service.value}
                        onChange={(e) =>
                          updateService(index, "value", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addService}
            >
              <Plus className="size-4" />
              Adicionar servico
            </Button>

            <div className="flex justify-end pt-2 border-t">
              <div className="text-right">
                <span className="text-sm text-muted-foreground">
                  Valor mensal:{" "}
                </span>
                <span className="text-lg font-semibold">
                  {formatBRL(monthlyTotal)}
                </span>
              </div>
            </div>
          </fieldset>

          {/* ---- Observacoes ---- */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-medium text-muted-foreground mb-2">
              Observacoes
            </legend>
            <div className="space-y-2">
              <Label htmlFor="notes">Notas internas</Label>
              <Textarea
                id="notes"
                name="notes"
                rows={3}
                defaultValue={contract?.cancellation_reason ?? ""}
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
                {isEditing ? "Salvar" : "Criar contrato"}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
