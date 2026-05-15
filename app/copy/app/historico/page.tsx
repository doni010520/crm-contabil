import Link from "next/link";
import { getHistory } from "../../actions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft } from "lucide-react";

const LABEL: Record<string, string> = {
  "site-home": "Site — Home",
  "site-lp-nicho": "Site — LP de Nicho",
  "site-servico": "Site — Página de Serviço",
  "google-ads": "Google Ads",
  "meta-ads": "Meta Ads",
};

export default async function HistoricoPage() {
  const items = await getHistory(100);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link
        href="/copy/app"
        className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center mb-3"
      >
        <ChevronLeft className="size-4 mr-1" /> Voltar
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight mb-6">Histórico de gerações</h1>

      {items.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            Nenhuma geração ainda. <Link href="/copy/app" className="underline">Voltar</Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y">
              {items.map((h) => (
                <li key={h.id}>
                  <Link
                    href={`/copy/app/historico/${h.id}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-muted/50"
                  >
                    <div>
                      <p className="text-sm font-medium">{LABEL[h.modo] || h.modo}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(h.created_at).toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{h.modelo_ia}</Badge>
                      <Badge variant="secondary">{h.creditos_consumidos} créd</Badge>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
