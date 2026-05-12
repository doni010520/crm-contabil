"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Building2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { saveGmbConnection, updateProfileScore } from "../actions";

// ---------------------------------------------------------------------------
// Mock data for simulated OAuth flow
// ---------------------------------------------------------------------------
const MOCK_ACCOUNTS = [
  {
    id: "acc_01",
    email: "contato@escritoriocontabil.com.br",
    name: "Escritório Contábil",
  },
];

const MOCK_LOCATIONS = [
  {
    id: "loc_01",
    name: "Escritório Contábil Central",
    address: "Rua das Flores, 123 - Centro, São Paulo - SP",
    category: "Escritório de contabilidade",
    verified: true,
  },
  {
    id: "loc_02",
    name: "Escritório Contábil - Filial Zona Sul",
    address: "Av. Paulista, 456 - Bela Vista, São Paulo - SP",
    category: "Escritório de contabilidade",
    verified: false,
  },
];

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------
type Step = "connect" | "select" | "done";

export default function GmbConnectPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("connect");
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isConnecting, setIsConnecting] = useState(false);

  function handleGoogleConnect() {
    // TODO: In production, initiate Google OAuth flow
    // window.location.href = `/api/auth/google?scope=business.manage`
    setIsConnecting(true);
    setTimeout(() => {
      setIsConnecting(false);
      setStep("select");
    }, 1500);
  }

  function handleSelectLocation(locationId: string) {
    setSelectedLocation(locationId);
  }

  function handleConfirm() {
    const location = MOCK_LOCATIONS.find((l) => l.id === selectedLocation);
    if (!location) return;

    startTransition(async () => {
      await saveGmbConnection({
        office_name_gmb: location.name,
        description:
          "Escritório de contabilidade especializado em serviços contábeis, fiscais e de departamento pessoal para empresas de todos os portes.",
        primary_category: location.category,
        secondary_categories: ["Consultor tributário", "Serviço de folha de pagamento"],
        services: [
          { name: "Contabilidade empresarial" },
          { name: "Abertura de empresas" },
          { name: "Imposto de Renda" },
          { name: "Departamento pessoal" },
          { name: "Planejamento tributário" },
        ],
        google_account_id: MOCK_ACCOUNTS[0].id,
        google_location_id: location.id,
        verification_status: location.verified ? "verified" : "unverified",
        is_new_profile: !location.verified,
        auto_posts_enabled: true,
        auto_reviews_enabled: true,
        post_frequency: "weekly",
        post_tone: "formal",
      });

      setStep("done");
    });
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href="/gmb"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          Conectar Google Meu Negócio
        </h1>
        <p className="mt-1 text-muted-foreground">
          Conecte sua conta do Google para gerenciar seu perfil comercial.
        </p>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-8 max-w-md">
        {[
          { key: "connect", label: "Conectar" },
          { key: "select", label: "Selecionar" },
          { key: "done", label: "Concluído" },
        ].map((s, i) => {
          const steps: Step[] = ["connect", "select", "done"];
          const currentIdx = steps.indexOf(step);
          const stepIdx = i;
          const isCompleted = stepIdx < currentIdx;
          const isCurrent = stepIdx === currentIdx;

          return (
            <div key={s.key} className="flex items-center gap-2 flex-1">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium shrink-0 transition-colors ${
                  isCompleted
                    ? "bg-primary text-primary-foreground"
                    : isCurrent
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={`text-xs font-medium ${
                  isCurrent ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {s.label}
              </span>
              {i < 2 && (
                <div
                  className={`h-px flex-1 ${
                    isCompleted ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step: Connect */}
      {step === "connect" && (
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Conectar com Google</CardTitle>
            <CardDescription>
              Clique no botão abaixo para autorizar o acesso ao seu perfil do
              Google Meu Negócio.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-dashed p-6 text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mx-auto">
                <MapPin className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Autorização necessária</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Precisamos de permissão para acessar e gerenciar seu perfil
                  comercial no Google.
                </p>
              </div>
              <Button
                size="lg"
                className="gap-2"
                onClick={handleGoogleConnect}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MapPin className="h-4 w-4" />
                )}
                {isConnecting ? "Conectando..." : "Conectar com Google"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Select location */}
      {step === "select" && (
        <div className="max-w-lg space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Selecione o estabelecimento</CardTitle>
              <CardDescription>
                Conta conectada: {MOCK_ACCOUNTS[0].email}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {MOCK_LOCATIONS.map((location) => (
                <button
                  key={location.id}
                  type="button"
                  className={`w-full text-left rounded-lg border p-4 transition-colors ${
                    selectedLocation === location.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => handleSelectLocation(location.id)}
                >
                  <div className="flex items-start gap-3">
                    <Building2 className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {location.name}
                        </span>
                        {location.verified && (
                          <Badge variant="default" className="text-[10px]">
                            Verificado
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {location.address}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {location.category}
                      </p>
                    </div>
                    <div
                      className={`h-5 w-5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                        selectedLocation === location.id
                          ? "border-primary bg-primary"
                          : "border-muted-foreground/30"
                      }`}
                    >
                      {selectedLocation === location.id && (
                        <Check className="h-3 w-3 text-primary-foreground" />
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setStep("connect")}>
              Voltar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!selectedLocation || isPending}
              className="gap-2"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              {isPending ? "Conectando..." : "Confirmar"}
            </Button>
          </div>
        </div>
      )}

      {/* Step: Done */}
      {step === "done" && (
        <Card className="max-w-lg">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mx-auto">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Perfil conectado!</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Seu perfil do Google Meu Negócio foi conectado com sucesso.
                  Agora você pode otimizar seu perfil e gerenciar posts e
                  avaliações.
                </p>
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <Link href="/gmb/profile">
                  <Button className="w-full gap-2">
                    <Sparkles className="h-4 w-4" />
                    Otimizar perfil com IA
                  </Button>
                </Link>
                <Link href="/gmb">
                  <Button variant="outline" className="w-full">
                    Ir para o painel
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
