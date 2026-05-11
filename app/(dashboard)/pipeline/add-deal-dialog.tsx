"use client";

import { useTransition, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Search } from "lucide-react";
import { createEntry, searchAvailableContacts } from "./actions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ContactOption {
  id: string;
  contact_name: string;
  company_name: string | null;
  email: string | null;
}

interface AddDealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stageId: string;
  stageName: string;
}

// ---------------------------------------------------------------------------
// Add Deal Dialog
// ---------------------------------------------------------------------------
export function AddDealDialog({
  open,
  onOpenChange,
  stageId,
  stageName,
}: AddDealDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [selectedContact, setSelectedContact] = useState<ContactOption | null>(
    null
  );
  const [searching, setSearching] = useState(false);

  // Search contacts when input changes
  const doSearch = useCallback(async (term: string) => {
    setSearching(true);
    try {
      const results = await searchAvailableContacts(term);
      setContacts(results);
    } catch {
      setContacts([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setContacts([]);
      setSelectedContact(null);
      return;
    }
    // Load initial contacts
    doSearch("");
  }, [open, doSearch]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      doSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, open, doSearch]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedContact) return;

    const formData = new FormData(e.currentTarget);
    formData.set("contact_id", selectedContact.id);
    formData.set("stage_id", stageId);

    startTransition(async () => {
      try {
        await createEntry(formData);
        onOpenChange(false);
        router.refresh();
      } catch (err) {
        console.error(err);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo deal</DialogTitle>
          <DialogDescription>
            Adicionar ao estágio: {stageName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Contact selector */}
          <div className="space-y-2">
            <Label htmlFor="contact-search">Contato</Label>
            {selectedContact ? (
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <div>
                  <p className="text-sm font-medium">
                    {selectedContact.contact_name}
                  </p>
                  {selectedContact.company_name && (
                    <p className="text-xs text-muted-foreground">
                      {selectedContact.company_name}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedContact(null)}
                >
                  Trocar
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    id="contact-search"
                    placeholder="Buscar contato por nome, empresa ou email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                    autoFocus
                  />
                </div>
                <div className="max-h-40 overflow-y-auto rounded-md border">
                  {searching ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : contacts.length === 0 ? (
                    <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                      Nenhum contato disponível
                    </p>
                  ) : (
                    contacts.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className="w-full px-3 py-2 text-left transition-colors hover:bg-accent"
                        onClick={() => setSelectedContact(c)}
                      >
                        <p className="text-sm font-medium">{c.contact_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {[c.company_name, c.email]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Expected value */}
          <div className="space-y-2">
            <Label htmlFor="expected_value">Valor esperado (R$)</Label>
            <Input
              id="expected_value"
              name="expected_value"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Informações adicionais sobre este deal..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!selectedContact || isPending}>
              {isPending && <Loader2 className="mr-1 size-4 animate-spin" />}
              Adicionar deal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
