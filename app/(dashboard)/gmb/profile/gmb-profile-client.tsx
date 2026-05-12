"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  Save,
  Check,
  X,
  Plus,
  Trash2,
  TrendingUp,
} from "lucide-react";
import {
  saveGmbConnection,
  generateAiContent,
  updateProfileScore,
} from "../actions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Connection {
  id: string;
  office_name_gmb: string | null;
  description: string | null;
  primary_category: string | null;
  secondary_categories: string[] | null;
  services: { name: string }[] | null;
  profile_score: number;
  verification_status: string;
  auto_posts_enabled: boolean;
  auto_reviews_enabled: boolean;
  post_frequency: string;
  post_tone: string;
}

// ---------------------------------------------------------------------------
// Profile Score Gauge
// ---------------------------------------------------------------------------
function ProfileScoreGauge({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 80
      ? "text-green-500"
      : score >= 50
        ? "text-yellow-500"
        : "text-red-500";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          strokeWidth="8"
          className="stroke-muted"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${color} transition-all duration-700 ease-out`}
          style={{ stroke: "currentColor" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-xl font-bold">{score}</span>
        <span className="text-[10px] text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Score Breakdown
// ---------------------------------------------------------------------------
function ScoreBreakdown({ connection }: { connection: Connection }) {
  const items = [
    {
      label: "Nome do escritório",
      done: !!connection.office_name_gmb,
      points: 15,
    },
    {
      label: "Descrição completa (50+ caracteres)",
      done: !!connection.description && connection.description.length > 50,
      points: 20,
    },
    {
      label: "Categoria principal",
      done: !!connection.primary_category,
      points: 15,
    },
    {
      label: "Categorias secundárias",
      done:
        !!connection.secondary_categories &&
        connection.secondary_categories.length > 0,
      points: 10,
    },
    {
      label: "Serviços cadastrados",
      done:
        !!connection.services && (connection.services as unknown[]).length > 0,
      points: 15,
    },
    {
      label: "Perfil verificado",
      done: connection.verification_status === "verified",
      points: 15,
    },
    {
      label: "Posts publicados",
      done: false, // We don't check this here for simplicity
      points: 10,
    },
  ];

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2 text-sm">
          <div
            className={`h-4 w-4 rounded-full flex items-center justify-center ${
              item.done ? "bg-green-100 text-green-600" : "bg-muted text-muted-foreground"
            }`}
          >
            {item.done ? (
              <Check className="h-3 w-3" />
            ) : (
              <span className="text-[10px]">{item.points}</span>
            )}
          </div>
          <span className={item.done ? "text-muted-foreground line-through" : ""}>
            {item.label}
          </span>
          <span className="text-xs text-muted-foreground ml-auto">
            +{item.points} pts
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Category Options
// ---------------------------------------------------------------------------
const CATEGORY_OPTIONS = [
  "Escritório de contabilidade",
  "Consultor tributário",
  "Consultor financeiro",
  "Serviço de folha de pagamento",
  "Assessoria empresarial",
  "Consultor empresarial",
  "Escritório de advocacia",
  "Serviço de auditoria",
];

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export function GmbProfileClient({ connection }: { connection: Connection }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [aiLoading, setAiLoading] = useState<string | null>(null);

  // Editable state
  const [officeName, setOfficeName] = useState(connection.office_name_gmb || "");
  const [description, setDescription] = useState(connection.description || "");
  const [primaryCategory, setPrimaryCategory] = useState(
    connection.primary_category || ""
  );
  const [secondaryCategories, setSecondaryCategories] = useState<string[]>(
    connection.secondary_categories || []
  );
  const [services, setServices] = useState<string[]>(
    (connection.services || []).map((s) => s.name)
  );
  const [newService, setNewService] = useState("");

  // AI preview state
  const [aiPreview, setAiPreview] = useState<{
    field: string;
    content: string;
  } | null>(null);

  async function handleGenerateDescription() {
    setAiLoading("description");
    try {
      const content = await generateAiContent("description", {
        officeName: officeName || "Escritório Contábil",
        category: primaryCategory,
      });
      setAiPreview({ field: "description", content });
    } finally {
      setAiLoading(null);
    }
  }

  function handleAcceptAi() {
    if (aiPreview?.field === "description") {
      setDescription(aiPreview.content);
    }
    setAiPreview(null);
  }

  function handleRejectAi() {
    setAiPreview(null);
  }

  function addSecondaryCategory(category: string) {
    if (category && !secondaryCategories.includes(category)) {
      setSecondaryCategories([...secondaryCategories, category]);
    }
  }

  function removeSecondaryCategory(category: string) {
    setSecondaryCategories(secondaryCategories.filter((c) => c !== category));
  }

  function addService() {
    if (newService.trim() && !services.includes(newService.trim())) {
      setServices([...services, newService.trim()]);
      setNewService("");
    }
  }

  function removeService(service: string) {
    setServices(services.filter((s) => s !== service));
  }

  function handleSave() {
    startTransition(async () => {
      await saveGmbConnection({
        office_name_gmb: officeName,
        description,
        primary_category: primaryCategory,
        secondary_categories: secondaryCategories,
        services: services.map((s) => ({ name: s })),
      });
      await updateProfileScore(connection.id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/gmb"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar ao painel
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Perfil do Google Meu Negócio
            </h1>
            <p className="mt-1 text-muted-foreground">
              Gerencie e otimize as informações do seu perfil comercial.
            </p>
          </div>
          <Button onClick={handleSave} disabled={isPending} className="gap-2">
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Salvar alterações
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Score Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Score do Perfil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <ProfileScoreGauge score={connection.profile_score} />
            </div>
            <Separator />
            <ScoreBreakdown connection={connection} />
          </CardContent>
        </Card>

        {/* Profile Fields */}
        <div className="lg:col-span-2 space-y-6">
          {/* Name */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Nome do Escritório</CardTitle>
              <CardDescription>
                Nome que aparece no Google Maps e na Busca
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                value={officeName}
                onChange={(e) => setOfficeName(e.target.value)}
                placeholder="Nome do escritório"
              />
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-base">Descrição</CardTitle>
                <CardDescription>
                  Descreva seu escritório e os serviços oferecidos
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 shrink-0"
                onClick={handleGenerateDescription}
                disabled={aiLoading === "description"}
              >
                {aiLoading === "description" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                Gerar com IA
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* AI Preview */}
              {aiPreview?.field === "description" && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">
                      Sugestão gerada por IA
                    </span>
                  </div>
                  <p className="text-sm">{aiPreview.content}</p>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAcceptAi} className="gap-1">
                      <Check className="h-3.5 w-3.5" />
                      Usar esta descrição
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleRejectAi}
                      className="gap-1"
                    >
                      <X className="h-3.5 w-3.5" />
                      Descartar
                    </Button>
                  </div>
                </div>
              )}
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva seu escritório..."
                rows={5}
              />
              <p className="text-xs text-muted-foreground">
                {description.length} caracteres
                {description.length < 50 && description.length > 0 && (
                  <span className="text-yellow-600">
                    {" "}
                    (mínimo recomendado: 50)
                  </span>
                )}
              </p>
            </CardContent>
          </Card>

          {/* Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Categorias</CardTitle>
              <CardDescription>
                Categoria principal e categorias secundárias do perfil
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Categoria principal</Label>
                <Select value={primaryCategory} onValueChange={setPrimaryCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria principal" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Categorias secundárias</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {secondaryCategories.map((cat) => (
                    <Badge key={cat} variant="secondary" className="gap-1">
                      {cat}
                      <button
                        type="button"
                        onClick={() => removeSecondaryCategory(cat)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <Select onValueChange={addSecondaryCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Adicionar categoria secundária" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.filter(
                      (cat) =>
                        cat !== primaryCategory &&
                        !secondaryCategories.includes(cat)
                    ).map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Services */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Serviços</CardTitle>
              <CardDescription>
                Liste os serviços oferecidos pelo escritório
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {services.map((service) => (
                  <Badge key={service} variant="outline" className="gap-1 py-1.5">
                    {service}
                    <button
                      type="button"
                      onClick={() => removeService(service)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newService}
                  onChange={(e) => setNewService(e.target.value)}
                  placeholder="Nome do serviço"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addService();
                    }
                  }}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={addService}
                  disabled={!newService.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
