import {
  Users,
  FileSignature,
  FileText,
  Banknote,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDashboardMetrics } from "./actions";

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

const typeLabels: Record<string, string> = {
  lead: "Lead",
  prospect: "Prospect",
  client: "Cliente",
  churned: "Churned",
};

export default async function DashboardPage() {
  const metrics = await getDashboardMetrics();

  const metricCards = [
    {
      label: "Total Contatos",
      value: metrics.totalContacts.toString(),
      icon: Users,
      href: "/contacts",
    },
    {
      label: "Contratos Ativos",
      value: metrics.activeContracts.toString(),
      icon: FileSignature,
      href: "/contracts",
    },
    {
      label: "Propostas Pendentes",
      value: metrics.pendingProposals.toString(),
      icon: FileText,
      href: "/proposals",
    },
    {
      label: "Receita Mensal",
      value: formatBRL(metrics.monthlyRevenue),
      icon: Banknote,
      href: "/contracts",
    },
  ];

  const totalPipelineEntries = metrics.pipelineStages.reduce(
    (sum, s) => sum + s.count,
    0
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Visao geral do seu escritorio e metricas.
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((card) => (
          <Link key={card.label} href={card.href}>
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="text-sm font-medium">
                  {card.label}
                </CardDescription>
                <card.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pipeline summary */}
        <Card>
          <CardHeader>
            <CardTitle>Pipeline</CardTitle>
            <CardDescription>
              {totalPipelineEntries} oportunidade{totalPipelineEntries !== 1 ? "s" : ""}{" "}
              &middot; {formatBRL(metrics.pipelineTotalValue)} em valor total
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {metrics.pipelineStages.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum estagio configurado.{" "}
                <Link href="/pipeline" className="text-primary underline">
                  Configurar pipeline
                </Link>
              </p>
            ) : (
              metrics.pipelineStages.map((stage) => {
                const pct =
                  totalPipelineEntries > 0
                    ? (stage.count / totalPipelineEntries) * 100
                    : 0;
                return (
                  <div key={stage.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{stage.name}</span>
                      <span className="text-muted-foreground">
                        {stage.count} &middot; {formatBRL(stage.value)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.max(pct, 2)}%`,
                          backgroundColor: stage.color || "#6366f1",
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
            {metrics.pipelineStages.length > 0 && (
              <Link
                href="/pipeline"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
              >
                Ver pipeline completo <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Recent contacts */}
        <Card>
          <CardHeader>
            <CardTitle>Contatos Recentes</CardTitle>
            <CardDescription>Ultimos contatos adicionados</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.recentContacts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum contato cadastrado.{" "}
                <Link href="/contacts" className="text-primary underline">
                  Adicionar contato
                </Link>
              </p>
            ) : (
              <div className="space-y-3">
                {metrics.recentContacts.map((contact) => (
                  <Link
                    key={contact.id}
                    href={`/contacts/${contact.id}`}
                    className="flex items-center justify-between rounded-md px-2 py-1.5 transition-colors hover:bg-accent"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {contact.contact_name}
                      </p>
                      {contact.company_name && (
                        <p className="text-xs text-muted-foreground truncate">
                          {contact.company_name}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary" className="ml-2 shrink-0">
                      {typeLabels[contact.type ?? "lead"] ?? contact.type}
                    </Badge>
                  </Link>
                ))}
                <Link
                  href="/contacts"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
                >
                  Ver todos os contatos <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expiring contracts */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Contratos com Vencimento Proximo</CardTitle>
            <CardDescription>
              Contratos ativos com vencimento nos proximos 30 dias
            </CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.expiringContracts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum contrato com vencimento proximo.
              </p>
            ) : (
              <div className="space-y-3">
                {metrics.expiringContracts.map((contract) => (
                  <Link
                    key={contract.id}
                    href={`/contracts/${contract.id}`}
                    className="flex items-center justify-between rounded-md px-2 py-1.5 transition-colors hover:bg-accent"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {contract.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {contract.contacts?.contact_name}
                        {contract.contacts?.company_name
                          ? ` - ${contract.contacts.company_name}`
                          : ""}
                      </p>
                    </div>
                    <div className="text-right ml-2 shrink-0">
                      <p className="text-sm font-medium">
                        {formatBRL(contract.monthly_value)}
                        <span className="text-muted-foreground font-normal">
                          /mes
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Vence em {formatDate(contract.end_date)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
