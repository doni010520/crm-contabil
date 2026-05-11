import { MessageSquare, Settings } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function InboxPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Inbox</h1>
      <p className="mt-1 text-muted-foreground">
        Conversas do WhatsApp com seus leads e clientes.
      </p>

      <div className="mt-16 flex flex-col items-center justify-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <MessageSquare className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="mt-6 text-xl font-semibold">Inbox WhatsApp</h2>
        <p className="mt-2 max-w-md text-muted-foreground">
          Configure sua integracao com o WhatsApp Cloud API nas Configuracoes
          para comecar a receber mensagens dos seus contatos diretamente aqui.
        </p>
        <Button asChild className="mt-6" variant="default">
          <Link href="/settings">
            <Settings className="mr-2 h-4 w-4" />
            Ir para Configuracoes
          </Link>
        </Button>
        <div className="mt-10 grid max-w-lg gap-4 text-left sm:grid-cols-2">
          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium">1. Configurar API</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Insira o Phone Number ID e Token do WhatsApp Cloud API.
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium">2. Cadastrar Webhook</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Configure a URL de webhook no painel do Meta Business.
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium">3. Receber Mensagens</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Mensagens dos contatos aparecerao automaticamente aqui.
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium">4. Responder</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Responda diretamente pelo CRM sem sair da plataforma.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
