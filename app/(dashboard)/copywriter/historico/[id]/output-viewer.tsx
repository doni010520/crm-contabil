"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, AlertTriangle } from "lucide-react";
import type {
  CopyGenerationOutput,
  SitePageOutput,
  SiteSection,
  GoogleAdsOutput,
  MetaAdsOutput,
} from "@crm-contabil/copywriter-core";

interface OutputViewerProps {
  modo: string;
  output: CopyGenerationOutput;
  avisos: string[];
  createdAt: string;
  modeloIA: string;
}

export function OutputViewer({ modo, output, avisos, createdAt, modeloIA }: OutputViewerProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{labelModo(modo)}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerado em {new Date(createdAt).toLocaleString("pt-BR")} · modelo {modeloIA}
          </p>
        </div>
      </div>

      {avisos.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-900">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="size-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                  Avisos da geração ({avisos.length})
                </p>
                <ul className="text-xs text-amber-800 dark:text-amber-300 mt-1 space-y-0.5">
                  {avisos.map((a, i) => (
                    <li key={i}>· {a}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {output.tipo === "site" && <SiteOutputViewer pagina={output.pagina} />}
      {output.tipo === "google-ads" && <GoogleAdsViewer campanha={output.campanha} />}
      {output.tipo === "meta-ads" && <MetaAdsViewer campanha={output.campanha} />}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Site
// ──────────────────────────────────────────────────────────────

function SiteOutputViewer({ pagina }: { pagina: SitePageOutput }) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">SEO da página</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <CopyField label="URL" value={pagina.url} />
          <CopyField label="Title (<title>)" value={pagina.title} />
          <CopyField label="Meta description" value={pagina.metaDescription} multiline />
          <CopyField label="H1" value={pagina.h1} />
          <CopyField
            label="Schema JSON-LD"
            value={JSON.stringify(pagina.schemaJsonLd, null, 2)}
            multiline
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Seções (10 abas)</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={pagina.sections[0]?.tipo}>
            <TabsList className="flex-wrap h-auto">
              {pagina.sections.map((s) => (
                <TabsTrigger key={s.tipo} value={s.tipo} className="text-xs">
                  {sectionLabel(s.tipo)}
                </TabsTrigger>
              ))}
            </TabsList>
            {pagina.sections.map((s) => (
              <TabsContent key={s.tipo} value={s.tipo} className="space-y-3 mt-4">
                <SectionPreview section={s} />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Instruções de uso</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">{pagina.instrucoesUso}</p>
        </CardContent>
      </Card>
    </>
  );
}

function SectionPreview({ section }: { section: SiteSection }) {
  return (
    <>
      {section.headline && (
        <CopyField label="Headline" value={section.headline} />
      )}
      {section.subheadline && (
        <CopyField label="Subheadline" value={section.subheadline} multiline />
      )}
      {section.bullets && section.bullets.length > 0 && (
        <CopyField label="Bullets" value={section.bullets.join("\n")} multiline />
      )}
      {section.faq && section.faq.length > 0 && (
        <CopyField
          label="FAQ"
          value={section.faq.map((f) => `Q: ${f.pergunta}\nA: ${f.resposta}`).join("\n\n")}
          multiline
        />
      )}
      {section.cta && (
        <CopyField label="CTA" value={`${section.cta.texto} → ${section.cta.href}`} />
      )}
      <CopyField label="HTML pronto" value={section.copyHtml} multiline code />
    </>
  );
}

// ──────────────────────────────────────────────────────────────
// Google Ads
// ──────────────────────────────────────────────────────────────

function GoogleAdsViewer({ campanha }: { campanha: GoogleAdsOutput }) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Campanha</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p><strong>Nome:</strong> {campanha.campanha.nome}</p>
          <p><strong>Objetivo:</strong> {campanha.campanha.objetivo}</p>
          <p><strong>Orçamento:</strong> R$ {campanha.campanha.orcamentoMensalSugerido}/mês</p>
          <p><strong>Geolocalização:</strong> {campanha.campanha.geolocalizacao}</p>
        </CardContent>
      </Card>

      <Tabs defaultValue="0">
        <TabsList className="flex-wrap h-auto">
          {campanha.adGroups.map((ag, i) => (
            <TabsTrigger key={i} value={String(i)}>{ag.nome}</TabsTrigger>
          ))}
        </TabsList>
        {campanha.adGroups.map((ag, i) => (
          <TabsContent key={i} value={String(i)} className="space-y-3 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Palavras-chave</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {ag.palavrasChave.map((kw, j) => (
                  <div key={j} className="text-sm flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{kw.correspondencia}</Badge>
                    <span>{kw.termo}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <CopyField
              label={`15 Headlines (≤30 chars)`}
              value={ag.headlines.map((h, k) => `${k + 1}. ${h} (${h.length})`).join("\n")}
              multiline
            />
            <CopyField
              label={`4 Descriptions (≤90 chars)`}
              value={ag.descriptions.map((d, k) => `${k + 1}. ${d} (${d.length})`).join("\n")}
              multiline
            />
            <CopyField
              label={`10 Callouts (≤25 chars)`}
              value={ag.callouts.map((c) => `${c} (${c.length})`).join("\n")}
              multiline
            />
            <CopyField
              label="Sitelinks"
              value={ag.sitelinks
                .map((s, k) => `${k + 1}. ${s.texto}\n   ${s.descricao1}\n   ${s.descricao2}`)
                .join("\n\n")}
              multiline
            />
          </TabsContent>
        ))}
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Palavras-chave NEGATIVAS</CardTitle>
        </CardHeader>
        <CardContent>
          <CopyField label="Lista" value={campanha.palavrasNegativas.join("\n")} multiline />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Instruções de uso</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">{campanha.instrucoesUso}</p>
        </CardContent>
      </Card>
    </>
  );
}

// ──────────────────────────────────────────────────────────────
// Meta Ads
// ──────────────────────────────────────────────────────────────

function MetaAdsViewer({ campanha }: { campanha: MetaAdsOutput }) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conjunto de anúncios</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          <p><strong>Nome:</strong> {campanha.conjuntoAnuncios.nome}</p>
          <p><strong>Estágio:</strong> {campanha.conjuntoAnuncios.estagioFunil}</p>
          <p><strong>Formato:</strong> {campanha.conjuntoAnuncios.formatoCriativo}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Público sugerido</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>Geolocalização:</strong> {campanha.publicoSugerido.geolocalizacao}</p>
          <p><strong>Faixa etária:</strong> {campanha.publicoSugerido.faixaEtaria}</p>
          <div>
            <strong>Interesses:</strong>
            <div className="flex flex-wrap gap-1 mt-1">
              {campanha.publicoSugerido.interesses.map((i, k) => (
                <Badge key={k} variant="secondary">{i}</Badge>
              ))}
            </div>
          </div>
          <div>
            <strong>Comportamentos:</strong>
            <div className="flex flex-wrap gap-1 mt-1">
              {campanha.publicoSugerido.comportamentos.map((c, k) => (
                <Badge key={k} variant="secondary">{c}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="0">
        <TabsList className="flex-wrap h-auto">
          {campanha.variacoes.map((v, i) => (
            <TabsTrigger key={i} value={String(i)}>
              Var {i + 1} · {v.angulo}
            </TabsTrigger>
          ))}
        </TabsList>
        {campanha.variacoes.map((v, i) => (
          <TabsContent key={i} value={String(i)} className="space-y-3 mt-4">
            <CopyField label={`Primary text (${v.primaryText.length} chars)`} value={v.primaryText} multiline />
            <CopyField label={`Headline (${v.headline.length}/40)`} value={v.headline} />
            <CopyField label={`Description (${v.description.length}/30)`} value={v.description} />
          </TabsContent>
        ))}
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ideias de criativo visual</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm space-y-2">
            {campanha.ideiasCriativos.map((i, k) => (
              <li key={k}>· {i}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Instruções de uso</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">{campanha.instrucoesUso}</p>
        </CardContent>
      </Card>
    </>
  );
}

// ──────────────────────────────────────────────────────────────
// CopyField — bloco com botão de copiar
// ──────────────────────────────────────────────────────────────

function CopyField({
  label,
  value,
  multiline,
  code,
}: {
  label: string;
  value: string;
  multiline?: boolean;
  code?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <Button variant="ghost" size="sm" onClick={handleCopy}>
          {copied ? (
            <>
              <Check className="size-3 mr-1" /> Copiado
            </>
          ) : (
            <>
              <Copy className="size-3 mr-1" /> Copiar
            </>
          )}
        </Button>
      </div>
      {multiline ? (
        <pre
          className={`text-xs bg-muted p-3 rounded whitespace-pre-wrap break-words ${
            code ? "font-mono" : ""
          }`}
        >
          {value}
        </pre>
      ) : (
        <div className="text-sm bg-muted p-2.5 rounded break-words">{value}</div>
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

function sectionLabel(s: string): string {
  const map: Record<string, string> = {
    hero: "Hero",
    "prova-social": "Prova social",
    "dores-pas": "Dores (PAS)",
    servicos: "Serviços",
    nichos: "Nichos",
    processo: "Processo",
    diferenciais: "Diferenciais",
    depoimentos: "Depoimentos",
    faq: "FAQ",
    "cta-final": "CTA final",
  };
  return map[s] || s;
}
