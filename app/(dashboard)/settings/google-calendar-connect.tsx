"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, ExternalLink, Unplug } from "lucide-react";

interface GoogleCalendarConnectProps {
  connected: boolean;
  email?: string;
}

export function GoogleCalendarConnect({
  connected,
  email,
}: GoogleCalendarConnectProps) {
  const [disconnecting, setDisconnecting] = useState(false);

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await fetch("/api/google/disconnect", { method: "POST" });
      window.location.reload();
    } catch {
      setDisconnecting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <CalendarDays className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-base">Google Calendar</CardTitle>
              <CardDescription>
                Agenda, reunioes com Google Meet e link de agendamento publico
              </CardDescription>
            </div>
          </div>
          <Badge variant={connected ? "default" : "secondary"}>
            {connected ? "Conectado" : "Desconectado"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {connected ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Conta conectada: <span className="font-medium text-foreground">{email}</span>
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" asChild>
                <a href="/calendar">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Abrir Agenda
                </a>
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-destructive"
                onClick={handleDisconnect}
                disabled={disconnecting}
              >
                <Unplug className="mr-2 h-4 w-4" />
                {disconnecting ? "Desconectando..." : "Desconectar"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Conecte sua conta Google para sincronizar sua agenda, criar reunioes
              com Google Meet automatico e gerar links de agendamento para seus
              clientes.
            </p>
            <Button asChild>
              <a href="/api/google/authorize">
                <ExternalLink className="mr-2 h-4 w-4" />
                Conectar Google Calendar
              </a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
