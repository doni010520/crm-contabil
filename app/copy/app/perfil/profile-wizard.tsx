"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveProfile } from "../../actions";
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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, ChevronLeft, ChevronRight, Check } from "lucide-react";
import type {
  EscritorioProfile,
  Nicho,
  Servico,
  CaseReal,
} from "@crm-contabil/copywriter-core";

const NICHO_OPTIONS: { value: Nicho; label: string }[] = [
  { value: "medicos", label: "Médicos" },
  { value: "dentistas", label: "Dentistas" },
  { value: "advogados", label: "Advogados" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "infoprodutores", label: "Infoprodutores" },
  { value: "restaurantes", label: "Restaurantes" },
  { value: "industria", label: "Indústria" },
  { value: "construcao", label: "Construção" },
  { value: "startups", label: "Startups" },
  { value: "holdings", label: "Holdings" },
  { value: "profissionais-liberais", label: "Profissionais Liberais" },
  { value: "mei", label: "MEI" },
  { value: "comercio-varejo", label: "Comércio / Varejo" },
  { value: "servicos-gerais", label: "Serviços Gerais" },
  { value: "transporte", label: "Transporte" },
  { value: "clinicas", label: "Clínicas" },
  { value: "tecnologia", label: "Tecnologia" },
];

const SERVICO_OPTIONS: { value: Servico; label: string }[] = [
  { value: "contabil", label: "Contabilidade" },
  { value: "fiscal", label: "Fiscal" },
  { value: "folha", label: "Folha de Pagamento" },
  { value: "tributario", label: "Tributário" },
  { value: "societario", label: "Societário" },
  { value: "bpo-financeiro", label: "BPO Financeiro" },
  { value: "irpf", label: "IRPF" },
  { value: "consultoria", label: "Consultoria" },
  { value: "abertura", label: "Abertura de Empresa" },
  { value: "troca", label: "Troca de Contador" },
  { value: "sucessorio", label: "Sucessório" },
];

interface ProfileWizardProps {
  initial: EscritorioProfile | null;
}

export function ProfileWizard({ initial }: ProfileWizardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState<EscritorioProfile>(
    initial || {
      nome: "",
      cidade: "",
      atendeRemoto: false,
      estadoAtuacao: "",
      crcUf: "",
      crcNumero: "",
      anosMercado: 0,
      faixaClientes: "1-50",
      nichos: [],
      servicos: [],
      modeloPreco: "sob-consulta",
      diferenciais: ["", "", ""],
      persona: "",
      doresPrincipais: ["", "", ""],
      cases: [],
      tomDeVoz: "proximo-direto",
      ctaPrimario: "diagnostico-gratuito",
    }
  );

  function update<K extends keyof EscritorioProfile>(
    key: K,
    value: EscritorioProfile[K]
  ) {
    setProfile((p) => ({ ...p, [key]: value }));
  }

  function toggleNicho(n: Nicho) {
    const exists = profile.nichos.includes(n);
    if (exists) update("nichos", profile.nichos.filter((x) => x !== n));
    else if (profile.nichos.length < 3) update("nichos", [...profile.nichos, n]);
  }

  function toggleServico(s: Servico) {
    const exists = profile.servicos.includes(s);
    if (exists) update("servicos", profile.servicos.filter((x) => x !== s));
    else update("servicos", [...profile.servicos, s]);
  }

  function updateDiferencial(i: 0 | 1 | 2, value: string) {
    const novo = [...profile.diferenciais] as [string, string, string];
    novo[i] = value;
    update("diferenciais", novo);
  }

  function updateDor(i: 0 | 1 | 2, value: string) {
    const novo = [...profile.doresPrincipais] as [string, string, string];
    novo[i] = value;
    update("doresPrincipais", novo);
  }

  function addCase() {
    if (profile.cases.length >= 3) return;
    update("cases", [...profile.cases, { segmento: "", porte: "", resultado: "" }]);
  }

  function removeCase(i: number) {
    update("cases", profile.cases.filter((_, idx) => idx !== i));
  }

  function updateCase(i: number, field: keyof CaseReal, value: string) {
    const novo = [...profile.cases];
    novo[i] = { ...novo[i], [field]: value };
    update("cases", novo);
  }

  function canAdvance(): boolean {
    if (step === 1) return !!(profile.nome && profile.cidade && profile.crcUf && profile.crcNumero);
    if (step === 2) return profile.nichos.length > 0 && profile.servicos.length > 0;
    if (step === 3) {
      return (
        profile.diferenciais.every((d) => d.trim().length > 0) &&
        profile.doresPrincipais.every((d) => d.trim().length > 0) &&
        profile.persona.trim().length > 0
      );
    }
    return true;
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      try {
        await saveProfile(profile);
        router.push("/copy/app");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao salvar");
      }
    });
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`size-8 rounded-full flex items-center justify-center text-sm font-medium ${
                s === step
                  ? "bg-primary text-primary-foreground"
                  : s < step
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {s < step ? <Check className="size-4" /> : s}
            </div>
            {s < 4 && <div className="h-px bg-border w-8" />}
          </div>
        ))}
        <span className="ml-3 text-sm text-muted-foreground">
          {step === 1 && "Identidade"}
          {step === 2 && "Posicionamento"}
          {step === 3 && "Diferencial e cliente"}
          {step === 4 && "Tom e conversão"}
        </span>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          {step === 1 && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome">Nome do escritório *</Label>
                <Input id="nome" value={profile.nome} onChange={(e) => update("nome", e.target.value)} placeholder="Contabilidade Andrade" />
              </div>
              <div>
                <Label htmlFor="cidade">Cidade *</Label>
                <Input id="cidade" value={profile.cidade} onChange={(e) => update("cidade", e.target.value)} placeholder="Belo Horizonte" />
              </div>
              <div>
                <Label htmlFor="bairro">Bairro principal</Label>
                <Input id="bairro" value={profile.bairroPrincipal || ""} onChange={(e) => update("bairroPrincipal", e.target.value)} placeholder="Savassi" />
              </div>
              <div>
                <Label htmlFor="uf">Estado (UF) *</Label>
                <Input id="uf" value={profile.estadoAtuacao} onChange={(e) => update("estadoAtuacao", e.target.value.toUpperCase())} placeholder="MG" maxLength={2} />
              </div>
              <div>
                <Label htmlFor="crc_uf">CRC UF *</Label>
                <Input id="crc_uf" value={profile.crcUf} onChange={(e) => update("crcUf", e.target.value.toUpperCase())} placeholder="MG" maxLength={2} />
              </div>
              <div>
                <Label htmlFor="crc_num">CRC Número *</Label>
                <Input id="crc_num" value={profile.crcNumero} onChange={(e) => update("crcNumero", e.target.value)} placeholder="045812" />
              </div>
              <div>
                <Label htmlFor="anos">Anos de mercado</Label>
                <Input id="anos" type="number" value={profile.anosMercado} onChange={(e) => update("anosMercado", parseInt(e.target.value || "0"))} />
              </div>
              <div>
                <Label>Faixa de clientes ativos</Label>
                <Select value={profile.faixaClientes} onValueChange={(v) => update("faixaClientes", v as EscritorioProfile["faixaClientes"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-50">1 a 50</SelectItem>
                    <SelectItem value="50-200">50 a 200</SelectItem>
                    <SelectItem value="200-500">200 a 500</SelectItem>
                    <SelectItem value="500+">500+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 sm:col-span-2 pt-2">
                <input
                  type="checkbox"
                  id="remoto"
                  checked={profile.atendeRemoto}
                  onChange={(e) => update("atendeRemoto", e.target.checked)}
                  className="size-4"
                />
                <Label htmlFor="remoto">Atende clientes remotamente (todo o Brasil)</Label>
              </div>
            </div>
          )}

          {step === 2 && (
            <>
              <div>
                <Label>Nichos principais * (até 3)</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  É o input que mais diferencia copy genérica de copy de especialista.
                </p>
                <div className="flex flex-wrap gap-2">
                  {NICHO_OPTIONS.map((n) => (
                    <Badge
                      key={n.value}
                      variant={profile.nichos.includes(n.value) ? "default" : "outline"}
                      className="cursor-pointer text-sm py-1 px-2.5"
                      onClick={() => toggleNicho(n.value)}
                    >
                      {n.label}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">Selecionados: {profile.nichos.length}/3</p>
              </div>

              <div className="pt-4">
                <Label>Serviços oferecidos *</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {SERVICO_OPTIONS.map((s) => (
                    <Badge
                      key={s.value}
                      variant={profile.servicos.includes(s.value) ? "default" : "outline"}
                      className="cursor-pointer text-sm py-1 px-2.5"
                      onClick={() => toggleServico(s.value)}
                    >
                      {s.label}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="pt-4 grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Modelo de preço</Label>
                  <Select value={profile.modeloPreco} onValueChange={(v) => update("modeloPreco", v as EscritorioProfile["modeloPreco"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transparente">Transparente (mostro o preço)</SelectItem>
                      <SelectItem value="faixa-por-porte">Faixa por porte</SelectItem>
                      <SelectItem value="sob-consulta">Sob consulta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {profile.modeloPreco !== "sob-consulta" && (
                  <div>
                    <Label htmlFor="preco">Preço inicial mensal (R$)</Label>
                    <Input
                      id="preco"
                      type="number"
                      value={profile.precoInicialMensal || ""}
                      onChange={(e) => update("precoInicialMensal", e.target.value ? parseFloat(e.target.value) : undefined)}
                      placeholder="397"
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <Label>3 diferenciais reais *</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Concreto. Ex: "Contador dedicado nominal", "Resposta em 4h úteis".
                </p>
                {[0, 1, 2].map((i) => (
                  <Input
                    key={i}
                    className="mb-2"
                    value={profile.diferenciais[i] || ""}
                    onChange={(e) => updateDiferencial(i as 0 | 1 | 2, e.target.value)}
                    placeholder={`Diferencial ${i + 1}`}
                  />
                ))}
              </div>

              <div className="pt-4">
                <Label htmlFor="persona">Persona / cliente ideal *</Label>
                <Textarea
                  id="persona"
                  value={profile.persona}
                  onChange={(e) => update("persona", e.target.value)}
                  placeholder="Ex: Médico PJ ou recém-saído da CLT, faturando R$ 20k a 80k/mês."
                  rows={3}
                />
              </div>

              <div className="pt-4">
                <Label>3 dores principais que você resolve *</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Em linguagem do cliente, não em jargão técnico.
                </p>
                {[0, 1, 2].map((i) => (
                  <Input
                    key={i}
                    className="mb-2"
                    value={profile.doresPrincipais[i] || ""}
                    onChange={(e) => updateDor(i as 0 | 1 | 2, e.target.value)}
                    placeholder={`Dor ${i + 1}`}
                  />
                ))}
              </div>

              <div className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <Label>Cases reais (até 3)</Label>
                  {profile.cases.length < 3 && (
                    <Button type="button" variant="outline" size="sm" onClick={addCase}>
                      <Plus className="size-4 mr-1" /> Adicionar
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  Cases com números reais geram depoimentos confiáveis (zero inventados).
                </p>
                {profile.cases.map((c, i) => (
                  <div key={i} className="border rounded-md p-3 mb-2 grid sm:grid-cols-3 gap-2 relative">
                    <Input value={c.segmento} onChange={(e) => updateCase(i, "segmento", e.target.value)} placeholder="Segmento" />
                    <Input value={c.porte} onChange={(e) => updateCase(i, "porte", e.target.value)} placeholder="Porte" />
                    <Input value={c.resultado} onChange={(e) => updateCase(i, "resultado", e.target.value)} placeholder="Resultado" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-1 right-1"
                      onClick={() => removeCase(i)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div>
                <Label>Tom de voz *</Label>
                <Select value={profile.tomDeVoz} onValueChange={(v) => update("tomDeVoz", v as EscritorioProfile["tomDeVoz"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="formal-consultivo">Formal-consultivo (médicos, advogados, holdings)</SelectItem>
                    <SelectItem value="proximo-direto">Próximo-direto (varejo, restaurantes, MEI)</SelectItem>
                    <SelectItem value="informal-tecnologico">Informal-tecnológico (startups, infoprodutores, e-commerce)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4">
                <Label>CTA primário *</Label>
                <Select value={profile.ctaPrimario} onValueChange={(v) => update("ctaPrimario", v as EscritorioProfile["ctaPrimario"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diagnostico-gratuito">Diagnóstico Gratuito</SelectItem>
                    <SelectItem value="falar-especialista">Falar com Especialista</SelectItem>
                    <SelectItem value="solicitar-proposta">Solicitar Proposta</SelectItem>
                    <SelectItem value="abrir-empresa">Abrir minha Empresa</SelectItem>
                    <SelectItem value="simular-economia">Simular Economia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4 grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="whatsapp">WhatsApp comercial</Label>
                  <Input id="whatsapp" value={profile.whatsapp || ""} onChange={(e) => update("whatsapp", e.target.value)} placeholder="31999998888" />
                </div>
                <div>
                  <Label htmlFor="gmb">Link Google Meu Negócio</Label>
                  <Input id="gmb" value={profile.linkGoogleMeuNegocio || ""} onChange={(e) => update("linkGoogleMeuNegocio", e.target.value)} placeholder="https://g.page/..." />
                </div>
              </div>
            </>
          )}

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">{error}</div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between mt-6">
        <Button variant="outline" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}>
          <ChevronLeft className="size-4 mr-1" /> Voltar
        </Button>
        {step < 4 ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canAdvance()}>
            Próximo <ChevronRight className="size-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? "Salvando..." : "Salvar perfil"}
          </Button>
        )}
      </div>
    </div>
  );
}
