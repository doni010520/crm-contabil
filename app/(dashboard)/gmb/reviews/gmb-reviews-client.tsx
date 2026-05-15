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
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  Send,
  Star,
  MessageSquare,
  Check,
  X,
} from "lucide-react";
import {
  replyToReview,
  generateAiContent,
  saveGmbConnection,
} from "../actions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Review {
  id: string;
  google_review_id: string;
  reviewer_name: string;
  rating: number;
  comment: string | null;
  reply: string | null;
  reply_status: string;
  replied_at: string | null;
  replied_by: string | null;
  review_date: string;
}

interface Connection {
  id: string;
  office_name_gmb: string | null;
  auto_reviews_enabled: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating
              ? "fill-yellow-400 text-yellow-400"
              : "fill-none text-muted-foreground/30"
          }`}
        />
      ))}
    </span>
  );
}

const REPLY_STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  replied: { label: "Respondida", variant: "default" },
  pending: { label: "Pendente", variant: "secondary" },
  skipped: { label: "Ignorada", variant: "outline" },
};

const FILTER_TABS = [
  { value: "all", label: "Todas" },
  { value: "positive", label: "Positivas (4-5)" },
  { value: "negative", label: "Negativas (1-3)" },
  { value: "pending", label: "Sem resposta" },
];

// ---------------------------------------------------------------------------
// Review Card
// ---------------------------------------------------------------------------
function ReviewCard({
  review,
  officeName,
}: {
  review: Review;
  officeName: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState(review.reply || "");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPreview, setAiPreview] = useState<string | null>(null);

  const statusConf =
    REPLY_STATUS_CONFIG[review.reply_status] ?? REPLY_STATUS_CONFIG.pending;

  async function handleGenerateReply() {
    setAiLoading(true);
    try {
      const content = await generateAiContent("review_reply", {
        officeName,
        rating: review.rating,
        reviewComment: review.comment || undefined,
      });
      setAiPreview(content);
    } finally {
      setAiLoading(false);
    }
  }

  function handleAcceptAi() {
    if (aiPreview) {
      setReplyText(aiPreview);
      setAiPreview(null);
      setShowReply(true);
    }
  }

  function handleRejectAi() {
    setAiPreview(null);
  }

  function handleSendReply(repliedBy: "manual" | "ai") {
    if (!replyText.trim()) return;
    startTransition(async () => {
      await replyToReview(review.id, replyText, repliedBy);
      setShowReply(false);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-semibold shrink-0">
            {review.reviewer_name.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            {/* Header */}
            <div className="flex items-center flex-wrap gap-2">
              <span className="font-medium text-sm">{review.reviewer_name}</span>
              <StarRating rating={review.rating} />
              <Badge variant={statusConf.variant} className="text-[10px]">
                {statusConf.label}
              </Badge>
              <span className="text-xs text-muted-foreground ml-auto">
                {formatDate(review.review_date)}
              </span>
            </div>

            {/* Comment */}
            {review.comment && (
              <p className="text-sm text-muted-foreground">{review.comment}</p>
            )}

            {/* Existing reply */}
            {review.reply && review.reply_status === "replied" && (
              <div className="rounded-lg bg-muted/50 p-3 mt-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium">Sua resposta</span>
                  {review.replied_by && (
                    <Badge variant="outline" className="text-[10px]">
                      {review.replied_by === "ai" ? "IA" : "Manual"}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {formatDate(review.replied_at)}
                  </span>
                </div>
                <p className="text-sm">{review.reply}</p>
              </div>
            )}

            {/* Reply Actions */}
            {review.reply_status === "pending" && !showReply && (
              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => setShowReply(true)}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Responder
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={handleGenerateReply}
                  disabled={aiLoading}
                >
                  {aiLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  Responder com IA
                </Button>
              </div>
            )}

            {/* AI Preview */}
            {aiPreview && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2 mt-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-medium">
                    Resposta sugerida por IA
                  </span>
                </div>
                <p className="text-sm">{aiPreview}</p>
                <p className="text-xs text-muted-foreground">
                  Revise a sugestão antes de aplicar. Você poderá editar o
                  texto e só depois enviar para o Google.
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleAcceptAi}
                    className="gap-1"
                  >
                    <Check className="h-3 w-3" />
                    Usar e editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleGenerateReply}
                    disabled={aiLoading}
                    className="gap-1"
                  >
                    {aiLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="h-3 w-3" />
                    )}
                    Gerar outra
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleRejectAi}
                    className="gap-1"
                  >
                    <X className="h-3 w-3" />
                    Descartar
                  </Button>
                </div>
              </div>
            )}

            {/* Manual Reply Form */}
            {showReply && (
              <div className="space-y-2 mt-2">
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Escreva sua resposta..."
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleSendReply("manual")}
                    disabled={isPending || !replyText.trim()}
                    className="gap-1"
                  >
                    {isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    Enviar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={handleGenerateReply}
                    disabled={aiLoading}
                  >
                    {aiLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    Sugerir com IA
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowReply(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export function GmbReviewsClient({
  reviews,
  filter,
  connection,
}: {
  reviews: Review[];
  filter: string;
  connection: Connection;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [autoReviewsEnabled, setAutoReviewsEnabled] = useState(
    connection.auto_reviews_enabled
  );

  function handleSaveAutomation() {
    startTransition(async () => {
      await saveGmbConnection({
        office_name_gmb: connection.office_name_gmb || "",
        auto_reviews_enabled: autoReviewsEnabled,
      });
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
        <h1 className="text-2xl font-semibold tracking-tight">Avaliações</h1>
        <p className="mt-1 text-muted-foreground">
          Gerencie e responda às avaliações do Google Meu Negócio.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              filter === tab.value
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => {
              const params = new URLSearchParams();
              if (tab.value !== "all") params.set("filter", tab.value);
              router.push(
                `/gmb/reviews${params.toString() ? `?${params}` : ""}`
              );
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">
              Nenhuma avaliação encontrada.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              officeName={connection.office_name_gmb || "Escritório Contábil"}
            />
          ))}
        </div>
      )}

      {/* Automation Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Automação de Respostas</CardTitle>
          <CardDescription>
            Configure respostas automáticas para avaliações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Respostas automáticas</p>
              <p className="text-xs text-muted-foreground">
                Responder automaticamente avaliações com IA
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={autoReviewsEnabled}
              onClick={() => setAutoReviewsEnabled(!autoReviewsEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                autoReviewsEnabled ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoReviewsEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {autoReviewsEnabled && (
            <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
              Quando ativado, respostas personalizadas serão geradas por IA para
              novas avaliações. Avaliações negativas (1-3 estrelas) sempre
              requerem revisão manual antes do envio.
            </p>
          )}

          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveAutomation}
              disabled={isPending}
            >
              Salvar configurações
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
