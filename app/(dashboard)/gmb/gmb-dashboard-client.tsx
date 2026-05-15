"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  FileText,
  Star,
  TrendingUp,
  Sparkles,
  MessageSquare,
  Calendar,
  ArrowRight,
  Zap,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { disconnectGmb } from "./actions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface DashboardData {
  connection: {
    id: string;
    office_name_gmb: string | null;
    description: string | null;
    primary_category: string | null;
    profile_score: number;
    verification_status: string;
    auto_reviews_enabled: boolean;
    post_tone: string;
    last_synced_at: string | null;
  } | null;
  posts: {
    id: string;
    content: string;
    status: string;
    scheduled_for: string | null;
    published_at: string | null;
    created_at: string;
  }[];
  reviews: {
    id: string;
    reviewer_name: string;
    rating: number;
    comment: string | null;
    reply: string | null;
    reply_status: string;
    review_date: string;
  }[];
  log: {
    id: string;
    action: string;
    details: Record<string, unknown>;
    created_at: string;
  }[];
  stats: {
    postsThisMonth: number;
    totalReviews: number;
    avgRating: number;
    profileScore: number;
  };
  nextScheduled: {
    id: string;
    content: string;
    scheduled_for: string | null;
  } | null;
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

function formatDateTime(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
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
      <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
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
        <span className="text-2xl font-bold">{score}</span>
        <span className="text-[10px] text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

const verificationLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  verified: { label: "Verificado", variant: "default" },
  pending: { label: "Pendente", variant: "secondary" },
  unverified: { label: "Não verificado", variant: "outline" },
};

const replyStatusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  replied: { label: "Respondida", variant: "default" },
  pending: { label: "Pendente", variant: "secondary" },
  skipped: { label: "Ignorada", variant: "outline" },
};

// ---------------------------------------------------------------------------
// Not Connected View
// ---------------------------------------------------------------------------
function NotConnectedView() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-6">
        <MapPin className="h-10 w-10 text-primary" />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight mb-2">
        Google Meu Negócio
      </h1>
      <p className="text-muted-foreground text-center max-w-md mb-8">
        Conecte seu perfil do Google Meu Negócio para gerenciar avaliações,
        publicar posts e otimizar seu perfil com inteligência artificial.
      </p>

      <div className="grid gap-4 sm:grid-cols-3 max-w-2xl mb-8">
        {[
          {
            icon: TrendingUp,
            title: "Otimize seu perfil",
            description:
              "IA analisa e melhora título, descrição e categorias para melhor posicionamento no Google.",
          },
          {
            icon: FileText,
            title: "Posts automáticos",
            description:
              "Gere e agende posts com conteúdo relevante gerado por inteligência artificial.",
          },
          {
            icon: MessageSquare,
            title: "Gerencie avaliações",
            description:
              "Responda avaliações rapidamente com sugestões inteligentes de respostas.",
          },
        ].map((feature) => (
          <Card key={feature.title} className="text-center">
            <CardContent className="pt-6">
              <feature.icon className="h-8 w-8 mx-auto mb-3 text-primary" />
              <h3 className="font-medium text-sm mb-1">{feature.title}</h3>
              <p className="text-xs text-muted-foreground">
                {feature.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Link href="/gmb/connect">
        <Button size="lg" className="gap-2">
          <MapPin className="h-4 w-4" />
          Conectar Google Meu Negócio
        </Button>
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Connected Dashboard
// ---------------------------------------------------------------------------
function ConnectedDashboard({ dashboard }: { dashboard: DashboardData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { connection, stats, reviews, nextScheduled } = dashboard;

  if (!connection) return null;

  const verification = verificationLabels[connection.verification_status] ?? verificationLabels.unverified;

  function handleDisconnect() {
    if (!confirm("Tem certeza que deseja desconectar o Google Meu Negócio?")) return;
    startTransition(async () => {
      await disconnectGmb();
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Google Meu Negócio
          </h1>
          <p className="mt-1 text-muted-foreground">
            {connection.office_name_gmb || "Perfil conectado"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={verification.variant}>{verification.label}</Badge>
          <Button variant="outline" size="sm" onClick={handleDisconnect} disabled={isPending}>
            Desconectar
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-sm font-medium">
              Posts este mês
            </CardDescription>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.postsThisMonth}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-sm font-medium">
              Avaliações
            </CardDescription>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReviews}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-sm font-medium">
              Média de estrelas
            </CardDescription>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">
                {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "—"}
              </span>
              {stats.avgRating > 0 && <StarRating rating={Math.round(stats.avgRating)} />}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-sm font-medium">
              Score do perfil
            </CardDescription>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.profileScore}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Score Gauge */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Score do Perfil</CardTitle>
            <CardDescription>Nível de completude do seu perfil</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <ProfileScoreGauge score={stats.profileScore} />
            <Link href="/gmb/profile">
              <Button variant="outline" size="sm" className="gap-2">
                <Sparkles className="h-3.5 w-3.5" />
                Otimizar perfil
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Next Scheduled Post */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Próximo Post Agendado</CardTitle>
            <CardDescription>Post programado para publicação</CardDescription>
          </CardHeader>
          <CardContent>
            {nextScheduled ? (
              <div className="space-y-3">
                <p className="text-sm line-clamp-3">{nextScheduled.content}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDateTime(nextScheduled.scheduled_for)}
                </div>
                <Link href="/gmb/posts">
                  <Button variant="outline" size="sm" className="gap-2 w-full">
                    Ver posts
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-4">
                <Clock className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground text-center">
                  Nenhum post agendado
                </p>
                <Link href="/gmb/posts">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Sparkles className="h-3.5 w-3.5" />
                    Gerar post
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ações Rápidas</CardTitle>
            <CardDescription>Atalhos para as ações principais</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/gmb/profile" className="block">
              <Button variant="outline" className="w-full justify-start gap-3">
                <Zap className="h-4 w-4 text-primary" />
                Otimizar perfil
              </Button>
            </Link>
            <Link href="/gmb/posts" className="block">
              <Button variant="outline" className="w-full justify-start gap-3">
                <Sparkles className="h-4 w-4 text-primary" />
                Gerar post com IA
              </Button>
            </Link>
            <Link href="/gmb/reviews" className="block">
              <Button variant="outline" className="w-full justify-start gap-3">
                <MessageSquare className="h-4 w-4 text-primary" />
                Ver avaliações
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Reviews */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Avaliações Recentes</CardTitle>
            <CardDescription>Últimas avaliações recebidas</CardDescription>
          </div>
          <Link href="/gmb/reviews">
            <Button variant="ghost" size="sm" className="gap-1">
              Ver todas <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Nenhuma avaliação encontrada ainda.
            </p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => {
                const status = replyStatusLabels[review.reply_status] ?? replyStatusLabels.pending;
                return (
                  <div key={review.id} className="flex items-start gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-medium shrink-0">
                      {review.reviewer_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">
                          {review.reviewer_name}
                        </span>
                        <StarRating rating={review.rating} />
                        <Badge variant={status.variant} className="text-[10px]">
                          {status.label}
                        </Badge>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {review.comment}
                        </p>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatDate(review.review_date)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
export function GmbDashboardClient({ dashboard }: { dashboard: DashboardData }) {
  if (!dashboard.connection) {
    return <NotConnectedView />;
  }
  return <ConnectedDashboard dashboard={dashboard} />;
}
