"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Building2,
  User,
  Users,
  Plug,
  Loader2,
  UserPlus,
  MessageSquare,
} from "lucide-react";
import type { TenantSettings, UserProfile, TeamMember } from "./actions";
import {
  updateTenantSettings,
  updateUserProfile,
  updateWhatsAppSettings,
  inviteTeamMember,
} from "./actions";
import { WhatsAppConnect } from "./whatsapp-connect";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const planLabels: Record<string, string> = {
  free: "Gratuito",
  starter: "Starter",
  pro: "Pro",
  enterprise: "Enterprise",
};

const roleLabels: Record<string, string> = {
  owner: "Proprietario",
  admin: "Administrador",
  user: "Usuario",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ---------------------------------------------------------------------------
// Main form component
// ---------------------------------------------------------------------------
export function SettingsForm({
  tenant,
  user,
  teamMembers,
}: {
  tenant: TenantSettings;
  user: UserProfile;
  teamMembers: TeamMember[];
}) {
  return (
    <Tabs defaultValue="escritorio" className="w-full">
      <TabsList className="w-full justify-start">
        <TabsTrigger value="escritorio" className="gap-1.5">
          <Building2 className="h-4 w-4" />
          Escritorio
        </TabsTrigger>
        <TabsTrigger value="perfil" className="gap-1.5">
          <User className="h-4 w-4" />
          Perfil
        </TabsTrigger>
        <TabsTrigger value="equipe" className="gap-1.5">
          <Users className="h-4 w-4" />
          Equipe
        </TabsTrigger>
        <TabsTrigger value="integracoes" className="gap-1.5">
          <Plug className="h-4 w-4" />
          Integracoes
        </TabsTrigger>
      </TabsList>

      <TabsContent value="escritorio">
        <TenantForm tenant={tenant} />
      </TabsContent>

      <TabsContent value="perfil">
        <ProfileForm user={user} />
      </TabsContent>

      <TabsContent value="equipe">
        <TeamTab members={teamMembers} />
      </TabsContent>

      <TabsContent value="integracoes">
        <IntegrationsForm tenant={tenant} />
      </TabsContent>
    </Tabs>
  );
}

// ---------------------------------------------------------------------------
// Tenant form
// ---------------------------------------------------------------------------
function TenantForm({ tenant }: { tenant: TenantSettings }) {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);

  function handleSubmit(formData: FormData) {
    setSuccess(false);
    startTransition(async () => {
      await updateTenantSettings(formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados do Escritorio</CardTitle>
        <CardDescription>
          Informacoes basicas do seu escritorio contabil.
        </CardDescription>
      </CardHeader>
      <form action={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Escritorio</Label>
            <Input
              id="name"
              name="name"
              defaultValue={tenant.name}
              placeholder="Nome do escritorio"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={tenant.slug}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              O slug e gerado automaticamente e nao pode ser alterado.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input
              id="cnpj"
              name="cnpj"
              defaultValue={tenant.cnpj ?? ""}
              placeholder="00.000.000/0001-00"
            />
          </div>
          <div className="space-y-2">
            <Label>Plano</Label>
            <div>
              <Badge variant="secondary">
                {planLabels[tenant.plan] ?? tenant.plan}
              </Badge>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex items-center gap-3 border-t pt-6">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
          {success && (
            <span className="text-sm text-green-600">
              Salvo com sucesso!
            </span>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Profile form
// ---------------------------------------------------------------------------
function ProfileForm({ user }: { user: UserProfile }) {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);

  function handleSubmit(formData: FormData) {
    setSuccess(false);
    startTransition(async () => {
      await updateUserProfile(formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Meu Perfil</CardTitle>
        <CardDescription>
          Seus dados pessoais de acesso ao sistema.
        </CardDescription>
      </CardHeader>
      <form action={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">
                {getInitials(user.name || "U")}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{user.name}</p>
              <Badge variant="outline">{roleLabels[user.role] ?? user.role}</Badge>
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="profile-name">Nome</Label>
            <Input
              id="profile-name"
              name="name"
              defaultValue={user.name}
              placeholder="Seu nome"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-email">E-mail</Label>
            <Input
              id="profile-email"
              name="email"
              type="email"
              defaultValue={user.email}
              placeholder="seu@email.com"
            />
          </div>
        </CardContent>
        <CardFooter className="flex items-center gap-3 border-t pt-6">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
          {success && (
            <span className="text-sm text-green-600">
              Salvo com sucesso!
            </span>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Team tab
// ---------------------------------------------------------------------------
function TeamTab({ members }: { members: TeamMember[] }) {
  const [isPending, startTransition] = useTransition();
  const [showInvite, setShowInvite] = useState(false);
  const [success, setSuccess] = useState(false);

  function handleInvite(formData: FormData) {
    setSuccess(false);
    startTransition(async () => {
      await inviteTeamMember(formData);
      setShowInvite(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Equipe</CardTitle>
            <CardDescription>
              Membros do seu escritorio ({members.length})
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowInvite(!showInvite)}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Convidar
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {success && (
            <p className="text-sm text-green-600">
              Membro adicionado com sucesso!
            </p>
          )}
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-md border px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="text-xs">
                    {getInitials(member.name || "U")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{member.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {member.email}
                  </p>
                </div>
              </div>
              <Badge
                variant={
                  member.role === "owner"
                    ? "default"
                    : member.role === "admin"
                      ? "secondary"
                      : "outline"
                }
              >
                {roleLabels[member.role] ?? member.role}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {showInvite && (
        <Card>
          <CardHeader>
            <CardTitle>Convidar Membro</CardTitle>
            <CardDescription>
              Adicione um novo membro a equipe do escritorio.
            </CardDescription>
          </CardHeader>
          <form action={handleInvite}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-name">Nome</Label>
                <Input
                  id="invite-name"
                  name="name"
                  placeholder="Nome do membro"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-email">E-mail</Label>
                <Input
                  id="invite-email"
                  name="email"
                  type="email"
                  placeholder="email@exemplo.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-role">Funcao</Label>
                <Select name="role" defaultValue="user">
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a funcao" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="user">Usuario</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter className="flex items-center gap-3 border-t pt-6">
              <Button type="submit" disabled={isPending}>
                {isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Convidar
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowInvite(false)}
              >
                Cancelar
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Integrations form
// ---------------------------------------------------------------------------
function IntegrationsForm({ tenant }: { tenant: TenantSettings }) {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [testing, setTesting] = useState(false);

  const isConnected = !!(tenant.whatsapp_phone_id && tenant.whatsapp_token);

  const webhookUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/webhooks/whatsapp`
      : "https://crm-contabil.72.60.10.92.sslip.io/api/webhooks/whatsapp";

  const verifyToken = "crm-contabil-webhook-verify";

  function handleSubmit(formData: FormData) {
    setSuccess(false);
    setTestResult(null);
    startTransition(async () => {
      await updateWhatsAppSettings(formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    });
  }

  async function handleTestConnection() {
    if (!tenant.whatsapp_phone_id || !tenant.whatsapp_token) {
      setTestResult({ ok: false, msg: "Preencha o Phone Number ID e Token primeiro." });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(
        `https://graph.facebook.com/v21.0/${tenant.whatsapp_phone_id}?fields=verified_name,display_phone_number&access_token=${tenant.whatsapp_token}`
      );
      const data = await res.json();
      if (res.ok && data.verified_name) {
        setTestResult({
          ok: true,
          msg: `Conectado! Numero: ${data.display_phone_number} (${data.verified_name})`,
        });
      } else {
        setTestResult({
          ok: false,
          msg: data.error?.message || "Falha na conexao. Verifique as credenciais.",
        });
      }
    } catch {
      setTestResult({ ok: false, msg: "Erro de rede ao testar conexao." });
    } finally {
      setTesting(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  // Embedded Signup config_id — set via env or hardcoded after creating in Meta Dashboard
  const embeddedSignupConfigId = process.env.NEXT_PUBLIC_META_CONFIG_ID || "";

  return (
    <div className="space-y-4">
      {/* CoEx Embedded Signup */}
      <WhatsAppConnect
        configId={embeddedSignupConfigId}
        isConnected={isConnected}
        phoneNumber={tenant.whatsapp_phone_id ? undefined : undefined}
      />

      {/* Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <MessageSquare className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <CardTitle>WhatsApp Cloud API</CardTitle>
                <CardDescription>
                  Envie e receba mensagens pelo WhatsApp Business.
                </CardDescription>
              </div>
            </div>
            <Badge variant={isConnected ? "default" : "secondary"} className={isConnected ? "bg-green-600" : ""}>
              {isConnected ? "Conectado" : "Desconectado"}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Credentials Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Credenciais</CardTitle>
          <CardDescription>
            Obtenha essas informacoes no Meta Business &gt; WhatsApp &gt; Configuracao da API.
          </CardDescription>
        </CardHeader>
        <form action={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="whatsapp_phone_id">Phone Number ID</Label>
              <Input
                id="whatsapp_phone_id"
                name="whatsapp_phone_id"
                defaultValue={tenant.whatsapp_phone_id ?? ""}
                placeholder="Ex: 1150890451434414"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp_token">Token de Acesso Permanente</Label>
              <Input
                id="whatsapp_token"
                name="whatsapp_token"
                type="password"
                defaultValue={tenant.whatsapp_token ?? ""}
                placeholder="EAANpb..."
              />
              <p className="text-xs text-muted-foreground">
                Gere um token permanente em Meta Business &gt; Configuracoes do sistema &gt; Tokens de acesso.
              </p>
            </div>

            {testResult && (
              <div
                className={`rounded-md p-3 text-sm ${
                  testResult.ok
                    ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                    : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                }`}
              >
                {testResult.msg}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex items-center gap-3 border-t pt-6">
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={testing}
              onClick={handleTestConnection}
            >
              {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Testar Conexao
            </Button>
            {success && (
              <span className="text-sm text-green-600">Salvo com sucesso!</span>
            )}
          </CardFooter>
        </form>
      </Card>

      {/* Webhook Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuracao de Webhook</CardTitle>
          <CardDescription>
            Cadastre esses dados no Meta Business &gt; WhatsApp &gt; Configuracao &gt; Webhook.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>URL do Webhook (Callback URL)</Label>
            <div className="flex gap-2">
              <Input value={webhookUrl} readOnly className="bg-muted font-mono text-xs" />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(webhookUrl)}
              >
                Copiar
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Verify Token</Label>
            <div className="flex gap-2">
              <Input value={verifyToken} readOnly className="bg-muted font-mono text-xs" />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(verifyToken)}
              >
                Copiar
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Campos de Webhook (Webhook Fields)</Label>
            <p className="text-sm text-muted-foreground">
              Marque: <code className="rounded bg-muted px-1">messages</code>
            </p>
          </div>
          <Separator />
          <div className="rounded-md border border-dashed p-4 space-y-2">
            <p className="text-sm font-medium">Passos para configurar:</p>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Acesse developers.facebook.com &gt; Seu App &gt; WhatsApp &gt; Configuracao</li>
              <li>Na secao Webhook, clique &quot;Editar&quot;</li>
              <li>Cole a URL de Callback e o Verify Token acima</li>
              <li>Clique &quot;Verificar e salvar&quot;</li>
              <li>Em &quot;Campos de webhook&quot;, ative &quot;messages&quot;</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
