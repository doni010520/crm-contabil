import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, Check } from "lucide-react";

const PLANOS = [
  {
    nome: "Starter",
    preco: "R$ 47",
    creditos: 10,
    desc: "Para quem está testando",
    items: [
      "10 créditos por mês",
      "Acesso a todos os modos (Site, Google Ads, Meta Ads)",
      "Histórico ilimitado",
      "Sem fidelidade",
    ],
  },
  {
    nome: "Pro",
    preco: "R$ 97",
    creditos: 30,
    desc: "Para o escritório montando o digital",
    destaque: true,
    items: [
      "30 créditos por mês",
      "Acesso a todos os modos",
      "Histórico ilimitado",
      "Suporte prioritário",
      "Custo por crédito: R$ 3,23",
    ],
  },
  {
    nome: "Agência",
    preco: "R$ 247",
    creditos: 100,
    desc: "Para quem atende vários escritórios",
    items: [
      "100 créditos por mês",
      "Múltiplos perfis de escritório",
      "API REST para integrações",
      "Suporte dedicado",
      "Custo por crédito: R$ 2,47",
    ],
  },
];

export default function PrecosPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/copy" className="flex items-center gap-2 font-semibold">
            <Sparkles className="size-5" /> Copy Contábil
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/copy/login">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link href="/copy/register">
              <Button size="sm">Começar grátis</Button>
            </Link>
          </nav>
        </div>
      </header>

      <section className="px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-semibold text-center tracking-tight">
            Preços simples, baseados em uso
          </h1>
          <p className="text-center text-muted-foreground mt-3 max-w-xl mx-auto">
            1 crédito = 1 geração. Site Home consome 3 créditos. Páginas únicas, 1.
            Campanhas de ads, 2. Sem pegadinha.
          </p>

          <div className="grid sm:grid-cols-3 gap-4 mt-12">
            {PLANOS.map((p) => (
              <div
                key={p.nome}
                className={`rounded-lg border p-6 ${
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
                <div className="mb-5">
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
                  <Button className="w-full" variant={p.destaque ? "default" : "outline"}>
                    Começar
                  </Button>
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-12 max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold mb-4">Custo por tipo de geração</h2>
            <div className="border rounded-lg divide-y">
              <Row label="Site — Home completa (10 seções)" custo={3} />
              <Row label="Site — LP de Nicho" custo={1} />
              <Row label="Site — Página de Serviço" custo={1} />
              <Row label="Google Ads (15 headlines · 4 descriptions · sitelinks · negativas)" custo={2} />
              <Row label="Meta Ads (5 variações + público + criativos)" custo={2} />
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t py-6">
        <div className="max-w-6xl mx-auto px-6 text-sm text-muted-foreground text-center">
          © {new Date().getFullYear()} Copy Contábil
        </div>
      </footer>
    </div>
  );
}

function Row({ label, custo }: { label: string; custo: number }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm">{label}</span>
      <span className="text-sm font-medium">{custo} crédito{custo > 1 ? "s" : ""}</span>
    </div>
  );
}
