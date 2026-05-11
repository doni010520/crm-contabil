"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Pencil } from "lucide-react";
import { ContactSheet, type Contact } from "../contact-sheet";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatCnpj(cnpj: string | null): string {
  if (!cnpj) return "—";
  const digits = cnpj.replace(/\D/g, "");
  if (digits.length !== 14) return cnpj;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

function formatPhone(phone: string | null): string {
  if (!phone) return "—";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

const TYPE_LABELS: Record<string, string> = {
  lead: "Lead",
  client: "Cliente",
  former_client: "Ex-cliente",
  partner: "Parceiro",
};

const TAX_LABELS: Record<string, string> = {
  simples: "Simples Nacional",
  presumido: "Lucro Presumido",
  real: "Lucro Real",
  mei: "MEI",
  isento: "Isento",
};

const SOURCE_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp",
  website: "Website",
  referral: "Indicação",
  google: "Google",
  social: "Redes Sociais",
  event: "Evento",
  outbound: "Outbound",
  other: "Outro",
};

// ---------------------------------------------------------------------------
// Detail row
// ---------------------------------------------------------------------------
function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-4">
      <dt className="text-sm font-medium text-muted-foreground w-40 shrink-0">
        {label}
      </dt>
      <dd className="text-sm">{value || "—"}</dd>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
interface ContactDetailClientProps {
  contact: Contact;
}

export function ContactDetailClient({ contact }: ContactDetailClientProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div className="p-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/contacts">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {contact.contact_name}
            </h1>
            <Badge variant="secondary">
              {TYPE_LABELS[contact.type] ?? contact.type}
            </Badge>
          </div>
          {contact.company_name && (
            <p className="text-muted-foreground mt-0.5">
              {contact.company_name}
            </p>
          )}
        </div>
        <Button variant="outline" onClick={() => setSheetOpen(true)}>
          <Pencil className="size-4" />
          Editar
        </Button>
      </div>

      <div className="space-y-6">
        {/* Dados principais */}
        <Card className="p-4 space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Dados principais
          </h2>
          <dl className="space-y-2">
            <DetailRow label="Pessoa" value={contact.person_type === "pj" ? "Jurídica" : "Física"} />
            {contact.person_type === "pj" && (
              <>
                <DetailRow label="Razão Social" value={contact.company_name} />
                <DetailRow label="Nome Fantasia" value={contact.trade_name} />
                <DetailRow label="CNPJ" value={formatCnpj(contact.cnpj)} />
              </>
            )}
            {contact.person_type === "pf" && (
              <DetailRow label="CPF" value={contact.cpf} />
            )}
            <DetailRow label="E-mail" value={contact.email} />
            <DetailRow label="Telefone" value={formatPhone(contact.phone)} />
          </dl>
        </Card>

        {/* Endereço */}
        <Card className="p-4 space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Endereço
          </h2>
          <dl className="space-y-2">
            <DetailRow
              label="Logradouro"
              value={
                contact.address_street
                  ? `${contact.address_street}${contact.address_number ? `, ${contact.address_number}` : ""}`
                  : null
              }
            />
            <DetailRow label="Complemento" value={contact.address_complement} />
            <DetailRow label="Bairro" value={contact.address_neighborhood} />
            <DetailRow
              label="Cidade / UF"
              value={
                contact.address_city
                  ? `${contact.address_city}${contact.address_state ? ` - ${contact.address_state}` : ""}`
                  : contact.address_state
              }
            />
            <DetailRow label="CEP" value={contact.address_zip} />
          </dl>
        </Card>

        {/* Dados fiscais */}
        {contact.person_type === "pj" && (
          <Card className="p-4 space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Dados fiscais
            </h2>
            <dl className="space-y-2">
              <DetailRow
                label="Regime tributário"
                value={
                  contact.tax_regime
                    ? TAX_LABELS[contact.tax_regime] ?? contact.tax_regime
                    : null
                }
              />
              <DetailRow label="Funcionários" value={contact.employee_count} />
              <DetailRow
                label="Faturamento mensal"
                value={
                  contact.monthly_revenue != null
                    ? `R$ ${Number(contact.monthly_revenue).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                    : null
                }
              />
              <DetailRow label="Contador atual" value={contact.current_accountant} />
            </dl>
          </Card>
        )}

        {/* Origem e classificação */}
        <Card className="p-4 space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Origem e classificação
          </h2>
          <dl className="space-y-2">
            <DetailRow
              label="Origem"
              value={
                contact.source
                  ? SOURCE_LABELS[contact.source] ?? contact.source
                  : null
              }
            />
            <DetailRow label="Score" value={contact.score} />
            <DetailRow
              label="Tags"
              value={
                contact.tags && contact.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {contact.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : null
              }
            />
          </dl>
        </Card>

        {/* Observações */}
        {contact.notes && (
          <Card className="p-4 space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Observações
            </h2>
            <p className="text-sm whitespace-pre-wrap">{contact.notes}</p>
          </Card>
        )}

        {/* Meta */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            Criado em{" "}
            {new Date(contact.created_at).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <p>
            Atualizado em{" "}
            {new Date(contact.updated_at).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          {contact.enriched_at && (
            <p>
              Enriquecido em{" "}
              {new Date(contact.enriched_at).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>
      </div>

      {/* Edit sheet */}
      <ContactSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        contact={contact}
      />
    </div>
  );
}
