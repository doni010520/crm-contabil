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

  function handleSubmit(formData: FormData) {
    setSuccess(false);
    startTransition(async () => {
      await updateWhatsAppSettings(formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
            <MessageSquare className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <CardTitle>WhatsApp Cloud API</CardTitle>
            <CardDescription>
              Configure sua integracao com o WhatsApp Business para enviar e
              receber mensagens.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <form action={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="whatsapp_phone_id">Phone Number ID</Label>
            <Input
              id="whatsapp_phone_id"
              name="whatsapp_phone_id"
              defaultValue={tenant.whatsapp_phone_id ?? ""}
              placeholder="Ex: 123456789012345"
            />
            <p className="text-xs text-muted-foreground">
              Encontrado no painel do Meta Business &gt; WhatsApp &gt; Configuracao da API.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsapp_token">Token de Acesso</Label>
            <Input
              id="whatsapp_token"
              name="whatsapp_token"
              type="password"
              defaultValue={tenant.whatsapp_token ?? ""}
              placeholder="Token permanente ou temporario"
            />
            <p className="text-xs text-muted-foreground">
              Use um token de acesso permanente para producao.
            </p>
          </div>
          <div className="rounded-md border border-dashed p-4">
            <p className="text-sm text-muted-foreground">
              Apos configurar, a URL de webhook para cadastrar no Meta sera
              exibida aqui. Funcionalidade completa em breve.
            </p>
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
