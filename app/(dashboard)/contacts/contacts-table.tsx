"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Users } from "lucide-react";
import { ContactSheet, type Contact } from "./contact-sheet";

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

const TYPE_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  lead: { label: "Lead", variant: "default" },
  client: { label: "Cliente", variant: "secondary" },
  former_client: { label: "Ex-cliente", variant: "outline" },
  partner: { label: "Parceiro", variant: "secondary" },
};

const TAX_LABELS: Record<string, string> = {
  simples: "Simples",
  presumido: "Presumido",
  real: "Real",
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
// Component
// ---------------------------------------------------------------------------
interface ContactsTableProps {
  contacts: Contact[];
  search?: string;
  type?: string;
}

export function ContactsTable({ contacts, search, type }: ContactsTableProps) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  function openCreate() {
    setSelectedContact(null);
    setSheetOpen(true);
  }

  function openEdit(contact: Contact) {
    setSelectedContact(contact);
    setSheetOpen(true);
  }

  function handleSearch(value: string) {
    const params = new URLSearchParams();
    if (value) params.set("search", value);
    if (type && type !== "all") params.set("type", type);
    router.push(`/contacts?${params.toString()}`);
  }

  function handleTypeFilter(value: string) {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (value !== "all") params.set("type", value);
    router.push(`/contacts?${params.toString()}`);
  }

  return (
    <>
      {/* Header toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contatos</h1>
          <p className="mt-1 text-muted-foreground">
            Todos os seus leads e clientes em um só lugar.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Novo contato
        </Button>
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, e-mail, telefone, CNPJ..."
            className="pl-9"
            defaultValue={search ?? ""}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch((e.target as HTMLInputElement).value);
              }
            }}
          />
        </div>
        <Select
          defaultValue={type ?? "all"}
          onValueChange={handleTypeFilter}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="lead">Lead</SelectItem>
            <SelectItem value="client">Cliente</SelectItem>
            <SelectItem value="former_client">Ex-cliente</SelectItem>
            <SelectItem value="partner">Parceiro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table or empty state */}
      {contacts.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border p-12 text-center">
          <Users className="size-10 text-muted-foreground" />
          <p className="text-muted-foreground">Nenhum contato encontrado.</p>
          <Button variant="outline" size="sm" onClick={openCreate}>
            <Plus className="size-4" />
            Criar primeiro contato
          </Button>
        </div>
      ) : (
        <div className="mt-4 rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="hidden md:table-cell">E-mail</TableHead>
                <TableHead className="hidden md:table-cell">Telefone</TableHead>
                <TableHead className="hidden lg:table-cell">CNPJ</TableHead>
                <TableHead className="hidden lg:table-cell">Regime</TableHead>
                <TableHead className="hidden xl:table-cell">Origem</TableHead>
                <TableHead className="text-right">Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact) => {
                const typeInfo = TYPE_LABELS[contact.type] ?? {
                  label: contact.type,
                  variant: "outline" as const,
                };
                return (
                  <TableRow
                    key={contact.id}
                    className="cursor-pointer"
                    onClick={() => openEdit(contact)}
                  >
                    <TableCell className="font-medium">
                      {contact.name}
                      {contact.company_name && (
                        <span className="block text-xs text-muted-foreground">
                          {contact.company_name}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={typeInfo.variant}>{typeInfo.label}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {contact.email ?? "—"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {formatPhone(contact.phone)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell font-mono text-xs">
                      {formatCnpj(contact.cnpj)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {contact.tax_regime
                        ? TAX_LABELS[contact.tax_regime] ?? contact.tax_regime
                        : "—"}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {contact.source
                        ? SOURCE_LABELS[contact.source] ?? contact.source
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {contact.score}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Sheet for create / edit */}
      <ContactSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        contact={selectedContact}
      />
    </>
  );
}
