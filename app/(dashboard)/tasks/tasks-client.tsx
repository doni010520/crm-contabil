"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Filter,
  Loader2,
  Plus,
  Search,
  Trash2,
  User,
} from "lucide-react";
import {
  type Task,
  type TeamMember,
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from "./actions";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const priorityConfig = {
  low: { label: "Baixa", color: "bg-gray-100 text-gray-700" },
  medium: { label: "Media", color: "bg-blue-100 text-blue-700" },
  high: { label: "Alta", color: "bg-orange-100 text-orange-700" },
  urgent: { label: "Urgente", color: "bg-red-100 text-red-700" },
};

const statusConfig = {
  todo: { label: "A Fazer", icon: Circle, color: "text-gray-500" },
  in_progress: { label: "Em Andamento", icon: Clock, color: "text-blue-500" },
  done: { label: "Concluido", icon: CheckCircle2, color: "text-green-500" },
  cancelled: { label: "Cancelado", icon: AlertCircle, color: "text-gray-400" },
};

function isOverdue(task: Task): boolean {
  if (!task.due_date || task.status === "done" || task.status === "cancelled")
    return false;
  const today = new Date().toISOString().split("T")[0];
  return task.due_date < today;
}

function formatDate(d: string | null): string {
  if (!d) return "Sem prazo";
  return new Date(d + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function TasksClient({
  initialTasks,
  teamMembers,
  contacts,
  deals,
}: {
  initialTasks: Task[];
  teamMembers: TeamMember[];
  contacts: { id: string; name: string }[];
  deals: { id: string; title: string }[];
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [isPending, startTransition] = useTransition();
  const [showNewTask, setShowNewTask] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Filtered tasks
  const filtered = tasks.filter((t) => {
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    if (searchTerm && !t.title.toLowerCase().includes(searchTerm.toLowerCase()))
      return false;
    return true;
  });

  // Group: overdue first, then by status
  const overdue = filtered.filter((t) => isOverdue(t));
  const active = filtered.filter(
    (t) => !isOverdue(t) && t.status !== "done" && t.status !== "cancelled"
  );
  const completed = filtered.filter(
    (t) => t.status === "done" || t.status === "cancelled"
  );

  function handleStatusToggle(task: Task) {
    const newStatus = task.status === "done" ? "todo" : "done";
    startTransition(async () => {
      await updateTask(task.id, { status: newStatus });
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? {
                ...t,
                status: newStatus as Task["status"],
                completed_at:
                  newStatus === "done" ? new Date().toISOString() : null,
              }
            : t
        )
      );
    });
  }

  function handleCreate(formData: FormData) {
    const title = formData.get("title") as string;
    if (!title) return;

    startTransition(async () => {
      await createTask({
        title,
        description: (formData.get("description") as string) || undefined,
        dueDate: (formData.get("dueDate") as string) || undefined,
        dueTime: (formData.get("dueTime") as string) || undefined,
        priority: (formData.get("priority") as string) || "medium",
        assignedTo: (formData.get("assignedTo") as string) || undefined,
        contactId: (formData.get("contactId") as string) || undefined,
        dealId: (formData.get("dealId") as string) || undefined,
      });
      setShowNewTask(false);
      const refreshed = await getTasks();
      setTasks(refreshed);
    });
  }

  function handleUpdate(formData: FormData) {
    if (!editTask) return;

    startTransition(async () => {
      await updateTask(editTask.id, {
        title: formData.get("title") as string,
        description: (formData.get("description") as string) || null,
        due_date: (formData.get("dueDate") as string) || null,
        due_time: (formData.get("dueTime") as string) || null,
        priority: formData.get("priority") as string,
        status: formData.get("status") as string,
        assigned_to: (formData.get("assignedTo") as string) || null,
        contact_id: (formData.get("contactId") as string) || null,
        deal_id: (formData.get("dealId") as string) || null,
      });
      setEditTask(null);
      const refreshed = await getTasks();
      setTasks(refreshed);
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    });
  }

  function TaskRow({ task }: { task: Task }) {
    const overdue = isOverdue(task);
    const StatusIcon = statusConfig[task.status].icon;
    const prio = priorityConfig[task.priority];

    return (
      <div
        className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors hover:bg-muted/50 ${
          overdue ? "border-red-200 bg-red-50/50" : ""
        }`}
      >
        <button
          onClick={() => handleStatusToggle(task)}
          className={`shrink-0 ${statusConfig[task.status].color}`}
        >
          <StatusIcon className="h-5 w-5" />
        </button>

        <div
          className="min-w-0 flex-1 cursor-pointer"
          onClick={() => setEditTask(task)}
        >
          <p
            className={`text-sm font-medium ${
              task.status === "done" ? "line-through text-muted-foreground" : ""
            }`}
          >
            {task.title}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {task.due_date && (
              <span
                className={`flex items-center gap-1 text-xs ${
                  overdue ? "text-red-600 font-medium" : "text-muted-foreground"
                }`}
              >
                <Calendar className="h-3 w-3" />
                {formatDate(task.due_date)}
                {overdue && " (atrasada)"}
              </span>
            )}
            {task.contact && (
              <span className="text-xs text-muted-foreground">
                {task.contact.name}
              </span>
            )}
            {task.assignee && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                {task.assignee.name}
              </span>
            )}
          </div>
        </div>

        <Badge className={`shrink-0 text-[10px] ${prio.color}`} variant="secondary">
          {prio.label}
        </Badge>
      </div>
    );
  }

  function TaskForm({
    task,
    onSubmit,
    onClose,
  }: {
    task?: Task | null;
    onSubmit: (fd: FormData) => void;
    onClose: () => void;
  }) {
    return (
      <form action={onSubmit} className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Titulo *</Label>
          <Input id="title" name="title" defaultValue={task?.title} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Descricao</Label>
          <Textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={task?.description ?? ""}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label htmlFor="dueDate">Data</Label>
            <Input
              id="dueDate"
              name="dueDate"
              type="date"
              defaultValue={task?.due_date ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dueTime">Hora</Label>
            <Input
              id="dueTime"
              name="dueTime"
              type="time"
              defaultValue={task?.due_time ?? ""}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label>Prioridade</Label>
            <Select name="priority" defaultValue={task?.priority ?? "medium"}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Media</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {task && (
            <div className="space-y-2">
              <Label>Status</Label>
              <Select name="status" defaultValue={task.status}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">A Fazer</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="done">Concluido</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label>Responsavel</Label>
          <Select name="assignedTo" defaultValue={task?.assigned_to ?? ""}>
            <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">Nenhum</SelectItem>
              {teamMembers.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label>Contato</Label>
            <Select name="contactId" defaultValue={task?.contact_id ?? ""}>
              <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nenhum</SelectItem>
                {contacts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Negocio</Label>
            <Select name="dealId" defaultValue={task?.deal_id ?? ""}>
              <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nenhum</SelectItem>
                {deals.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="submit" className="flex-1" disabled={isPending}>
            {isPending ? "Salvando..." : task ? "Salvar" : "Criar Tarefa"}
          </Button>
          {task && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={() => {
                handleDelete(task.id);
                onClose();
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tarefas</h1>
          <p className="text-sm text-muted-foreground">
            {tasks.filter((t) => t.status === "todo" || t.status === "in_progress").length} pendentes
            {overdue.length > 0 && (
              <span className="text-red-600 ml-1">
                ({overdue.length} atrasadas)
              </span>
            )}
          </p>
        </div>
        <Button onClick={() => setShowNewTask(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Tarefa
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tarefa..."
            className="pl-9 w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="todo">A Fazer</SelectItem>
            <SelectItem value="in_progress">Em Andamento</SelectItem>
            <SelectItem value="done">Concluido</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas prioridades</SelectItem>
            <SelectItem value="urgent">Urgente</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="medium">Media</SelectItem>
            <SelectItem value="low">Baixa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Task lists */}
      <div className="space-y-6">
        {overdue.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-red-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              Atrasadas ({overdue.length})
            </h3>
            <div className="space-y-2">
              {overdue.map((t) => (
                <TaskRow key={t.id} task={t} />
              ))}
            </div>
          </div>
        )}

        {active.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
              Pendentes ({active.length})
            </h3>
            <div className="space-y-2">
              {active.map((t) => (
                <TaskRow key={t.id} task={t} />
              ))}
            </div>
          </div>
        )}

        {completed.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
              Concluidas ({completed.length})
            </h3>
            <div className="space-y-2">
              {completed.map((t) => (
                <TaskRow key={t.id} task={t} />
              ))}
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-2 text-muted-foreground">Nenhuma tarefa encontrada</p>
          </div>
        )}
      </div>

      {/* New Task Sheet */}
      <Sheet open={showNewTask} onOpenChange={setShowNewTask}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Nova Tarefa</SheetTitle>
          </SheetHeader>
          <TaskForm onSubmit={handleCreate} onClose={() => setShowNewTask(false)} />
        </SheetContent>
      </Sheet>

      {/* Edit Task Sheet */}
      <Sheet open={!!editTask} onOpenChange={() => setEditTask(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Editar Tarefa</SheetTitle>
          </SheetHeader>
          <TaskForm
            task={editTask}
            onSubmit={handleUpdate}
            onClose={() => setEditTask(null)}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
