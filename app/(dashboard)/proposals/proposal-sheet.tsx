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
  createProposal,
  updateProposal,
  deleteProposal,
  searchContacts,
} from "./actions";
import type { Proposal, ProposalItem } from "./actions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ContactOption {
  id: string;
  contact_name: string;
  company_name: string | null;
  email: string | null;
}

interface ProposalSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proposal?: Proposal | null;
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
// Empty item
// ---------------------------------------------------------------------------
function emptyItem(): ProposalItem {
  return { description: "", quantity: 1, unit_price: 0, total: 0 };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function ProposalSheet({
  open,
  onOpenChange,
  proposal,
}: ProposalSheetProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDelete] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!proposal;

  // --- Contact selector state ---
  const [contactSearch, setContactSearch] = useState("");
  const [contactResults, setContactResults] = useState<ContactOption[]>([]);
  const [selectedContact, setSelectedContact] = useState<ContactOption | null>(
    null
  );
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // --- Line items state ---
  const [items, setItems] = useState<ProposalItem[]>([emptyItem()]);

  // --- Sync state when proposal changes ---
  useEffect(() => {
    setError(null);
    if (proposal) {
      setItems(
        proposal.items && proposal.items.length > 0
          ? proposal.items
          : [emptyItem()]
      );
      if (proposal.contacts) {
        setSelectedContact({
          id: proposal.contacts.id,
          contact_name: proposal.contacts.contact_name,
          company_name: proposal.contacts.company_name ?? null,
          email: proposal.contacts.email ?? null,
        });
        setContactSearch(proposal.contacts.contact_name);
      }
    } else {
      setItems([emptyItem()]);
      setSelectedContact(null);
      setContactSearch("");
    }
  }, [proposal]);

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

  // --- Item handlers ---
  function updateItem(index: number, field: keyof ProposalItem, value: string) {
    setItems((prev) => {
      const next = [...prev];
      const item = { ...next[index] };

      if (field === "description") {
        item.description = value;
      } else if (field === "quantity") {
        item.quantity = Math.max(0, Number(value) || 0);
        item.total = item.quantity * item.unit_price;
      } else if (field === "unit_price") {
        item.unit_price = Math.max(0, Number(value) || 0);
        item.total = item.quantity * item.unit_price;
      }

      next[index] = item;
      return next;
    });
  }

  function addItem() {
    setItems((prev) => [...prev, emptyItem()]);
  }

  function removeItem(index: number) {
    setItems((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }

  const grandTotal = items.reduce((sum, item) => sum + item.total, 0);

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
      formData.set("items", JSON.stringify(items));

      startTransition(async () => {
        try {
          if (isEditing && proposal) {
            await updateProposal(proposal.id, formData);
          } else {
            await createProposal(formData);
          }
          onOpenChange(false);
          router.refresh();
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Erro ao salvar proposta."
          );
        }
      });
    },
    [isEditing, proposal, selectedContact, items, onOpenChange, router]
  );

  // --- Delete ---
  const handleDelete = useCallback(() => {
    if (!proposal) return;
    startDelete(async () => {
      try {
        await deleteProposal(proposal.id);
        onOpenChange(false);
        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao excluir proposta."
        );
      }
    });
  }, [proposal, onOpenChange, router]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle>
            {isEditing ? "Editar proposta" : "Nova proposta"}
          </SheetTitle>
          <SheetDescription>
            {isEditing
              ? "Altere os dados da proposta abaixo."
              : "Preencha os dados para criar uma nova proposta."}
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
                    // Delay to allow click on dropdown item
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

          {/* ---- Dados da proposta ---- */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-medium text-muted-foreground mb-2">
              Dados da proposta
            </legend>
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                name="title"
                required
                defaultValue={proposal?.title ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valid_until">Válida até</Label>
              <Input
                id="valid_until"
                name="valid_until"
                type="date"
                defaultValue={proposal?.valid_until ?? ""}
              />
            </div>
          </fieldset>

          {/* ---- Itens ---- */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-medium text-muted-foreground mb-2">
              Itens da proposta
            </legend>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="rounded-md border p-3 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      Item {index + 1}
                    </span>
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Input
                      value={item.description}
                      onChange={(e) =>
                        updateItem(index, "description", e.target.value)
                      }
                      placeholder="Descrição do serviço"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label>Quantidade</Label>
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(index, "quantity", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Valor unitário</Label>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={item.unit_price}
                        onChange={(e) =>
                          updateItem(index, "unit_price", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Subtotal</Label>
                      <Input
                        readOnly
                        value={formatBRL(item.total)}
                        className="bg-muted"
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
              onClick={addItem}
            >
              <Plus className="size-4" />
              Adicionar item
            </Button>

            <div className="flex justify-end pt-2 border-t">
              <div className="text-right">
                <span className="text-sm text-muted-foreground">Total: </span>
                <span className="text-lg font-semibold">
                  {formatBRL(grandTotal)}
                </span>
              </div>
            </div>
          </fieldset>

          {/* ---- Observações ---- */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-medium text-muted-foreground mb-2">
              Observações
            </legend>
            <div className="space-y-2">
              <Label htmlFor="notes">Notas internas</Label>
              <Textarea
                id="notes"
                name="notes"
                rows={3}
                defaultValue={proposal?.notes ?? ""}
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
                {isEditing ? "Salvar" : "Criar proposta"}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
