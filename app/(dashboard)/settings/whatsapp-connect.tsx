"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  MessageSquare,
  CheckCircle2,
  QrCode,
  Smartphone,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Meta Embedded Signup with CoEx (Coexistence)
// ---------------------------------------------------------------------------
// Uses sessionInfoVersion: '3' which enables the QR Code pairing flow.
// The user scans a QR code from their WhatsApp Business App, linking the
// number to Cloud API WITHOUT disconnecting the app. Both work in parallel.
//
// Flow:
// 1. User clicks "Conectar WhatsApp"
// 2. Facebook Login popup opens with Embedded Signup
// 3. QR Code is presented
// 4. User scans QR with WhatsApp Business App on phone
// 5. Number is paired — Cloud API + App coexist
// 6. We receive auth code, exchange for token, save WABA + phone info
// ---------------------------------------------------------------------------

const META_APP_ID = "960340353406385";

interface WhatsAppConnectProps {
  configId: string; // Embedded Signup config_id from Meta Dashboard
  isConnected: boolean;
  phoneNumber?: string;
  verifiedName?: string;
  qualityRating?: string;
}

export function WhatsAppConnect({
  configId,
  isConnected,
  phoneNumber,
  verifiedName,
  qualityRating,
}: WhatsAppConnectProps) {
  const [loading, setLoading] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load Facebook JS SDK
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window as any).FB) {
      setSdkReady(true);
      return;
    }

    (window as any).fbAsyncInit = function () {
      (window as any).FB.init({
        appId: META_APP_ID,
        cookie: true,
        xfbml: false,
        version: "v21.0",
      });
      setSdkReady(true);
    };

    const script = document.createElement("script");
    script.src = "https://connect.facebook.net/pt_BR/sdk.js";
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";
    document.body.appendChild(script);
  }, []);

  const handleConnect = useCallback(() => {
    const FB = (window as any).FB;
    if (!FB) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    FB.login(
      (response: any) => {
        if (response.authResponse) {
          const { code } = response.authResponse;

          // Send code to our server to exchange and save
          fetch("/api/whatsapp/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code }),
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.success) {
                setSuccess(
                  `Conectado! Numero: ${data.display_phone_number || "configurado"}`
                );
                // Reload after short delay so user sees success message
                setTimeout(() => window.location.reload(), 2000);
              } else {
                setError(data.error || "Erro ao conectar WhatsApp.");
              }
            })
            .catch(() => {
              setError("Erro de rede ao conectar.");
            })
            .finally(() => setLoading(false));
        } else {
          setLoading(false);
          // User cancelled or closed popup
        }
      },
      {
        config_id: configId,
        response_type: "code",
        override_default_response_type: true,
        extras: {
          setup: {},
          featureType: "",
          sessionInfoVersion: "3", // CoEx: QR code pairing flow
        },
      }
    );
  }, [configId]);

  // ── Connected state ──
  if (isConnected) {
    return (
      <Card className="border-green-500/30 bg-green-950/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-600/20">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <CardTitle className="text-base">
                  WhatsApp Conectado (CoEx)
                </CardTitle>
                <CardDescription>
                  {verifiedName && (
                    <span className="font-medium text-foreground">
                      {verifiedName}
                    </span>
                  )}
                  {phoneNumber && (
                    <span className="ml-2 text-xs">({phoneNumber})</span>
                  )}
                  {qualityRating && (
                    <span className="ml-2 text-xs">
                      • Qualidade: {qualityRating}
                    </span>
                  )}
                </CardDescription>
              </div>
            </div>
            <Badge className="bg-green-600 hover:bg-green-600">Ativo</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Seu WhatsApp Business esta conectado em modo CoEx. O app no celular
            e o CRM funcionam em paralelo — todas as mensagens sao sincronizadas.
          </p>
        </CardContent>
      </Card>
    );
  }

  // ── Disconnected state ──
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-600/20">
            <MessageSquare className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <CardTitle className="text-base">
              Conectar WhatsApp Business (CoEx)
            </CardTitle>
            <CardDescription>
              Conecte seu numero sem perder o acesso no celular.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* How it works */}
        <div className="rounded-lg border border-dashed p-4 space-y-3">
          <p className="text-sm font-medium">Como funciona:</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-start gap-2">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-600/20 text-xs font-bold text-green-500">
                1
              </div>
              <p className="text-xs text-muted-foreground">
                Clique em conectar e autorize no Facebook
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-600/20 text-xs font-bold text-green-500">
                2
              </div>
              <p className="text-xs text-muted-foreground">
                Escaneie o QR Code com o WhatsApp Business no celular
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-600/20 text-xs font-bold text-green-500">
                3
              </div>
              <p className="text-xs text-muted-foreground">
                Pronto! CRM e app do celular funcionam juntos
              </p>
            </div>
          </div>
        </div>

        {/* Highlights */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 rounded-md bg-muted/30 p-2.5">
            <Smartphone className="h-4 w-4 text-green-500 shrink-0" />
            <p className="text-xs text-muted-foreground">
              App no celular continua normal
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-muted/30 p-2.5">
            <QrCode className="h-4 w-4 text-green-500 shrink-0" />
            <p className="text-xs text-muted-foreground">
              Pareamento seguro por QR Code
            </p>
          </div>
        </div>

        {/* Error / Success messages */}
        {error && (
          <div className="rounded-md bg-red-900/20 border border-red-800/30 p-3 text-sm text-red-400">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-md bg-green-900/20 border border-green-800/30 p-3 text-sm text-green-400">
            {success}
          </div>
        )}

        {/* Connect button */}
        <Button
          onClick={handleConnect}
          disabled={loading || !sdkReady || !configId}
          className="w-full bg-green-600 hover:bg-green-700"
          size="lg"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <QrCode className="mr-2 h-4 w-4" />
          )}
          Conectar com WhatsApp Business
        </Button>

        {!sdkReady && (
          <p className="text-xs text-muted-foreground text-center">
            Carregando SDK do Facebook...
          </p>
        )}

        {!configId && (
          <p className="text-xs text-yellow-500 text-center">
            Embedded Signup nao configurado. Adicione o config_id nas configuracoes.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
