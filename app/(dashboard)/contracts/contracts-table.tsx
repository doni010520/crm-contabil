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
import { Plus, FileText, Check, X } from "lucide-react";
import { ContractSheet } from "./contract-sheet";
import type { Contract } from "./actions";

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
  active: {
    label: "Ativo",
    className:
      "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  },
  suspended: {
    label: "Suspenso",
    className:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  },
  cancelled: {
    label: "Cancelado",
    className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  },
  expired: {
    label: "Expirado",
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
interface ContractsTableProps {
  contracts: Contract[];
  status?: string;
}

export function ContractsTable({ contracts, status }: ContractsTableProps) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(
    null
  );

  function openCreate() {
    setSelectedContract(null);
    setSheetOpen(true);
  }

  function handleStatusFilter(value: string) {
    const params = new URLSearchParams();
    if (value !== "all") params.set("status", value);
    router.push(`/contracts?${params.toString()}`);
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contratos</h1>
          <p className="mt-1 text-muted-foreground">
            Gestao e acompanhamento de contratos de servicos.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Novo contrato
        </Button>
      </div>

      {/* Status filter tabs */}
      <div className="mt-4">
        <Tabs
          defaultValue={status ?? "all"}
          onValueChange={handleStatusFilter}
        >
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="active">Ativos</TabsTrigger>
            <TabsTrigger value="draft">Rascunho</TabsTrigger>
            <TabsTrigger value="suspended">Suspensos</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelados</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Table or empty state */}
      {contracts.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border p-12 text-center">
          <FileText className="size-10 text-muted-foreground" />
          <p className="text-muted-foreground">Nenhum contrato encontrado.</p>
          <Button variant="outline" size="sm" onClick={openCreate}>
            <Plus className="size-4" />
            Criar primeiro contrato
          </Button>
        </div>
      ) : (
        <div className="mt-4 rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titulo</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor Mensal</TableHead>
                <TableHead className="hidden md:table-cell">Inicio</TableHead>
                <TableHead className="hidden md:table-cell">Termino</TableHead>
                <TableHead className="hidden lg:table-cell text-center">
                  Renovacao Auto
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((contract) => (
                <TableRow key={contract.id} className="cursor-pointer">
                  <TableCell className="font-medium">
                    <Link
                      href={`/contracts/${contract.id}`}
                      className="hover:underline"
                    >
                      {contract.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {contract.contacts?.contact_name ?? "—"}
                    {contract.contacts?.company_name && (
                      <span className="block text-xs text-muted-foreground">
                        {contract.contacts.company_name}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={contract.status} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatBRL(Number(contract.monthly_value))}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {formatDate(contract.start_date)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {formatDate(contract.end_date)}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-center">
                    {contract.auto_renew ? (
                      <Check className="size-4 text-green-600 mx-auto" />
                    ) : (
                      <X className="size-4 text-muted-foreground mx-auto" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Sheet for create / edit */}
      <ContractSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        contract={selectedContract}
      />
    </>
  );
}
