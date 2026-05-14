"use client";

import { useTransition, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  CheckCircle2,
  PauseCircle,
  XCircle,
  Pencil,
  Loader2,
  Check,
  X,
} from "lucide-react";
import { updateContractStatus } from "../actions";
import { ContractSheet } from "../contract-sheet";
import type { Contract, ContractStatus } from "../actions";

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

const formatDateTime = (date: string | null) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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
  const config = STATUS_MAP[status] ?? { label: status, className: "" };
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
type ContractWithContact = Contract & {
  contacts: {
    id: string;
    name: string;
    company_name: string | null;
    email: string | null;
    phone: string | null;
  };
};

interface ContractDetailClientProps {
  contract: ContractWithContact;
}

export function ContractDetailClient({ contract }: ContractDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleStatusChange = useCallback(
    (status: ContractStatus, reason?: string) => {
      setPendingAction(status);
      setError(null);
      startTransition(async () => {
        try {
          await updateContractStatus(contract.id, status, reason);
          router.refresh();
          if (status === "cancelled") {
            setCancelDialogOpen(false);
            setCancellationReason("");
          }
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Erro ao atualizar status."
          );
        } finally {
          setPendingAction(null);
        }
      });
    },
    [contract.id, router]
  );

  const contact = contract.contacts;
  const services = contract.services ?? [];

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/contracts">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {contract.title}
            </h1>
            <StatusBadge status={contract.status} />
          </div>
          <p className="text-muted-foreground mt-0.5">
            {contact.name}
            {contact.company_name ? ` — ${contact.company_name}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {contract.status === "draft" && (
            <Button
              variant="default"
              onClick={() => handleStatusChange("active")}
              disabled={isPending}
            >
              {pendingAction === "active" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
              Assinar
            </Button>
          )}
          {contract.status === "active" && (
            <Button
              variant="outline"
              onClick={() => handleStatusChange("suspended")}
              disabled={isPending}
            >
              {pendingAction === "suspended" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <PauseCircle className="size-4" />
              )}
              Suspender
            </Button>
          )}
          {contract.status === "suspended" && (
            <Button
              variant="default"
              onClick={() => handleStatusChange("active")}
              disabled={isPending}
            >
              {pendingAction === "active" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
              Reativar
            </Button>
          )}
          {(contract.status === "active" || contract.status === "suspended") && (
            <Button
              variant="destructive"
              onClick={() => setCancelDialogOpen(true)}
              disabled={isPending}
            >
              <XCircle className="size-4" />
              Cancelar
            </Button>
          )}
          <Button variant="outline" onClick={() => setSheetOpen(true)}>
            <Pencil className="size-4" />
            Editar
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Contato */}
        <Card className="p-4 space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Contato
          </h2>
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Nome</dt>
              <dd className="font-medium">
                <Link
                  href={`/contacts/${contact.id}`}
                  className="hover:underline"
                >
                  {contact.name}
                </Link>
              </dd>
            </div>
            {contact.company_name && (
              <div>
                <dt className="text-muted-foreground">Empresa</dt>
                <dd>{contact.company_name}</dd>
              </div>
            )}
            {contact.email && (
              <div>
                <dt className="text-muted-foreground">E-mail</dt>
                <dd>{contact.email}</dd>
              </div>
            )}
            {contact.phone && (
              <div>
                <dt className="text-muted-foreground">Telefone</dt>
                <dd>{contact.phone}</dd>
              </div>
            )}
          </dl>
        </Card>

        {/* Servicos */}
        <Card className="p-4 space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Servicos
          </h2>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60%]">Servico</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.length > 0 ? (
                  services.map((service, index) => (
                    <TableRow key={index}>
                      <TableCell>{service.name || "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatBRL(service.value)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={2}
                      className="text-center text-muted-foreground"
                    >
                      Nenhum servico adicionado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="text-right font-medium">
                    Valor Mensal
                  </TableCell>
                  <TableCell className="text-right font-bold tabular-nums text-base">
                    {formatBRL(Number(contract.monthly_value))}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </Card>

        {/* Detalhes */}
        <Card className="p-4 space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Detalhes do contrato
          </h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Data de inicio</dt>
              <dd>{formatDate(contract.start_date)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Data de termino</dt>
              <dd>{formatDate(contract.end_date)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Renovacao automatica</dt>
              <dd className="flex items-center gap-1">
                {contract.auto_renew ? (
                  <>
                    <Check className="size-4 text-green-600" />
                    Sim
                  </>
                ) : (
                  <>
                    <X className="size-4 text-muted-foreground" />
                    Nao
                  </>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Criado em</dt>
              <dd>{formatDateTime(contract.created_at)}</dd>
            </div>
            {contract.signed_at && (
              <div>
                <dt className="text-muted-foreground">Assinado em</dt>
                <dd>{formatDateTime(contract.signed_at)}</dd>
              </div>
            )}
            {contract.cancelled_at && (
              <div>
                <dt className="text-muted-foreground">Cancelado em</dt>
                <dd>{formatDateTime(contract.cancelled_at)}</dd>
              </div>
            )}
          </dl>
        </Card>

        {/* Motivo do cancelamento */}
        {contract.cancellation_reason && (
          <Card className="p-4 space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Motivo do cancelamento
            </h2>
            <p className="text-sm whitespace-pre-wrap">
              {contract.cancellation_reason}
            </p>
          </Card>
        )}
      </div>

      {/* Cancel dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar contrato</DialogTitle>
            <DialogDescription>
              Informe o motivo do cancelamento do contrato. Esta acao pode ser
              revertida apenas pela reativacao do contrato.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="cancellation_reason">Motivo do cancelamento</Label>
            <Textarea
              id="cancellation_reason"
              rows={3}
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="Descreva o motivo do cancelamento..."
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCancelDialogOpen(false);
                setCancellationReason("");
              }}
            >
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                handleStatusChange("cancelled", cancellationReason || undefined)
              }
              disabled={isPending}
            >
              {pendingAction === "cancelled" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <XCircle className="size-4" />
              )}
              Confirmar cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit sheet */}
      <ContractSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        contract={contract}
      />
    </div>
  );
}
