"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GripVertical, Trash2, Loader2, Building2, Clock } from "lucide-react";
import type { Deal } from "./actions";
import { deleteEntry, moveEntry } from "./actions";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const formatBRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function daysSinceCreated(createdAt: string): number {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

// ---------------------------------------------------------------------------
// Pipeline Card
// ---------------------------------------------------------------------------
interface PipelineCardProps {
  entry: Deal;
  stageColor: string;
}

export function PipelineCard({ entry, stageColor }: PipelineCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [detailOpen, setDetailOpen] = useState(false);
  const days = daysSinceCreated(entry.created_at);

  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.setData("text/plain", entry.id);
    e.dataTransfer.effectAllowed = "move";
    // Add a slight delay to allow the drag image to be captured
    requestAnimationFrame(() => {
      (e.target as HTMLElement).style.opacity = "0.5";
    });
  }

  function handleDragEnd(e: React.DragEvent) {
    (e.target as HTMLElement).style.opacity = "1";
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteEntry(entry.id);
        setDetailOpen(false);
        router.refresh();
      } catch (err) {
        console.error(err);
      }
    });
  }

  return (
    <>
      <div
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={() => setDetailOpen(true)}
        className="group cursor-grab rounded-lg border bg-card p-3 shadow-sm transition-all hover:shadow-md active:cursor-grabbing"
      >
        {/* Top row: drag handle + contact name */}
        <div className="flex items-start gap-2">
          <GripVertical className="mt-0.5 size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium leading-tight">
              {entry.contact.name}
            </p>
            {entry.contact.company_name && (
              <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <Building2 className="size-3 shrink-0" />
                <span className="truncate">{entry.contact.company_name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom row: value + days */}
        <div className="mt-2 flex items-center justify-between gap-2">
          {entry.value ? (
            <Badge variant="secondary" className="text-xs font-medium">
              {formatBRL.format(entry.value)}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">Sem valor</span>
          )}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3" />
            <span>
              {days === 0 ? "Hoje" : days === 1 ? "1 dia" : `${days} dias`}
            </span>
          </div>
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{entry.contact.name}</DialogTitle>
            <DialogDescription>
              {entry.contact.company_name ?? "Sem empresa"}
              {entry.contact.email ? ` · ${entry.contact.email}` : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">
                  Valor esperado
                </Label>
                <p className="text-sm font-medium">
                  {entry.value
                    ? formatBRL.format(entry.value)
                    : "—"}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Dias no estágio
                </Label>
                <p className="text-sm font-medium">
                  {days === 0
                    ? "Hoje"
                    : days === 1
                      ? "1 dia"
                      : `${days} dias`}
                </p>
              </div>
            </div>

            {entry.title && (
              <div>
                <Label className="text-xs text-muted-foreground">
                  Título
                </Label>
                <p className="mt-1 whitespace-pre-wrap text-sm">{entry.title}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="mr-1 size-4 animate-spin" />
              ) : (
                <Trash2 className="mr-1 size-4" />
              )}
              Excluir deal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
