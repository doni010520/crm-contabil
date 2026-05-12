"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Loader2,
  Search,
  CheckCircle2,
  X,
} from "lucide-react";
import { createBriefing, searchContacts } from "../actions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ContactOption {
  id: string;
  contact_name: string;
  company_name: string | null;
  email: string | null;
}

interface EnrichmentResult {
  enrichment: Record<string, unknown>;
  cnpj: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function NewDiagnosticPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Form state
  const [name, setName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [enrichment, setEnrichment] = useState<EnrichmentResult | null>(null);
  const [enrichError, setEnrichError] = useState("");
  const [isEnriching, setIsEnriching] = useState(false);

  // Contact search
  const [contactSearch, setContactSearch] = useState("");
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [selectedContact, setSelectedContact] = useState<ContactOption | null>(
    null
  );
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // CNPJ enrichment
  async function handleEnrich() {
    const clean = cnpj.replace(/\D/g, "");
    if (clean.length !== 14) {
      setEnrichError("CNPJ deve ter 14 dígitos.");
      return;
    }
    setEnrichError("");
    setIsEnriching(true);
    try {
      const res = await fetch("/api/diagnostics/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cnpj: clean }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEnrichError(data.error || "Erro ao consultar CNPJ.");
        return;
      }
      setEnrichment(data);
      // Auto-fill name if empty
      if (!name && data.enrichment?.trade_name) {
        setName(data.enrichment.trade_name as string);
      } else if (!name && data.enrichment?.company_name) {
        setName(data.enrichment.company_name as string);
      }
    } catch {
      setEnrichError("Erro de conexão ao consultar CNPJ.");
    } finally {
      setIsEnriching(false);
    }
  }

  // Contact search
  const handleContactSearch = useCallback(
    async (term: string) => {
      setContactSearch(term);
      if (term.length < 2) {
        setContacts([]);
        setShowContactDropdown(false);
        return;
      }
      setIsSearching(true);
      try {
        const results = await searchContacts(term);
        setContacts(results);
        setShowContactDropdown(results.length > 0);
      } catch {
        setContacts([]);
      } finally {
        setIsSearching(false);
      }
    },
    []
  );

  function selectContact(c: ContactOption) {
    setSelectedContact(c);
    setContactSearch("");
    setShowContactDropdown(false);
    // Auto-fill name if empty
    if (!name) {
      setName(c.company_name || c.contact_name);
    }
  }

  // Submit
  function handleSubmit() {
    if (!name.trim()) return;
    startTransition(async () => {
      try {
        const result = await createBriefing({
          name: name.trim(),
          cnpj: enrichment?.cnpj || cnpj.replace(/\D/g, "") || undefined,
          contact_id: selectedContact?.id || undefined,
        });
        // If we have enrichment data, store it via updateEnrichment
        if (enrichment && result?.id) {
          const { updateEnrichment } = await import("../actions");
          await updateEnrichment(
            result.id,
            enrichment.enrichment,
            enrichment.cnpj
          );
        }
        router.push(`/diagnostics/${result.id}`);
      } catch (err) {
        alert(
          err instanceof Error ? err.message : "Erro ao criar diagnóstico."
        );
      }
    });
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/diagnostics">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Link>
        </Button>
      </div>

      <h1 className="mb-6 text-2xl font-bold tracking-tight">
        Novo Diagnóstico
      </h1>

      <Card className="space-y-6 p-6">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Nome do Prospect / Empresa *</Label>
          <Input
            id="name"
            placeholder="Ex: Empresa XYZ Ltda"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* CNPJ */}
        <div className="space-y-2">
          <Label htmlFor="cnpj">CNPJ (opcional)</Label>
          <div className="flex gap-2">
            <Input
              id="cnpj"
              placeholder="00.000.000/0000-00"
              value={cnpj}
              onChange={(e) => {
                setCnpj(e.target.value);
                setEnrichment(null);
                setEnrichError("");
              }}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleEnrich}
              disabled={isEnriching || !cnpj.trim()}
            >
              {isEnriching ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Buscar
            </Button>
          </div>
          {enrichError && (
            <p className="text-sm text-destructive">{enrichError}</p>
          )}
          {enrichment && (
            <div className="flex items-center gap-2 rounded-md bg-green-50 p-3 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>
                <strong>{enrichment.enrichment.trade_name as string || enrichment.enrichment.company_name as string}</strong>
                {" — "}
                {enrichment.enrichment.city as string}/{enrichment.enrichment.state as string}
                {" — "}
                {enrichment.enrichment.cnae_description as string}
              </span>
            </div>
          )}
        </div>

        <Separator />

        {/* Contact search */}
        <div className="space-y-2">
          <Label>Vincular a Contato (opcional)</Label>
          {selectedContact ? (
            <div className="flex items-center gap-2 rounded-md border p-3">
              <div className="flex-1">
                <p className="font-medium">{selectedContact.contact_name}</p>
                {selectedContact.company_name && (
                  <p className="text-sm text-muted-foreground">
                    {selectedContact.company_name}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedContact(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="relative">
              <Input
                placeholder="Buscar contato por nome ou empresa..."
                value={contactSearch}
                onChange={(e) => handleContactSearch(e.target.value)}
                onFocus={() => {
                  if (contacts.length > 0) setShowContactDropdown(true);
                }}
                onBlur={() => {
                  // Delay to allow click
                  setTimeout(() => setShowContactDropdown(false), 200);
                }}
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
              )}
              {showContactDropdown && contacts.length > 0 && (
                <div className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border bg-popover shadow-md">
                  {contacts.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="flex w-full flex-col px-3 py-2 text-left hover:bg-accent"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => selectContact(c)}
                    >
                      <span className="font-medium">{c.contact_name}</span>
                      {c.company_name && (
                        <span className="text-xs text-muted-foreground">
                          {c.company_name}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <Separator />

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" asChild>
            <Link href="/diagnostics">Cancelar</Link>
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar Diagnóstico
          </Button>
        </div>
      </Card>
    </div>
  );
}
