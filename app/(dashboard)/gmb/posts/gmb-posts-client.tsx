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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Plus,
  Sparkles,
  Loader2,
  Pencil,
  Trash2,
  Send,
  Calendar,
  FileText,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  createGmbPost,
  updateGmbPost,
  deleteGmbPost,
  publishGmbPost,
  generateAiContent,
  saveGmbConnection,
} from "../actions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Post {
  id: string;
  content: string;
  cta_type: string | null;
  cta_url: string | null;
  status: string;
  scheduled_for: string | null;
  published_at: string | null;
  generated_by_ai: boolean;
  created_at: string;
}

interface Connection {
  id: string;
  office_name_gmb: string | null;
  post_tone: string;
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
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  draft: { label: "Rascunho", variant: "secondary" },
  scheduled: { label: "Agendado", variant: "default" },
  published: { label: "Publicado", variant: "outline" },
  failed: { label: "Falhou", variant: "destructive" },
};

const TABS = [
  { value: "all", label: "Todos" },
  { value: "draft", label: "Rascunhos" },
  { value: "scheduled", label: "Agendados" },
  { value: "published", label: "Publicados" },
];

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export function GmbPostsClient({
  posts,
  status,
  connection,
}: {
  posts: Post[];
  status: string;
  connection: Connection;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [aiLoading, setAiLoading] = useState(false);
  const [editPost, setEditPost] = useState<Post | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Form state
  const [formContent, setFormContent] = useState("");
  const [formCtaType, setFormCtaType] = useState("none");
  const [formCtaUrl, setFormCtaUrl] = useState("");
  const [formStatus, setFormStatus] = useState("draft");
  const [formScheduledFor, setFormScheduledFor] = useState("");

  // Tom do conteúdo — alimenta o copywriter-core na geração de posts
  const [postTone, setPostTone] = useState(connection.post_tone);

  function resetForm() {
    setFormContent("");
    setFormCtaType("none");
    setFormCtaUrl("");
    setFormStatus("draft");
    setFormScheduledFor("");
  }

  function openCreate() {
    resetForm();
    setEditPost(null);
    setShowCreateDialog(true);
  }

  function openEdit(post: Post) {
    setFormContent(post.content);
    setFormCtaType(post.cta_type || "none");
    setFormCtaUrl(post.cta_url || "");
    setFormStatus(post.status);
    setFormScheduledFor(
      post.scheduled_for
        ? new Date(post.scheduled_for).toISOString().slice(0, 16)
        : ""
    );
    setEditPost(post);
    setShowCreateDialog(true);
  }

  async function handleGenerateAi() {
    setAiLoading(true);
    try {
      const content = await generateAiContent("post", {
        officeName: connection.office_name_gmb || undefined,
      });
      setFormContent(content);
    } finally {
      setAiLoading(false);
    }
  }

  function handleSavePost() {
    startTransition(async () => {
      const data = {
        content: formContent,
        cta_type: formCtaType,
        cta_url: formCtaUrl || undefined,
        status: formStatus,
        scheduled_for: formScheduledFor || undefined,
        generated_by_ai: false,
      };

      if (editPost) {
        await updateGmbPost(editPost.id, data);
      } else {
        await createGmbPost(data);
      }
      setShowCreateDialog(false);
      resetForm();
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este post?")) return;
    startTransition(async () => {
      await deleteGmbPost(id);
      router.refresh();
    });
  }

  function handlePublish(id: string) {
    startTransition(async () => {
      await publishGmbPost(id);
      router.refresh();
    });
  }

  function handleSaveTone() {
    startTransition(async () => {
      await saveGmbConnection({
        office_name_gmb: connection.office_name_gmb || "",
        post_tone: postTone,
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
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Posts</h1>
            <p className="mt-1 text-muted-foreground">
              Gerencie seus posts do Google Meu Negócio.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={async () => {
                setAiLoading(true);
                try {
                  const content = await generateAiContent("post", {
                    officeName: connection.office_name_gmb || undefined,
                  });
                  resetForm();
                  setFormContent(content);
                  setEditPost(null);
                  setShowCreateDialog(true);
                } finally {
                  setAiLoading(false);
                }
              }}
              disabled={aiLoading}
            >
              {aiLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Gerar post com IA
            </Button>
            <Button className="gap-2" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Novo post
            </Button>
          </div>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 border-b">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              status === tab.value
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => {
              const params = new URLSearchParams();
              if (tab.value !== "all") params.set("status", tab.value);
              router.push(`/gmb/posts${params.toString() ? `?${params}` : ""}`);
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Posts grid */}
      {posts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              Nenhum post encontrado.
            </p>
            <Button className="gap-2" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Criar primeiro post
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => {
            const statusConf =
              STATUS_CONFIG[post.status] ?? STATUS_CONFIG.draft;
            return (
              <Card key={post.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={statusConf.variant}>
                      {statusConf.label}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(post)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        {(post.status === "draft" || post.status === "scheduled") && (
                          <DropdownMenuItem onClick={() => handlePublish(post.id)}>
                            <Send className="h-4 w-4 mr-2" />
                            Publicar agora
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleDelete(post.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm line-clamp-4 mb-3">{post.content}</p>
                  {post.generated_by_ai && (
                    <Badge variant="outline" className="text-[10px] gap-1 mb-2">
                      <Sparkles className="h-3 w-3" />
                      Gerado por IA
                    </Badge>
                  )}
                </CardContent>
                <div className="px-6 pb-4">
                  <Separator className="mb-3" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    {post.status === "scheduled" && post.scheduled_for ? (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Agendado: {formatDate(post.scheduled_for)}
                      </span>
                    ) : post.status === "published" && post.published_at ? (
                      <span>Publicado: {formatDate(post.published_at)}</span>
                    ) : (
                      <span>Criado: {formatDate(post.created_at)}</span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Tom do conteúdo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tom dos posts gerados por IA</CardTitle>
          <CardDescription>
            Define o tom de voz que a IA usa ao gerar conteúdo para o seu perfil.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Tom do conteúdo</Label>
              <Select value={postTone} onValueChange={setPostTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="formal">Formal-consultivo</SelectItem>
                  <SelectItem value="friendly">Próximo-direto</SelectItem>
                  <SelectItem value="casual">Informal-tecnológico</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveTone}
              disabled={isPending}
            >
              Salvar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editPost ? "Editar Post" : "Novo Post"}
            </DialogTitle>
            <DialogDescription>
              {editPost
                ? "Edite o conteúdo do post."
                : "Crie um novo post para o Google Meu Negócio."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Conteúdo</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 h-7 text-xs"
                  onClick={handleGenerateAi}
                  disabled={aiLoading}
                >
                  {aiLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  Gerar com IA
                </Button>
              </div>
              <Textarea
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                placeholder="Escreva o conteúdo do post..."
                rows={5}
              />
              <p className="text-xs text-muted-foreground">
                {formContent.length} caracteres
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Botão de ação (CTA)</Label>
                <Select value={formCtaType} onValueChange={setFormCtaType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    <SelectItem value="learn_more">Saiba mais</SelectItem>
                    <SelectItem value="book">Agendar</SelectItem>
                    <SelectItem value="call">Ligar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formStatus} onValueChange={setFormStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="scheduled">Agendado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formCtaType !== "none" && (
              <div className="space-y-2">
                <Label>URL do CTA</Label>
                <Input
                  value={formCtaUrl}
                  onChange={(e) => setFormCtaUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            )}

            {formStatus === "scheduled" && (
              <div className="space-y-2">
                <Label>Data de publicação</Label>
                <Input
                  type="datetime-local"
                  value={formScheduledFor}
                  onChange={(e) => setFormScheduledFor(e.target.value)}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSavePost}
              disabled={isPending || !formContent.trim()}
              className="gap-2"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {editPost ? "Salvar" : "Criar post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
