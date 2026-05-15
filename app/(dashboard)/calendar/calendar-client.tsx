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
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Check,
  ExternalLink,
  Link2,
  MapPin,
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
  updateBookingLink,
} from "./actions";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

function getWeekDays(baseDate: Date): Date[] {
  const start = new Date(baseDate);
  start.setDate(baseDate.getDate() - baseDate.getDay() + 1); // Monday
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function CalendarClient({
  initialEvents,
  bookingLinks,
  gcalStatus,
  tenantSlug,
}: {
  initialEvents: CalendarEvent[];
  bookingLinks: BookingLink[];
  gcalStatus: { connected: boolean; email?: string };
  tenantSlug: string;
}) {
  const [events, setEvents] = useState(initialEvents);
  const [weekBase, setWeekBase] = useState(new Date());
  const [isPending, startTransition] = useTransition();
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [showNewBooking, setShowNewBooking] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const weekDays = getWeekDays(weekBase);

  // Navigate weeks
  const prevWeek = () => {
    const d = new Date(weekBase);
    d.setDate(d.getDate() - 7);
    setWeekBase(d);
    loadEvents(d);
  };

  const nextWeek = () => {
    const d = new Date(weekBase);
    d.setDate(d.getDate() + 7);
    setWeekBase(d);
    loadEvents(d);
  };

  const goToday = () => {
    setWeekBase(new Date());
    loadEvents(new Date());
  };

  const loadEvents = useCallback(
    (base: Date) => {
      const days = getWeekDays(base);
      const start = new Date(days[0]);
      start.setHours(0, 0, 0, 0);
      const end = new Date(days[6]);
      end.setHours(23, 59, 59, 999);

      startTransition(async () => {
        const evts = await getCalendarEvents(
          start.toISOString(),
          end.toISOString()
        );
        setEvents(evts);
      });
    },
    []
  );

  const handleSync = () => {
    startTransition(async () => {
      await syncCalendarEvents();
      loadEvents(weekBase);
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
        createMeet: true,
      });
      setShowNewEvent(false);
      loadEvents(weekBase);
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

  const handleDeleteBooking = (id: string) => {
    startTransition(async () => {
      await deleteBookingLink(id);
    });
  };

  const handleCopyLink = (link: BookingLink) => {
    const url = `${window.location.origin}/agendar/${tenantSlug}/${link.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Group events by day
  const eventsByDay = weekDays.map((day) => ({
    day,
    events: events.filter((e) => isSameDay(new Date(e.start_at), day)),
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
              Conectado: {gcalStatus.email}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {gcalStatus.connected && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={isPending}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
              Sincronizar
            </Button>
          )}
          <Button size="sm" onClick={() => setShowNewEvent(true)} disabled={!gcalStatus.connected}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Reuniao
          </Button>
        </div>
      </div>

      {!gcalStatus.connected && (
        <Card>
          <CardContent className="flex items-center gap-4 py-6">
            <CalendarDays className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-medium">Google Calendar nao conectado</p>
              <p className="text-sm text-muted-foreground">
                Conecte sua conta Google em{" "}
                <a href="/settings?tab=integracoes" className="underline">
                  Configuracoes &gt; Integracoes
                </a>{" "}
                para usar a agenda.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Week navigator */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={prevWeek}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={goToday}>
          Hoje
        </Button>
        <Button variant="outline" size="icon" onClick={nextWeek}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <span className="ml-2 text-sm font-medium">{weekLabel}</span>
      </div>

      {/* Week grid */}
      <div className="grid grid-cols-7 gap-2">
        {eventsByDay.map(({ day, events: dayEvents }) => (
          <div
            key={day.toISOString()}
            className={`min-h-[200px] rounded-lg border p-2 ${
              isToday(day) ? "border-primary bg-primary/5" : ""
            }`}
          >
            <div className="mb-2 text-center">
              <p className="text-xs text-muted-foreground">
                {day.toLocaleDateString("pt-BR", { weekday: "short" })}
              </p>
              <p
                className={`text-lg font-semibold ${
                  isToday(day) ? "text-primary" : ""
                }`}
              >
                {day.getDate()}
              </p>
            </div>
            <div className="space-y-1">
              {dayEvents.map((evt) => (
                <div
                  key={evt.id}
                  className={`group relative rounded px-2 py-1 text-xs ${
                    evt.source === "crm"
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
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
            </div>
          </div>
        ))}
      </div>

      {/* Booking Links */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Links de Agendamento</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNewBooking(true)}
            disabled={!gcalStatus.connected}
          >
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
                <CardContent className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {link.duration_minutes} min • {link.timezone}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopyLink(link)}
                    >
                      {copiedId === link.id ? (
                        <><Check className="mr-1 h-3 w-3" />Copiado</>
                      ) : (
                        <><Copy className="mr-1 h-3 w-3" />Copiar link</>
                      )}
                    </Button>
                    <Button size="sm" variant="ghost" asChild>
                      <a
                        href={`/agendar/${tenantSlug}/${link.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="mr-1 h-3 w-3" />
                        Abrir
                      </a>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => handleDeleteBooking(link.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* New Event Sheet */}
      <Sheet open={showNewEvent} onOpenChange={setShowNewEvent}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Nova Reuniao</SheetTitle>
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
              <Label htmlFor="description">Descricao (opcional)</Label>
              <Textarea id="description" name="description" rows={3} />
            </div>
            <p className="text-xs text-muted-foreground">
              Um link do Google Meet sera criado automaticamente.
            </p>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Criando..." : "Criar Reuniao"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* New Booking Link Sheet */}
      <Sheet open={showNewBooking} onOpenChange={setShowNewBooking}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Novo Link de Agendamento</SheetTitle>
          </SheetHeader>
          <form action={handleCreateBooking} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bookingTitle">Titulo</Label>
              <Input
                id="bookingTitle"
                name="title"
                placeholder="Consulta Tributaria"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duracao (minutos)</Label>
              <Input
                id="duration"
                name="duration"
                type="number"
                defaultValue={30}
                min={15}
                max={120}
                step={15}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              O link sera gerado automaticamente. Voce pode personalizar os
              horarios disponiveis depois.
            </p>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Criando..." : "Criar Link"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
