"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  generateCopy,
  COPY_CREDITS_COST,
  type EscritorioProfile,
  type CopyGenerationParams,
  type CopyGenerationResult,
} from "@crm-contabil/copywriter-core";

// ---------------------------------------------------------------------------
// Helper — pega tenant_id e user_id do usuário autenticado
// ---------------------------------------------------------------------------
async function getAuthContext() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) throw new Error("Não autenticado");

  const { data: dbUser } = await supabase
    .from("users")
    .select("id, tenant_id")
    .eq("auth_id", authUser.id)
    .maybeSingle();

  if (!dbUser) throw new Error("Usuário sem tenant");

  return { supabase, userId: dbUser.id, tenantId: dbUser.tenant_id };
}

// ---------------------------------------------------------------------------
// Tipos serializados (DB) ↔ EscritorioProfile (package)
// ---------------------------------------------------------------------------
type DbProfileRow = {
  id: string;
  tenant_id: string;
  nome: string;
  cidade: string;
  bairro_principal: string | null;
  atende_remoto: boolean;
  estado_atuacao: string;
  crc_uf: string;
  crc_numero: string;
  anos_mercado: number;
  faixa_clientes: string;
  nichos: string[];
  servicos: string[];
  modelo_preco: string;
  preco_inicial_mensal: number | null;
  diferenciais: string[];
  persona: string;
  dores_principais: string[];
  cases: unknown;
  tom_de_voz: string;
  cta_primario: string;
  whatsapp: string | null;
  link_google_meu_negocio: string | null;
  selos: string[];
};

function dbRowToProfile(row: DbProfileRow): EscritorioProfile {
  const diferenciais = ensureThree(row.diferenciais);
  const dores = ensureThree(row.dores_principais);
  return {
    nome: row.nome,
    cidade: row.cidade,
    bairroPrincipal: row.bairro_principal || undefined,
    atendeRemoto: row.atende_remoto,
    estadoAtuacao: row.estado_atuacao,
    crcUf: row.crc_uf,
    crcNumero: row.crc_numero,
    anosMercado: row.anos_mercado,
    faixaClientes: row.faixa_clientes as EscritorioProfile["faixaClientes"],
    nichos: row.nichos as EscritorioProfile["nichos"],
    servicos: row.servicos as EscritorioProfile["servicos"],
    modeloPreco: row.modelo_preco as EscritorioProfile["modeloPreco"],
    precoInicialMensal: row.preco_inicial_mensal ?? undefined,
    diferenciais,
    persona: row.persona,
    doresPrincipais: dores,
    cases: Array.isArray(row.cases) ? (row.cases as EscritorioProfile["cases"]) : [],
    tomDeVoz: row.tom_de_voz as EscritorioProfile["tomDeVoz"],
    ctaPrimario: row.cta_primario as EscritorioProfile["ctaPrimario"],
    whatsapp: row.whatsapp || undefined,
    linkGoogleMeuNegocio: row.link_google_meu_negocio || undefined,
    selos: (row.selos as EscritorioProfile["selos"]) || [],
  };
}

function ensureThree(arr: string[]): [string, string, string] {
  const a = arr[0] || "";
  const b = arr[1] || "";
  const c = arr[2] || "";
  return [a, b, c];
}

// ---------------------------------------------------------------------------
// Profile — get / save
// ---------------------------------------------------------------------------

export async function getProfile(): Promise<EscritorioProfile | null> {
  const { supabase, tenantId } = await getAuthContext();
  const { data } = await supabase
    .from("escritorio_profile")
    .select("*")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (!data) return null;
  return dbRowToProfile(data as DbProfileRow);
}

export async function saveProfile(profile: EscritorioProfile): Promise<void> {
  const { supabase, tenantId } = await getAuthContext();

  const row = {
    tenant_id: tenantId,
    nome: profile.nome,
    cidade: profile.cidade,
    bairro_principal: profile.bairroPrincipal || null,
    atende_remoto: profile.atendeRemoto,
    estado_atuacao: profile.estadoAtuacao,
    crc_uf: profile.crcUf,
    crc_numero: profile.crcNumero,
    anos_mercado: profile.anosMercado,
    faixa_clientes: profile.faixaClientes,
    nichos: profile.nichos,
    servicos: profile.servicos,
    modelo_preco: profile.modeloPreco,
    preco_inicial_mensal: profile.precoInicialMensal ?? null,
    diferenciais: profile.diferenciais,
    persona: profile.persona,
    dores_principais: profile.doresPrincipais,
    cases: profile.cases,
    tom_de_voz: profile.tomDeVoz,
    cta_primario: profile.ctaPrimario,
    whatsapp: profile.whatsapp || null,
    link_google_meu_negocio: profile.linkGoogleMeuNegocio || null,
    selos: profile.selos || [],
  };

  const { error } = await supabase
    .from("escritorio_profile")
    .upsert(row, { onConflict: "tenant_id" });

  if (error) throw new Error(`Erro ao salvar perfil: ${error.message}`);

  revalidatePath("/copywriter");
}

// ---------------------------------------------------------------------------
// Credits — get / consume
// ---------------------------------------------------------------------------

export async function getCredits(): Promise<{
  saldo: number;
  plano: string;
  creditosMensais: number;
}> {
  const { supabase, tenantId } = await getAuthContext();
  const { data } = await supabase
    .from("copy_credits")
    .select("saldo, plano, creditos_mensais")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (!data) {
    // Cria registro free com 0 créditos (admin libera depois)
    await supabase.from("copy_credits").insert({
      tenant_id: tenantId,
      saldo: 0,
      plano: "free",
      creditos_mensais: 0,
    });
    return { saldo: 0, plano: "free", creditosMensais: 0 };
  }

  return {
    saldo: data.saldo,
    plano: data.plano,
    creditosMensais: data.creditos_mensais,
  };
}

// ---------------------------------------------------------------------------
// Generate copy — fluxo completo (verificar créditos → gerar → debitar → salvar)
// ---------------------------------------------------------------------------

export interface GenerateActionResult {
  ok: boolean;
  error?: string;
  generationId?: string;
  result?: CopyGenerationResult;
}

export async function generateCopyAction(
  geracao: CopyGenerationParams
): Promise<GenerateActionResult> {
  const { supabase, tenantId, userId } = await getAuthContext();

  // 1. Buscar perfil
  const profile = await getProfile();
  if (!profile) {
    return {
      ok: false,
      error: "Você precisa cadastrar o perfil do escritório primeiro.",
    };
  }

  // 2. Verificar créditos
  const custo = COPY_CREDITS_COST[geracao.modo];
  const credits = await getCredits();
  if (credits.saldo < custo) {
    return {
      ok: false,
      error: `Saldo insuficiente. Você tem ${credits.saldo} crédito(s), esta geração custa ${custo}.`,
    };
  }

  // 3. Consumir créditos atomicamente
  const { data: consumed } = await supabase.rpc("consume_copy_credits", {
    p_tenant_id: tenantId,
    p_amount: custo,
  });

  if (!consumed) {
    return { ok: false, error: "Falha ao debitar créditos." };
  }

  // 4. Gerar copy
  let result: CopyGenerationResult;
  try {
    result = await generateCopy({ escritorio: profile, geracao });
  } catch (err) {
    // Reembolso em caso de falha
    await supabase
      .from("copy_credits")
      .update({ saldo: credits.saldo })
      .eq("tenant_id", tenantId);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erro ao gerar copy",
    };
  }

  // 5. Salvar histórico
  const { data: gen } = await supabase
    .from("copy_generations")
    .insert({
      tenant_id: tenantId,
      user_id: userId,
      modo: geracao.modo,
      escritorio_snapshot: profile,
      params: geracao.params,
      output: result.output,
      creditos_consumidos: result.creditosConsumidos,
      tokens_input: result.tokensInput,
      tokens_output: result.tokensOutput,
      modelo_ia: result.modeloIA,
      avisos: result.avisos,
    })
    .select("id")
    .single();

  revalidatePath("/copywriter");

  return {
    ok: true,
    generationId: gen?.id,
    result: { ...result, generationId: gen?.id },
  };
}

// ---------------------------------------------------------------------------
// History
// ---------------------------------------------------------------------------

export interface HistoryEntry {
  id: string;
  modo: string;
  created_at: string;
  creditos_consumidos: number;
  modelo_ia: string;
}

export async function getHistory(limit = 50): Promise<HistoryEntry[]> {
  const { supabase, tenantId } = await getAuthContext();
  const { data } = await supabase
    .from("copy_generations")
    .select("id, modo, created_at, creditos_consumidos, modelo_ia")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data || []) as HistoryEntry[];
}

export async function getGeneration(id: string) {
  const { supabase, tenantId } = await getAuthContext();
  const { data } = await supabase
    .from("copy_generations")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  return data;
}
