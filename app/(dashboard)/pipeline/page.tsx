import { getStages, getEntries } from "./actions";
import { KanbanBoard } from "./kanban-board";

export default async function PipelinePage() {
  const [stages, entries] = await Promise.all([getStages(), getEntries()]);

  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Pipeline</h1>
        <p className="mt-1 text-muted-foreground">
          Kanban com seus deals organizados por estágio.
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <KanbanBoard stages={stages} entries={entries} />
      </div>
    </div>
  );
}
