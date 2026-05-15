import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, Check, Zap, Target, FileText } from "lucide-react";

const FEATURES = [
  {
    icon: Target,
    titulo: "Copy de especialista em contabilidade",
    desc: "Não é IA genérica. É um copywriter treinado em 17 nichos contábeis com vocabulário e dores específicas.",
  },
  {
    icon: FileText,
    titulo: "Site + Google Ads + Meta Ads",
    desc: "Gera Home, LPs por nicho, páginas de serviço e campanhas completas com headlines e descriptions já dentro dos limites de char.",
  },
  {
    icon: Zap,
    titulo: "Em 30 segundos, não em 30 dias",
    desc: "Você preenche 4 telas de perfil uma vez. Depois, cada geração é um clique.",
  },
];

const PLANOS = [
  {
    nome: "Starter",
    preco: "R$ 47",
    creditos: 10,
    desc: "Para quem quer testar",
    items: ["10 créditos/mês", "Acesso a todos os modos", "Histórico ilimitado"],
  },
  {
    nome: "Pro",
    preco: "R$ 97",
    creditos: 30,
    desc: "Para o escritório que está montando o digital",
    items: ["30 créditos/mês", "Acesso a todos os modos", "Histórico ilimitado", "Suporte prioritário"],
    destaque: true,
  },
  {
    nome: "Agência",
    preco: "R$ 247",
    creditos: 100,
    desc: "Para quem atende vários escritórios",
    items: ["100 créditos/mês", "Múltiplos perfis", "API REST", "Suporte dedicado"],
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/copy" className="flex items-center gap-2 font-semibold">
            <Sparkles className="size-5" /> Copy Contábil
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/copy/precos">
              <Button variant="ghost" size="sm">Preços</Button>
            </Link>
            <Link href="/copy/login">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link href="/copy/register">
              <Button size="sm">Começar grátis</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sm font-medium text-primary mb-3">
            Para escritórios de contabilidade que querem parar de depender de indicação
          </p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">
            Copy de site e anúncios escrita como por um especialista em contabilidade.
          </h1>
          <p className="text-lg text-muted-foreground mt-6">
            Você preenche o perfil do seu escritório uma vez. A IA gera Home, LPs de nicho,
            Google Ads e Meta Ads com vocabulário próprio do seu segmento — médicos, e-commerce,
            advogados, restaurantes, ou qualquer dos 17 nichos cobertos.
          </p>
          <div className="flex items-center justify-center gap-3 mt-8">
            <Link href="/copy/register">
              <Button size="lg">
                Começar grátis · 5 créditos
              </Button>
            </Link>
            <Link href="/copy/precos">
              <Button size="lg" variant="outline">Ver preços</Button>
            </Link>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Sem cartão de crédito. 5 créditos de teste no signup.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-12 bg-muted/30">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-3 gap-6">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.titulo}>
                <div className="bg-primary/10 size-10 rounded-md flex items-center justify-center mb-3">
                  <Icon className="size-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">{f.titulo}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Como funciona */}
      <section className="px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold text-center mb-10">Como funciona</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                num: "1",
                titulo: "Preencha o perfil",
                desc: "4 telas curtas (~10 min): identidade, nichos, diferenciais, tom de voz.",
              },
              {
                num: "2",
                titulo: "Escolha o que gerar",
                desc: "Site Home, LP por nicho, Google Ads, Meta Ads — a IA usa o mesmo perfil em todos.",
              },
              {
                num: "3",
                titulo: "Copie e cole",
                desc: "Texto pronto pra colar no Hostinger, Wix, Google Ads ou Meta Business.",
              },
            ].map((step) => (
              <div key={step.num}>
                <div className="size-10 rounded-full bg-primary text-primary-foreground font-semibold flex items-center justify-center mb-3">
                  {step.num}
                </div>
                <h3 className="font-semibold mb-1">{step.titulo}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Preços */}
      <section id="precos" className="px-6 py-16 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-semibold text-center mb-2">Preços</h2>
          <p className="text-center text-muted-foreground mb-10">
            1 crédito = 1 geração. Site Home consome 3, ads consomem 2, LPs e serviços 1.
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            {PLANOS.map((p) => (
              <div
                key={p.nome}
                className={`rounded-lg border p-6 bg-background ${
                  p.destaque ? "border-primary ring-2 ring-primary/20" : ""
                }`}
              >
                {p.destaque && (
                  <div className="text-xs font-medium text-primary mb-2">
                    MAIS POPULAR
                  </div>
                )}
                <h3 className="font-semibold text-lg">{p.nome}</h3>
                <p className="text-sm text-muted-foreground mb-3">{p.desc}</p>
                <div className="mb-4">
                  <span className="text-3xl font-semibold">{p.preco}</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {p.items.map((i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <Check className="size-4 text-primary mt-0.5 shrink-0" />
                      <span>{i}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/copy/register">
                  <Button
                    className="w-full"
                    variant={p.destaque ? "default" : "outline"}
                  >
                    Começar
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="px-6 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-semibold mb-3">
            Pronto pra parar de depender só de indicação?
          </h2>
          <p className="text-muted-foreground mb-6">
            Comece com 5 créditos grátis. Gere sua primeira página em menos de 1 minuto.
          </p>
          <Link href="/copy/register">
            <Button size="lg">Começar agora</Button>
          </Link>
        </div>
      </section>

      <footer className="border-t py-6">
        <div className="max-w-6xl mx-auto px-6 text-sm text-muted-foreground flex items-center justify-between">
          <span>© {new Date().getFullYear()} Copy Contábil</span>
          <span>Feito para escritórios de contabilidade brasileiros</span>
        </div>
      </footer>
    </div>
  );
}
