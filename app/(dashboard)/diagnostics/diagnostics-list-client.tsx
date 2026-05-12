"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
} from "@/components/ui/table";
import {
  Plus,
  Trash2,
  Loader2,
  Stethoscope,
  ExternalLink,
} from "lucide-react";
import type { MeetingBriefing } from "./actions";
import { deleteBriefing } from "./actions";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const formatDate = (date: string | null) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatCnpj = (cnpj: string | null) => {
  if (!cnpj) return "—";
  const d = cnpj.replace(/\D/g, "");
  if (d.length !== 14) return cnpj;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
};

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  draft: { label: "Rascunho", variant: "secondary" },
  enriching: { label: "Enriquecendo...", variant: "outline" },
  generating: { label: "Gerando...", variant: "outline" },
  completed: { label: "Concluído", variant: "default" },
  error: { label: "Erro", variant: "destructive" },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
interface Props {
  briefings: MeetingBriefing[];
}

export function DiagnosticsListClient({ briefings }: Props) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este diagnóstico?")) return;
    setDeletingId(id);
    startTransition(async () => {
      try {
        await deleteBriefing(id);
        router.refresh();
      } catch {
        alert("Erro ao excluir diagnóstico.");
      } finally {
        setDeletingId(null);
      }
    });
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Stethoscope className="h-6 w-6" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Diagnósticos
            </h1>
            <p className="text-sm text-muted-foreground">
              Briefings de reunião para seus prospects
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href="/diagnostics/new">
            <Plus className="mr-2 h-4 w-4" />
            Novo Diagnóstico
          </Link>
        </Button>
      </div>

      {briefings.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <Stethoscope className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-semibold">
            Nenhum diagnóstico ainda
          </h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Crie seu primeiro briefing de reunião para impressionar prospects.
          </p>
          <Button asChild>
            <Link href="/diagnostics/new">
              <Plus className="mr-2 h-4 w-4" />
              Novo Diagnóstico
            </Link>
          </Button>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {briefings.map((b) => {
                const sc = statusConfig[b.status] ?? statusConfig.draft;
                return (
                  <TableRow key={b.id}>
                    <TableCell>
                      <Link
                        href={`/diagnostics/${b.id}`}
                        className="font-medium hover:underline"
                      >
                        {b.name}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {formatCnpj(b.cnpj)}
                    </TableCell>
                    <TableCell>
                      {b.contact ? (
                        <span className="text-sm">
                          {b.contact.contact_name}
                          {b.contact.company_name && (
                            <span className="text-muted-foreground">
                              {" "}
                              — {b.contact.company_name}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={sc.variant}>
                        {b.status === "generating" && (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        )}
                        {sc.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(b.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/diagnostics/${b.id}`}>
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={deletingId === b.id && isPending}
                          onClick={() => handleDelete(b.id)}
                        >
                          {deletingId === b.id && isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-destructive" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </>
  );
}
