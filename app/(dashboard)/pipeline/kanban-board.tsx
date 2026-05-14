"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { PipelineStage, Deal } from "./actions";
import { moveEntry } from "./actions";
import { PipelineCard } from "./pipeline-card";
import { AddDealDialog } from "./add-deal-dialog";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const formatBRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

// ---------------------------------------------------------------------------
// Kanban Board
// ---------------------------------------------------------------------------
interface KanbanBoardProps {
  stages: PipelineStage[];
  entries: Deal[];
}

export function KanbanBoard({ stages, entries }: KanbanBoardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);

  // Add Deal dialog state
  const [addDealOpen, setAddDealOpen] = useState(false);
  const [addDealStageId, setAddDealStageId] = useState("");
  const [addDealStageName, setAddDealStageName] = useState("");

  // Group entries by stage
  const entriesByStage = new Map<string, Deal[]>();
  for (const stage of stages) {
    entriesByStage.set(stage.id, []);
  }
  for (const entry of entries) {
    const stageEntries = entriesByStage.get(entry.stage_id);
    if (stageEntries) {
      stageEntries.push(entry);
    }
  }

  // Drag and drop handlers
  function handleDragOver(e: React.DragEvent, stageId: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStageId(stageId);
  }

  function handleDragLeave(e: React.DragEvent) {
    // Only clear if actually leaving the column (not entering a child)
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    const currentTarget = e.currentTarget as HTMLElement;
    if (!relatedTarget || !currentTarget.contains(relatedTarget)) {
      setDragOverStageId(null);
    }
  }

  function handleDrop(e: React.DragEvent, stageId: string) {
    e.preventDefault();
    setDragOverStageId(null);

    const entryId = e.dataTransfer.getData("text/plain");
    if (!entryId) return;

    // Find the entry to check if it's already in this stage
    const entry = entries.find((en) => en.id === entryId);
    if (!entry || entry.stage_id === stageId) return;

    startTransition(async () => {
      try {
        await moveEntry(entryId, stageId);
        router.refresh();
      } catch (err) {
        console.error(err);
      }
    });
  }

  function openAddDeal(stage: PipelineStage) {
    setAddDealStageId(stage.id);
    setAddDealStageName(stage.name);
    setAddDealOpen(true);
  }

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const stageEntries = entriesByStage.get(stage.id) ?? [];
          const totalValue = stageEntries.reduce(
            (sum, e) => sum + (e.value ?? 0),
            0
          );
          const isDragOver = dragOverStageId === stage.id;

          return (
            <div
              key={stage.id}
              className="flex w-72 shrink-0 flex-col rounded-lg border bg-muted/30"
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              {/* Column header */}
              <div className="flex items-center gap-2 px-3 py-3">
                <div
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: stage.color }}
                />
                <h3 className="min-w-0 flex-1 truncate text-sm font-semibold">
                  {stage.name}
                </h3>
                <Badge variant="outline" className="text-xs tabular-nums">
                  {stageEntries.length}
                </Badge>
              </div>

              {/* Total value */}
              {totalValue > 0 && (
                <div className="px-3 pb-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    {formatBRL.format(totalValue)}
                  </p>
                </div>
              )}

              {/* Cards area */}
              <div
                className={`flex min-h-[120px] flex-1 flex-col gap-2 px-2 pb-2 transition-colors ${
                  isDragOver
                    ? "rounded-md bg-accent/50 ring-2 ring-inset ring-primary/30"
                    : ""
                }`}
              >
                {stageEntries.map((entry) => (
                  <PipelineCard
                    key={entry.id}
                    entry={entry}
                    stageColor={stage.color}
                  />
                ))}

                {stageEntries.length === 0 && !isDragOver && (
                  <div className="flex flex-1 items-center justify-center">
                    <p className="text-xs text-muted-foreground">
                      Nenhum deal
                    </p>
                  </div>
                )}
              </div>

              {/* Add deal button */}
              <div className="border-t px-2 py-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-muted-foreground"
                  onClick={() => openAddDeal(stage)}
                >
                  <Plus className="mr-1 size-4" />
                  Adicionar deal
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <AddDealDialog
        open={addDealOpen}
        onOpenChange={setAddDealOpen}
        stageId={addDealStageId}
        stageName={addDealStageName}
      />
    </>
  );
}
