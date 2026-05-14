"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageSquare, CheckCircle2, ExternalLink } from "lucide-react";

// ---------------------------------------------------------------------------
// Meta Embedded Signup Component for WhatsApp CoEx
// ---------------------------------------------------------------------------
// This component handles the Facebook Login popup flow that allows each tenant
// to connect their own WhatsApp Business number via Meta's Embedded Signup.
//
// Flow:
// 1. User clicks "Conectar WhatsApp"
// 2. Facebook Login popup opens (requires FB JS SDK loaded)
// 3. User authorizes the app and selects their WhatsApp number
// 4. We receive an auth code in the callback
// 5. Server exchanges code for access_token
// 6. Server fetches WABA ID + phone_number_id
// 7. Saved to tenant record
// ---------------------------------------------------------------------------

const META_APP_ID = "960340353406385";
const META_CONFIG_ID = ""; // Will be set when Embedded Signup config is created in Meta
const REDIRECT_URI = typeof window !== "undefined"
  ? `${window.location.origin}/api/whatsapp/callback`
  : "https://crm-contabil.72.60.10.92.sslip.io/api/whatsapp/callback";

interface WhatsAppConnectProps {
  isConnected: boolean;
  phoneNumber?: string;
  verifiedName?: string;
}

export function WhatsAppConnect({ isConnected, phoneNumber, verifiedName }: WhatsAppConnectProps) {
  const [loading, setLoading] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);

  // Load Facebook JS SDK
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window as any).FB) {
      setSdkReady(true);
      return;
    }

    // Load SDK async
    const script = document.createElement("script");
    script.src = "https://connect.facebook.net/pt_BR/sdk.js";
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";
    document.body.appendChild(script);

    (window as any).fbAsyncInit = function () {
      (window as any).FB.init({
        appId: META_APP_ID,
        cookie: true,
        xfbml: false,
        version: "v21.0",
      });
      setSdkReady(true);
    };

    return () => {
      // Cleanup not strictly necessary for SDK
    };
  }, []);

  const handleConnect = useCallback(() => {
    if (!(window as any).FB) return;
    setLoading(true);

    // Embedded Signup flow
    (window as any).FB.login(
      (response: any) => {
        if (response.authResponse) {
          const { code, accessToken } = response.authResponse;
          // Send to our server to exchange and save
          fetch("/api/whatsapp/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              code: code || null,
              accessToken: accessToken || null,
            }),
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.success) {
                window.location.reload();
              } else {
                alert(data.error || "Erro ao conectar WhatsApp.");
              }
            })
            .catch(() => {
              alert("Erro de rede ao conectar.");
            })
            .finally(() => setLoading(false));
        } else {
          setLoading(false);
        }
      },
      {
        config_id: META_CONFIG_ID || undefined,
        response_type: "code",
        override_default_response_type: true,
        scope: "whatsapp_business_management,whatsapp_business_messaging",
        extras: {
          feature: "whatsapp_embedded_signup",
          sessionInfoVersion: 2,
        },
      }
    );
  }, []);

  if (isConnected) {
    return (
      <Card className="border-green-200 dark:border-green-800/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-base">WhatsApp Conectado</CardTitle>
                <CardDescription>
                  {verifiedName && <span className="font-medium">{verifiedName}</span>}
                  {phoneNumber && <span className="ml-2 text-xs">({phoneNumber})</span>}
                </CardDescription>
              </div>
            </div>
            <Badge className="bg-green-600">Ativo</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Seu WhatsApp Business esta conectado e pronto para enviar e receber mensagens pelo CRM.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
            <MessageSquare className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <CardTitle className="text-base">Conectar WhatsApp Business</CardTitle>
            <CardDescription>
              Conecte seu numero do WhatsApp Business para gerenciar conversas pelo CRM.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md bg-muted/50 p-4 space-y-2">
          <p className="text-sm font-medium">Como funciona:</p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Voce continuara usando o app WhatsApp Business normalmente (CoEx)</li>
            <li>O CRM recebera e enviara mensagens em paralelo</li>
            <li>Historico completo de conversas no CRM</li>
            <li>Atribuicao de conversas para membros da equipe</li>
          </ul>
        </div>

        <Button
          onClick={handleConnect}
          disabled={loading || !sdkReady}
          className="w-full bg-green-600 hover:bg-green-700"
          size="lg"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <MessageSquare className="mr-2 h-4 w-4" />
          )}
          Conectar com WhatsApp Business
        </Button>

        {!sdkReady && (
          <p className="text-xs text-muted-foreground text-center">
            Carregando SDK do Facebook...
          </p>
        )}

        <p className="text-xs text-muted-foreground text-center">
          Voce sera redirecionado para o Facebook para autorizar a conexao.
          <br />
          <a
            href="https://developers.facebook.com/docs/whatsapp/embedded-signup"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            Saiba mais sobre Embedded Signup <ExternalLink className="h-3 w-3" />
          </a>
        </p>
      </CardContent>
    </Card>
  );
}
