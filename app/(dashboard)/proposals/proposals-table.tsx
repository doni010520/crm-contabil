"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, FileText } from "lucide-react";
import { ProposalSheet } from "./proposal-sheet";
import type { Proposal } from "./actions";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

const formatDate = (date: string | null) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------
type StatusConfig = {
  label: string;
  className: string;
};

const STATUS_MAP: Record<string, StatusConfig> = {
  draft: {
    label: "Rascunho",
    className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  },
  sent: {
    label: "Enviada",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  },
  viewed: {
    label: "Visualizada",
    className:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  },
  accepted: {
    label: "Aceita",
    className:
      "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  },
  rejected: {
    label: "Rejeitada",
    className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  },
  expired: {
    label: "Expirada",
    className: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
  },
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_MAP[status] ?? {
    label: status,
    className: "",
  };
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
interface ProposalsTableProps {
  proposals: Proposal[];
  status?: string;
}

export function ProposalsTable({ proposals, status }: ProposalsTableProps) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(
    null
  );

  function openCreate() {
    setSelectedProposal(null);
    setSheetOpen(true);
  }

  function openEdit(proposal: Proposal) {
    setSelectedProposal(proposal);
    setSheetOpen(true);
  }

  function handleStatusFilter(value: string) {
    const params = new URLSearchParams();
    if (value !== "all") params.set("status", value);
    router.push(`/proposals?${params.toString()}`);
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Propostas</h1>
          <p className="mt-1 text-muted-foreground">
            Geração e acompanhamento de propostas comerciais.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Nova proposta
        </Button>
      </div>

      {/* Status filter tabs */}
      <div className="mt-4">
        <Tabs
          defaultValue={status ?? "all"}
          onValueChange={handleStatusFilter}
        >
          <TabsList>
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="draft">Rascunho</TabsTrigger>
            <TabsTrigger value="sent">Enviadas</TabsTrigger>
            <TabsTrigger value="accepted">Aceitas</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Table or empty state */}
      {proposals.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border p-12 text-center">
          <FileText className="size-10 text-muted-foreground" />
          <p className="text-muted-foreground">Nenhuma proposta encontrada.</p>
          <Button variant="outline" size="sm" onClick={openCreate}>
            <Plus className="size-4" />
            Criar primeira proposta
          </Button>
        </div>
      ) : (
        <div className="mt-4 rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor Total</TableHead>
                <TableHead className="hidden md:table-cell">
                  Validade
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  Criada em
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proposals.map((proposal) => (
                <TableRow key={proposal.id} className="cursor-pointer">
                  <TableCell className="font-medium">
                    <Link
                      href={`/proposals/${proposal.id}`}
                      className="hover:underline"
                    >
                      {proposal.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {proposal.contacts?.contact_name ?? "—"}
                    {proposal.contacts?.company_name && (
                      <span className="block text-xs text-muted-foreground">
                        {proposal.contacts.company_name}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={proposal.status} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatBRL(Number(proposal.total))}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {formatDate(proposal.valid_until)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {formatDate(proposal.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Sheet for create / edit */}
      <ProposalSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        proposal={selectedProposal}
      />
    </>
  );
}
