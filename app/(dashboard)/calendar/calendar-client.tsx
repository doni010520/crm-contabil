"use client";

import { useCallback, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  Copy,
  Check,
  ExternalLink,
  Link2,
  ListTodo,
  Plus,
  RefreshCw,
  Trash2,
  Video,
} from "lucide-react";
import {
  type CalendarEvent,
  type BookingLink,
  getCalendarEvents,
  createCalendarEvent,
  deleteCalendarEvent,
  syncCalendarEvents,
  createBookingLink,
  deleteBookingLink,
} from "./actions";
import {
  type Task,
  getTasksForCalendar,
  createTask,
  updateTask,
} from "../tasks/actions";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getWeekDays(baseDate: Date): Date[] {
  const start = new Date(baseDate);
  start.setDate(baseDate.getDate() - baseDate.getDay() + 1);
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

function isToday(d: Date): boolean {
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const priorityColors: Record<string, string> = {
  low: "bg-gray-400",
  medium: "bg-blue-400",
  high: "bg-orange-400",
  urgent: "bg-red-500",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function CalendarClient({
  initialEvents,
  initialTasks,
  bookingLinks,
  gcalStatus,
  tenantSlug,
}: {
  initialEvents: CalendarEvent[];
  initialTasks: Task[];
  bookingLinks: BookingLink[];
  gcalStatus: { connected: boolean; email?: string };
  tenantSlug: string;
}) {
  const [events, setEvents] = useState(initialEvents);
  const [tasks, setTasks] = useState(initialTasks);
  const [weekBase, setWeekBase] = useState(new Date());
  const [isPending, startTransition] = useTransition();
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);
  const [showNewBooking, setShowNewBooking] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const weekDays = getWeekDays(weekBase);

  const loadWeekData = useCallback((base: Date) => {
    const days = getWeekDays(base);
    const start = new Date(days[0]);
    start.setHours(0, 0, 0, 0);
    const end = new Date(days[6]);
    end.setHours(23, 59, 59, 999);
    const startStr = start.toISOString().split("T")[0];
    const endStr = end.toISOString().split("T")[0];

    startTransition(async () => {
      const [evts, tsks] = await Promise.all([
        getCalendarEvents(start.toISOString(), end.toISOString()),
        getTasksForCalendar(startStr, endStr),
      ]);
      setEvents(evts);
      setTasks(tsks);
    });
  }, []);

  const prevWeek = () => {
    const d = new Date(weekBase);
    d.setDate(d.getDate() - 7);
    setWeekBase(d);
    loadWeekData(d);
  };
  const nextWeek = () => {
    const d = new Date(weekBase);
    d.setDate(d.getDate() + 7);
    setWeekBase(d);
    loadWeekData(d);
  };
  const goToday = () => {
    setWeekBase(new Date());
    loadWeekData(new Date());
  };

  const handleSync = () => {
    startTransition(async () => {
      await syncCalendarEvents();
      loadWeekData(weekBase);
    });
  };

  const handleDeleteEvent = (id: string) => {
    startTransition(async () => {
      await deleteCalendarEvent(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
    });
  };

  const handleCreateEvent = (formData: FormData) => {
    const title = formData.get("title") as string;
    const date = formData.get("date") as string;
    const startTime = formData.get("startTime") as string;
    const endTime = formData.get("endTime") as string;
    const description = formData.get("description") as string;
    if (!title || !date || !startTime || !endTime) return;

    startTransition(async () => {
      await createCalendarEvent({
        title,
        description: description || undefined,
        startAt: `${date}T${startTime}:00`,
        endAt: `${date}T${endTime}:00`,
        createMeet: gcalStatus.connected,
      });
      setShowNewEvent(false);
      loadWeekData(weekBase);
    });
  };

  const handleCreateTask = (formData: FormData) => {
    const title = formData.get("title") as string;
    if (!title) return;

    startTransition(async () => {
      await createTask({
        title,
        description: (formData.get("description") as string) || undefined,
        dueDate: (formData.get("dueDate") as string) || undefined,
        dueTime: (formData.get("dueTime") as string) || undefined,
        priority: (formData.get("priority") as string) || "medium",
      });
      setShowNewTask(false);
      loadWeekData(weekBase);
    });
  };

  const handleToggleTask = (task: Task) => {
    const newStatus = task.status === "done" ? "todo" : "done";
    startTransition(async () => {
      await updateTask(task.id, { status: newStatus });
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, status: newStatus as Task["status"] } : t
        )
      );
    });
  };

  const handleCreateBooking = (formData: FormData) => {
    const title = formData.get("title") as string;
    if (!title) return;
    startTransition(async () => {
      await createBookingLink({
        slug: slugify(title),
        title,
        durationMinutes: Number(formData.get("duration") || 30),
      });
      setShowNewBooking(false);
    });
  };

  const handleCopyLink = (link: BookingLink) => {
    const url = `${window.location.origin}/agendar/${tenantSlug}/${link.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Group events and tasks by day
  const eventsByDay = weekDays.map((day) => ({
    day,
    events: events.filter((e) => isSameDay(new Date(e.start_at), day)),
    tasks: tasks.filter((t) => t.due_date && isSameDay(new Date(t.due_date + "T12:00:00"), day)),
  }));

  const weekLabel = `${weekDays[0].toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} - ${weekDays[6].toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}`;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Agenda</h1>
          {gcalStatus.connected && (
            <p className="text-sm text-muted-foreground">
              Google Calendar: {gcalStatus.email}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {gcalStatus.connected && (
            <Button variant="outline" size="sm" onClick={handleSync} disabled={isPending}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
              Sync Google
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowNewTask(true)}>
            <ListTodo className="mr-2 h-4 w-4" />
            Nova Tarefa
          </Button>
          <Button size="sm" onClick={() => setShowNewEvent(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Evento
          </Button>
        </div>
      </div>

      {/* Week navigator */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={prevWeek}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={goToday}>Hoje</Button>
        <Button variant="outline" size="icon" onClick={nextWeek}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <span className="ml-2 text-sm font-medium">{weekLabel}</span>
      </div>

      {/* Week grid */}
      <div className="grid grid-cols-7 gap-2">
        {eventsByDay.map(({ day, events: dayEvents, tasks: dayTasks }) => (
          <div
            key={day.toISOString()}
            className={`min-h-[220px] rounded-lg border p-2 ${
              isToday(day) ? "border-primary bg-primary/5" : ""
            }`}
          >
            <div className="mb-2 text-center">
              <p className="text-xs text-muted-foreground">
                {day.toLocaleDateString("pt-BR", { weekday: "short" })}
              </p>
              <p className={`text-lg font-semibold ${isToday(day) ? "text-primary" : ""}`}>
                {day.getDate()}
              </p>
            </div>
            <div className="space-y-1">
              {/* Events */}
              {dayEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="group relative rounded px-2 py-1 text-xs bg-primary/10 text-primary"
                >
                  <p className="font-medium truncate">{evt.title}</p>
                  <p className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(evt.start_at)}
                  </p>
                  {evt.meet_link && (
                    <a
                      href={evt.meet_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-500 hover:underline"
                    >
                      <Video className="h-3 w-3" />
                      Meet
                    </a>
                  )}
                  <button
                    onClick={() => handleDeleteEvent(evt.id)}
                    className="absolute -right-1 -top-1 hidden rounded-full bg-destructive p-0.5 text-destructive-foreground group-hover:block"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {/* Tasks */}
              {dayTasks.map((task) => {
                const overdue =
                  task.due_date &&
                  task.due_date < new Date().toISOString().split("T")[0] &&
                  task.status !== "done";
                return (
                  <div
                    key={task.id}
                    className={`group flex items-center gap-1.5 rounded px-2 py-1 text-xs ${
                      overdue
                        ? "bg-red-100 text-red-700"
                        : "bg-muted text-muted-foreground"
                    } ${task.status === "done" ? "opacity-50" : ""}`}
                  >
                    <button onClick={() => handleToggleTask(task)} className="shrink-0">
                      {task.status === "done" ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Circle className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <span className={`truncate ${task.status === "done" ? "line-through" : ""}`}>
                      {task.title}
                    </span>
                    <span className={`ml-auto h-2 w-2 rounded-full shrink-0 ${priorityColors[task.priority]}`} />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Booking Links */}
      {gcalStatus.connected && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Links de Agendamento</h2>
            <Button variant="outline" size="sm" onClick={() => setShowNewBooking(true)}>
              <Link2 className="mr-2 h-4 w-4" />
              Novo Link
            </Button>
          </div>
          {bookingLinks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum link de agendamento criado ainda.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {bookingLinks.map((link) => (
                <Card key={link.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{link.title}</CardTitle>
                      <Badge variant={link.is_active ? "default" : "secondary"}>
                        {link.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground mb-2">
                      {link.duration_minutes} min
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleCopyLink(link)}>
                        {copiedId === link.id ? (
                          <><Check className="mr-1 h-3 w-3" />Copiado</>
                        ) : (
                          <><Copy className="mr-1 h-3 w-3" />Copiar</>
                        )}
                      </Button>
                      <Button size="sm" variant="ghost" asChild>
                        <a href={`/agendar/${tenantSlug}/${link.slug}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-1 h-3 w-3" />
                          Abrir
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* New Event Sheet */}
      <Sheet open={showNewEvent} onOpenChange={setShowNewEvent}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Novo Evento</SheetTitle>
          </SheetHeader>
          <form action={handleCreateEvent} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titulo</Label>
              <Input id="title" name="title" placeholder="Reuniao com cliente" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input id="date" name="date" type="date" required />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="startTime">Inicio</Label>
                <Input id="startTime" name="startTime" type="time" defaultValue="09:00" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">Fim</Label>
                <Input id="endTime" name="endTime" type="time" defaultValue="09:30" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descricao</Label>
              <Textarea id="description" name="description" rows={3} />
            </div>
            {gcalStatus.connected && (
              <p className="text-xs text-muted-foreground">
                Sera sincronizado com Google Calendar e um link do Meet sera criado.
              </p>
            )}
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Criando..." : "Criar Evento"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* New Task Sheet */}
      <Sheet open={showNewTask} onOpenChange={setShowNewTask}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Nova Tarefa</SheetTitle>
          </SheetHeader>
          <form action={handleCreateTask} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="taskTitle">Titulo</Label>
              <Input id="taskTitle" name="title" placeholder="Entregar declaracao IRPF" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taskDesc">Descricao</Label>
              <Textarea id="taskDesc" name="description" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="taskDate">Data</Label>
                <Input id="taskDate" name="dueDate" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taskTime">Hora</Label>
                <Input id="taskTime" name="dueTime" type="time" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select name="priority" defaultValue="medium">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Criando..." : "Criar Tarefa"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* New Booking Sheet */}
      <Sheet open={showNewBooking} onOpenChange={setShowNewBooking}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Novo Link de Agendamento</SheetTitle>
          </SheetHeader>
          <form action={handleCreateBooking} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bookingTitle">Titulo</Label>
              <Input id="bookingTitle" name="title" placeholder="Consulta Tributaria" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duracao (minutos)</Label>
              <Input id="duration" name="duration" type="number" defaultValue={30} min={15} max={120} step={15} />
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Criando..." : "Criar Link"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
