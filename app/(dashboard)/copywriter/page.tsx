import Link from "next/link";
import { getProfile, getCredits, getHistory } from "./actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Home, FileText, Briefcase, Search, Megaphone, History as HistoryIcon } from "lucide-react";
import { COPY_CREDITS_COST } from "@crm-contabil/copywriter-core";

const MODOS = [
  {
    href: "/copywriter/gerar?modo=site-home",
    titulo: "Site — Home",
    desc: "Gera a home completa do site (10 seções).",
    icon: Home,
    custo: COPY_CREDITS_COST["site-home"],
  },
  {
    href: "/copywriter/gerar?modo=site-lp-nicho",
    titulo: "Site — LP de Nicho",
    desc: "Página dedicada por segmento (médicos, e-commerce, etc.).",
    icon: Briefcase,
    custo: COPY_CREDITS_COST["site-lp-nicho"],
  },
  {
    href: "/copywriter/gerar?modo=site-servico",
    titulo: "Site — Página de Serviço",
    desc: "Página por serviço (abertura, troca, IRPF, etc.).",
    icon: FileText,
    custo: COPY_CREDITS_COST["site-servico"],
  },
  {
    href: "/copywriter/gerar?modo=google-ads",
    titulo: "Google Ads",
    desc: "Campanha RSA completa com headlines, descriptions, sitelinks e negativas.",
    icon: Search,
    custo: COPY_CREDITS_COST["google-ads"],
  },
  {
    href: "/copywriter/gerar?modo=meta-ads",
    titulo: "Meta Ads",
    desc: "5 variações de copy + público sugerido + ideias de criativo.",
    icon: Megaphone,
    custo: COPY_CREDITS_COST["meta-ads"],
  },
];

export default async function CopywriterHubPage() {
  const [profile, credits, history] = await Promise.all([
    getProfile(),
    getCredits(),
    getHistory(5),
  ]);

  const profileCompleto = profile !== null;

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Sparkles className="size-6" /> Copywriter
          </h1>
          <p className="mt-1 text-muted-foreground">
            Gere copy de site e anúncios escritos como por um especialista em contabilidade.
          </p>
        </div>
        <Link href="/copywriter/historico">
          <Button variant="outline" size="sm">
            <HistoryIcon className="size-4 mr-2" /> Histórico
          </Button>
        </Link>
      </div>

      {/* Status do perfil e créditos */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Perfil do escritório</CardTitle>
            <CardDescription>
              Preenchido uma vez, alimenta todas as gerações.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {profileCompleto ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Completo</Badge>
                  <span className="text-sm">{profile.nome}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {profile.cidade} · {profile.nichos.join(", ") || "sem nicho"} ·{" "}
                  Tom: {profile.tomDeVoz}
                </p>
                <Link href="/copywriter/perfil">
                  <Button variant="outline" size="sm">
                    Editar perfil
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Antes de gerar copy, cadastre o perfil do seu escritório (4 telas, ~10 min).
                </p>
                <Link href="/copywriter/perfil">
                  <Button size="sm">Cadastrar perfil</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Créditos</CardTitle>
            <CardDescription>1 crédito = 1 geração. Site Home custa 3.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold">{credits.saldo}</span>
              <span className="text-sm text-muted-foreground">disponíveis</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Plano <strong>{credits.plano}</strong> · {credits.creditosMensais} créditos/mês
            </p>
            <Link href="/copywriter/planos">
              <Button variant="outline" size="sm" className="mt-3">
                Comprar créditos
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Cards de modos */}
      <div>
        <h2 className="text-lg font-semibold mb-3">O que você quer gerar?</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODOS.map((m) => {
            const Icon = m.icon;
            const disabled = !profileCompleto;
            return (
              <Card key={m.href} className={disabled ? "opacity-50" : ""}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="bg-muted rounded-md p-2">
                      <Icon className="size-5" />
                    </div>
                    <Badge variant="outline">{m.custo} crédito{m.custo > 1 ? "s" : ""}</Badge>
                  </div>
                  <CardTitle className="text-base mt-3">{m.titulo}</CardTitle>
                  <CardDescription>{m.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={disabled ? "/copywriter/perfil" : m.href}>
                    <Button size="sm" variant="default" disabled={disabled} className="w-full">
                      {disabled ? "Cadastre o perfil primeiro" : "Gerar"}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Últimas gerações */}
      {history.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Últimas gerações</h2>
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y">
                {history.map((h) => (
                  <li key={h.id}>
                    <Link
                      href={`/copywriter/historico/${h.id}`}
                      className="flex items-center justify-between px-4 py-3 hover:bg-muted/50"
                    >
                      <div>
                        <p className="text-sm font-medium">{labelModo(h.modo)}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(h.created_at).toLocaleString("pt-BR")}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {h.creditos_consumidos} cr · {h.modelo_ia}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function labelModo(m: string): string {
  const map: Record<string, string> = {
    "site-home": "Site — Home",
    "site-lp-nicho": "Site — LP de Nicho",
    "site-servico": "Site — Página de Serviço",
    "google-ads": "Google Ads",
    "meta-ads": "Meta Ads",
  };
  return map[m] || m;
}
