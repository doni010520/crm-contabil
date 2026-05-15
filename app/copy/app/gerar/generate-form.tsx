"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { generateCopyAction } from "../../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Sparkles, AlertCircle } from "lucide-react";
import {
  COPY_CREDITS_COST,
  type CopyMode,
  type EscritorioProfile,
  type CopyGenerationParams,
  type Nicho,
  type Servico,
  type ObjetivoCampanha,
  type EstagioFunil,
  type FormatoCriativoMeta,
} from "@crm-contabil/copywriter-core";

const MODE_LABELS: Record<CopyMode, string> = {
  "site-home": "Site — Home",
  "site-lp-nicho": "Site — LP de Nicho",
  "site-servico": "Site — Página de Serviço",
  "google-ads": "Google Ads",
  "meta-ads": "Meta Ads",
  "gmb-descricao": "Google Meu Negócio — Descrição",
  "gmb-post": "Google Meu Negócio — Post",
};

const SERVICO_LABELS: Record<Servico, string> = {
  contabil: "Contabilidade",
  fiscal: "Fiscal",
  folha: "Folha de Pagamento",
  tributario: "Tributário",
  societario: "Societário",
  "bpo-financeiro": "BPO Financeiro",
  irpf: "IRPF",
  consultoria: "Consultoria",
  abertura: "Abertura de Empresa",
  troca: "Troca de Contador",
  sucessorio: "Sucessório",
};

const NICHO_LABELS: Record<Nicho, string> = {
  medicos: "Médicos",
  dentistas: "Dentistas",
  advogados: "Advogados",
  ecommerce: "E-commerce",
  infoprodutores: "Infoprodutores",
  restaurantes: "Restaurantes",
  industria: "Indústria",
  construcao: "Construção",
  startups: "Startups",
  holdings: "Holdings",
  "profissionais-liberais": "Profissionais Liberais",
  mei: "MEI",
  "comercio-varejo": "Comércio / Varejo",
  "servicos-gerais": "Serviços Gerais",
  transporte: "Transporte",
  clinicas: "Clínicas",
  tecnologia: "Tecnologia",
};

interface GenerateFormProps {
  modo: CopyMode;
  profile: EscritorioProfile;
  saldo: number;
}

export function GenerateForm({ modo, profile, saldo }: GenerateFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [nichoAlvo, setNichoAlvo] = useState<Nicho | undefined>(profile.nichos[0]);
  const [servicoAlvo, setServicoAlvo] = useState<Servico | undefined>(profile.servicos[0]);
  const [cidadeAlvo, setCidadeAlvo] = useState("");
  const [objetivo, setObjetivo] = useState<ObjetivoCampanha>("troca-contador");
  const [orcamento, setOrcamento] = useState(1500);
  const [oferta, setOferta] = useState("");
  const [estagioFunil, setEstagioFunil] = useState<EstagioFunil>("frio");
  const [formato, setFormato] = useState<FormatoCriativoMeta>("feed-estatico");

  const custo = COPY_CREDITS_COST[modo];
  const saldoInsuficiente = saldo < custo;

  function buildParams(): CopyGenerationParams {
    switch (modo) {
      case "site-home":
        return { modo: "site-home", params: {} };
      case "site-lp-nicho":
        return {
          modo: "site-lp-nicho",
          params: { nicho: nichoAlvo as Nicho, cidadeAlvo: cidadeAlvo || undefined },
        };
      case "site-servico":
        return {
          modo: "site-servico",
          params: { servico: servicoAlvo as Servico, cidadeAlvo: cidadeAlvo || undefined },
        };
      case "google-ads":
        return {
          modo: "google-ads",
          params: {
            objetivoCampanha: objetivo,
            cidadeAlvo: cidadeAlvo || undefined,
            orcamentoMensal: orcamento,
            oferta: oferta || undefined,
            nichoAlvo: objetivo === "nicho-especifico" ? nichoAlvo : undefined,
            servicoAlvo: objetivo === "servico-especifico" ? servicoAlvo : undefined,
          },
        };
      case "meta-ads":
        return {
          modo: "meta-ads",
          params: {
            objetivoCampanha: objetivo,
            estagioFunil,
            formatoCriativo: formato,
            cidadeAlvo: cidadeAlvo || undefined,
            oferta: oferta || undefined,
            nichoAlvo: objetivo === "nicho-especifico" ? nichoAlvo : undefined,
            servicoAlvo: objetivo === "servico-especifico" ? servicoAlvo : undefined,
          },
        };
      default:
        // Modos GMB são oferecidos via outra UI (gerador GMB no CRM).
        // Standalone não expõe eles aqui.
        throw new Error(`Modo "${modo}" não suportado nesta UI`);
    }
  }

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const result = await generateCopyAction(buildParams());
      if (!result.ok) {
        setError(result.error || "Erro desconhecido");
        return;
      }
      if (result.generationId) {
        router.push(`/copy/app/historico/${result.generationId}`);
      }
    });
  }

  return (
    <>
      <div className="mb-6">
        <Link
          href="/copy/app"
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center"
        >
          <ChevronLeft className="size-4 mr-1" /> Voltar
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight mt-2 flex items-center gap-2">
          <Sparkles className="size-6" /> Gerar — {MODE_LABELS[modo]}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Perfil: <strong>{profile.nome}</strong> · {profile.cidade} · tom {profile.tomDeVoz}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Parâmetros específicos</span>
            <Badge variant={saldoInsuficiente ? "destructive" : "outline"}>
              Custo: {custo} créd{custo > 1 ? "s" : ""} · saldo {saldo}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {modo === "site-lp-nicho" && (
            <>
              <div>
                <Label>Nicho da LP *</Label>
                <Select value={nichoAlvo} onValueChange={(v) => setNichoAlvo(v as Nicho)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {profile.nichos.map((n) => (
                      <SelectItem key={n} value={n}>{NICHO_LABELS[n]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cidade-alvo (opcional)</Label>
                <Input value={cidadeAlvo} onChange={(e) => setCidadeAlvo(e.target.value)} placeholder={`Deixe vazio para usar ${profile.cidade}`} />
              </div>
            </>
          )}

          {modo === "site-servico" && (
            <>
              <div>
                <Label>Serviço *</Label>
                <Select value={servicoAlvo} onValueChange={(v) => setServicoAlvo(v as Servico)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {profile.servicos.map((s) => (
                      <SelectItem key={s} value={s}>{SERVICO_LABELS[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cidade-alvo (opcional)</Label>
                <Input value={cidadeAlvo} onChange={(e) => setCidadeAlvo(e.target.value)} placeholder={`Deixe vazio para usar ${profile.cidade}`} />
              </div>
            </>
          )}

          {(modo === "google-ads" || modo === "meta-ads") && (
            <>
              <div>
                <Label>Objetivo da campanha *</Label>
                <Select value={objetivo} onValueChange={(v) => setObjetivo(v as ObjetivoCampanha)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="abertura-empresa">Abertura de empresa</SelectItem>
                    <SelectItem value="troca-contador">Troca de contador</SelectItem>
                    <SelectItem value="nicho-especifico">Nicho específico</SelectItem>
                    <SelectItem value="servico-especifico">Serviço específico</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {objetivo === "nicho-especifico" && (
                <div>
                  <Label>Nicho-alvo</Label>
                  <Select value={nichoAlvo} onValueChange={(v) => setNichoAlvo(v as Nicho)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {profile.nichos.map((n) => (
                        <SelectItem key={n} value={n}>{NICHO_LABELS[n]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {objetivo === "servico-especifico" && (
                <div>
                  <Label>Serviço-alvo</Label>
                  <Select value={servicoAlvo} onValueChange={(v) => setServicoAlvo(v as Servico)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {profile.servicos.map((s) => (
                        <SelectItem key={s} value={s}>{SERVICO_LABELS[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label>Cidade-alvo</Label>
                <Input value={cidadeAlvo} onChange={(e) => setCidadeAlvo(e.target.value)} placeholder={`Deixe vazio para usar ${profile.cidade}`} />
              </div>

              <div>
                <Label>Oferta / gancho (opcional)</Label>
                <Textarea value={oferta} onChange={(e) => setOferta(e.target.value)} rows={2} placeholder='Ex: "1º mês grátis na troca"' />
              </div>

              {modo === "google-ads" && (
                <div>
                  <Label>Orçamento mensal previsto (R$)</Label>
                  <Input type="number" value={orcamento} onChange={(e) => setOrcamento(parseInt(e.target.value || "0"))} />
                </div>
              )}

              {modo === "meta-ads" && (
                <>
                  <div>
                    <Label>Estágio do funil</Label>
                    <Select value={estagioFunil} onValueChange={(v) => setEstagioFunil(v as EstagioFunil)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="frio">Frio (público novo)</SelectItem>
                        <SelectItem value="morno">Morno</SelectItem>
                        <SelectItem value="quente">Quente</SelectItem>
                        <SelectItem value="remarketing">Remarketing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Formato criativo</Label>
                    <Select value={formato} onValueChange={(v) => setFormato(v as FormatoCriativoMeta)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="feed-estatico">Feed estático</SelectItem>
                        <SelectItem value="reels">Reels</SelectItem>
                        <SelectItem value="carrossel">Carrossel</SelectItem>
                        <SelectItem value="stories">Stories</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </>
          )}

          {modo === "site-home" && (
            <p className="text-sm text-muted-foreground">
              A Home será gerada com as 10 seções padrão usando os dados do perfil.
            </p>
          )}

          {error && (
            <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded">
              <AlertCircle className="size-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {saldoInsuficiente && (
            <div className="text-sm text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 p-3 rounded border border-amber-200 dark:border-amber-900">
              Saldo insuficiente. <Link href="/copy/precos" className="underline">Comprar créditos</Link>.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3 mt-6">
        <Link href="/copy/app"><Button variant="outline">Cancelar</Button></Link>
        <Button onClick={handleGenerate} disabled={isPending || saldoInsuficiente}>
          {isPending ? (
            <><Sparkles className="size-4 mr-2 animate-pulse" /> Gerando... (~30s)</>
          ) : (
            <><Sparkles className="size-4 mr-2" /> Gerar — {custo} créd{custo > 1 ? "s" : ""}</>
          )}
        </Button>
      </div>
    </>
  );
}
