"use client";

import { useTransition, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
  ArrowLeft,
  Send,
  CheckCircle2,
  XCircle,
  Pencil,
  Loader2,
} from "lucide-react";
import { updateProposalStatus } from "../actions";
import { ProposalSheet } from "../proposal-sheet";
import type { Proposal, ProposalStatus } from "../actions";

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
type ProposalWithContact = Proposal & {
  contacts: {
    id: string;
    name: string;
    company_name: string | null;
    email: string | null;
    phone: string | null;
  };
};

interface ProposalDetailClientProps {
  proposal: ProposalWithContact;
}

export function ProposalDetailClient({ proposal }: ProposalDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStatusChange = useCallback(
    (status: ProposalStatus) => {
      setPendingAction(status);
      setError(null);
      startTransition(async () => {
        try {
          await updateProposalStatus(proposal.id, status);
          router.refresh();
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Erro ao atualizar status."
          );
        } finally {
          setPendingAction(null);
        }
      });
    },
    [proposal.id, router]
  );

  const contact = proposal.contacts;
  const items = proposal.items ?? [];

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/proposals">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {proposal.title}
            </h1>
            <StatusBadge status={proposal.status} />
          </div>
          <p className="text-muted-foreground mt-0.5">
            {contact.name}
            {contact.company_name ? ` — ${contact.company_name}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {proposal.status === "draft" && (
            <Button
              variant="default"
              onClick={() => handleStatusChange("sent")}
              disabled={isPending}
            >
              {pendingAction === "sent" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              Enviar
            </Button>
          )}
          {(proposal.status === "sent" || proposal.status === "viewed") && (
            <>
              <Button
                variant="default"
                onClick={() => handleStatusChange("accepted")}
                disabled={isPending}
              >
                {pendingAction === "accepted" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-4" />
                )}
                Aceitar
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleStatusChange("rejected")}
                disabled={isPending}
              >
                {pendingAction === "rejected" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <XCircle className="size-4" />
                )}
                Rejeitar
              </Button>
            </>
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

        {/* Itens */}
        <Card className="p-4 space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Itens
          </h2>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50%]">Descrição</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead className="text-right">Valor Unit.</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length > 0 ? (
                  items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.description || "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatBRL(item.unit_price)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatBRL(item.total)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground"
                    >
                      Nenhum item adicionado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-medium">
                    Total
                  </TableCell>
                  <TableCell className="text-right font-bold tabular-nums text-base">
                    {formatBRL(Number(proposal.total))}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </Card>

        {/* Detalhes */}
        <Card className="p-4 space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Detalhes
          </h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Válida até</dt>
              <dd>{formatDate(proposal.valid_until)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Criada em</dt>
              <dd>{formatDateTime(proposal.created_at)}</dd>
            </div>
            {proposal.sent_at && (
              <div>
                <dt className="text-muted-foreground">Enviada em</dt>
                <dd>{formatDateTime(proposal.sent_at)}</dd>
              </div>
            )}
            {proposal.viewed_at && (
              <div>
                <dt className="text-muted-foreground">Visualizada em</dt>
                <dd>{formatDateTime(proposal.viewed_at)}</dd>
              </div>
            )}
            {proposal.accepted_at && (
              <div>
                <dt className="text-muted-foreground">Aceita em</dt>
                <dd>{formatDateTime(proposal.accepted_at)}</dd>
              </div>
            )}
          </dl>
        </Card>

        {/* Observações */}
        {proposal.notes && (
          <Card className="p-4 space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Observações
            </h2>
            <p className="text-sm whitespace-pre-wrap">{proposal.notes}</p>
          </Card>
        )}
      </div>

      {/* Edit sheet */}
      <ProposalSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        proposal={proposal}
      />
    </div>
  );
}
