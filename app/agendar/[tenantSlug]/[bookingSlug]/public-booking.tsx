"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Video,
} from "lucide-react";

interface BookingLinkData {
  id: string;
  title: string;
  description: string | null;
  durationMinutes: number;
  timezone: string;
  maxDaysAhead: number;
  availability: Record<string, { start: string; end: string }[]>;
}

const DAY_NAMES = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
const MONTH_LABELS = [
  "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export function PublicBooking({
  tenantName,
  bookingLink,
}: {
  tenantName: string;
  bookingLink: BookingLinkData;
}) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<{ start: string; end: string }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [step, setStep] = useState<"date" | "time" | "form" | "confirmed">("date");
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<{
    meetLink: string | null;
    date: string;
    startTime: string;
    endTime: string;
  } | null>(null);
  const [calMonth, setCalMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  // Calendar grid
  const firstDayOfMonth = new Date(calMonth.year, calMonth.month, 1);
  const lastDayOfMonth = new Date(calMonth.year, calMonth.month + 1, 0);
  const startDow = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = new Date(today.getTime() + bookingLink.maxDaysAhead * 86400000);

  function isDayAvailable(year: number, month: number, day: number): boolean {
    const d = new Date(year, month, day);
    if (d < today || d > maxDate) return false;
    const dayName = DAY_NAMES[d.getDay()];
    const windows = bookingLink.availability[dayName];
    return !!windows && windows.length > 0;
  }

  async function selectDate(day: number) {
    const dateStr = `${calMonth.year}-${String(calMonth.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDate(dateStr);
    setSelectedSlot(null);
    setLoadingSlots(true);

    try {
      const res = await fetch(
        `/api/public/availability?bookingLinkId=${bookingLink.id}&date=${dateStr}`
      );
      const data = await res.json();
      setSlots(data.slots ?? []);
      setStep("time");
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }

  function selectSlot(start: string) {
    setSelectedSlot(start);
    setStep("form");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedDate || !selectedSlot) return;

    setSubmitting(true);
    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/public/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingLinkId: bookingLink.id,
          date: selectedDate,
          startTime: selectedSlot,
          name: form.get("name"),
          email: form.get("email") || null,
          phone: form.get("phone"),
          notes: form.get("notes") || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setConfirmation(data);
        setStep("confirmed");
      }
    } catch {
      // Error handling
    } finally {
      setSubmitting(false);
    }
  }

  const prevMonth = () => {
    setCalMonth((prev) => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 };
      return { ...prev, month: prev.month - 1 };
    });
  };

  const nextMonth = () => {
    setCalMonth((prev) => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 };
      return { ...prev, month: prev.month + 1 };
    });
  };

  // Confirmed state
  if (step === "confirmed" && confirmation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg text-center space-y-4">
          <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
          <h1 className="text-2xl font-bold text-green-700">Reuniao Agendada!</h1>
          <div className="space-y-2 text-sm text-gray-600">
            <p className="flex items-center justify-center gap-2">
              <CalendarDays className="h-4 w-4" />
              {new Date(confirmation.date + "T12:00:00").toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "2-digit",
                month: "long",
              })}
            </p>
            <p className="flex items-center justify-center gap-2">
              <Clock className="h-4 w-4" />
              {confirmation.startTime} - {confirmation.endTime}
            </p>
          </div>
          {confirmation.meetLink && (
            <a
              href={confirmation.meetLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700"
            >
              <Video className="h-5 w-5" />
              Entrar no Google Meet
            </a>
          )}
          <p className="text-xs text-gray-400">
            Voce recebera um convite por email com os detalhes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-lg overflow-hidden">
        <div className="grid md:grid-cols-5">
          {/* Left info panel */}
          <div className="md:col-span-2 bg-gray-50 p-6 space-y-4">
            <div>
              <p className="text-sm text-gray-500">{tenantName}</p>
              <h1 className="text-xl font-bold">{bookingLink.title}</h1>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>{bookingLink.durationMinutes} minutos</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Video className="h-4 w-4" />
              <span>Google Meet</span>
            </div>
            {bookingLink.description && (
              <p className="text-sm text-gray-500">{bookingLink.description}</p>
            )}
            {selectedDate && (
              <div className="rounded-lg bg-white p-3 text-sm">
                <p className="font-medium">
                  {new Date(selectedDate + "T12:00:00").toLocaleDateString("pt-BR", {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                  })}
                </p>
                {selectedSlot && (
                  <p className="text-gray-500">{selectedSlot}</p>
                )}
              </div>
            )}
          </div>

          {/* Right content panel */}
          <div className="md:col-span-3 p-6">
            {step === "date" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="font-medium">
                    {MONTH_LABELS[calMonth.month]} {calMonth.year}
                  </span>
                  <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center">
                  {DAY_LABELS.map((d) => (
                    <div key={d} className="text-xs font-medium text-gray-400 py-2">
                      {d}
                    </div>
                  ))}
                  {Array.from({ length: startDow }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const available = isDayAvailable(calMonth.year, calMonth.month, day);
                    const dateStr = `${calMonth.year}-${String(calMonth.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const isSelected = selectedDate === dateStr;

                    return (
                      <button
                        key={day}
                        disabled={!available}
                        onClick={() => selectDate(day)}
                        className={`rounded-full py-2 text-sm transition-colors ${
                          isSelected
                            ? "bg-blue-600 text-white"
                            : available
                              ? "hover:bg-blue-100 text-gray-900 font-medium"
                              : "text-gray-300 cursor-not-allowed"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === "time" && (
              <div>
                <button
                  onClick={() => setStep("date")}
                  className="mb-4 flex items-center gap-1 text-sm text-blue-600 hover:underline"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Voltar
                </button>
                <h3 className="mb-3 font-medium">Horarios disponiveis</h3>
                {loadingSlots ? (
                  <p className="text-sm text-gray-500">Carregando horarios...</p>
                ) : slots.length === 0 ? (
                  <p className="text-sm text-gray-500">Nenhum horario disponivel neste dia.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto">
                    {slots.map((slot) => (
                      <button
                        key={slot.start}
                        onClick={() => selectSlot(slot.start)}
                        className={`rounded-lg border py-2 text-sm font-medium transition-colors ${
                          selectedSlot === slot.start
                            ? "border-blue-600 bg-blue-600 text-white"
                            : "border-gray-200 hover:border-blue-400 hover:bg-blue-50"
                        }`}
                      >
                        {slot.start}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {step === "form" && (
              <div>
                <button
                  onClick={() => setStep("time")}
                  className="mb-4 flex items-center gap-1 text-sm text-blue-600 hover:underline"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Voltar
                </button>
                <h3 className="mb-3 font-medium">Seus dados</h3>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <Label htmlFor="name">Nome *</Label>
                    <Input id="name" name="name" required placeholder="Seu nome" />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefone *</Label>
                    <Input id="phone" name="phone" required placeholder="(11) 99999-9999" />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" placeholder="seu@email.com" />
                  </div>
                  <div>
                    <Label htmlFor="notes">Observacoes</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      rows={2}
                      placeholder="Sobre o que gostaria de conversar?"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? "Agendando..." : "Confirmar Agendamento"}
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
