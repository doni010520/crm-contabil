"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  generateCopy,
  COPY_CREDITS_COST,
  type EscritorioProfile,
  type CopyGenerationParams,
  type CopyGenerationResult,
} from "@crm-contabil/copywriter-core";

// ---------------------------------------------------------------------------
// Auth — copywriter standalone usa Supabase Auth + tabela copywriter_accounts
// ---------------------------------------------------------------------------
export async function getCurrentAccount() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;

  const { data: account } = await supabase
    .from("copywriter_accounts")
    .select("id, email, nome")
    .eq("auth_id", authUser.id)
    .maybeSingle();

  return account ? { ...account, auth_id: authUser.id } : null;
}

async function requireAccount() {
  const account = await getCurrentAccount();
  if (!account) redirect("/copy/login");
  return account;
}

// ---------------------------------------------------------------------------
// Signup — cria conta + 5 créditos trial
// ---------------------------------------------------------------------------
export async function signup(
  email: string,
  password: string,
  nome: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nome },
    },
  });
  if (error) return { ok: false, error: error.message };
  if (!data.user) return { ok: false, error: "Falha ao criar usuário" };

  // Cria account + credits trial (RPC roda como SECURITY DEFINER)
  const { error: rpcError } = await supabase.rpc("create_copywriter_account", {
    p_email: email,
    p_nome: nome,
  });
  if (rpcError) return { ok: false, error: rpcError.message };

  return { ok: true };
}

export async function login(
  email: string,
  password: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/copy");
}

// ---------------------------------------------------------------------------
// Profile — get / save
// ---------------------------------------------------------------------------
type DbProfileRow = {
  id: string;
  account_id: string;
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

function ensureThree(arr: string[]): [string, string, string] {
  return [arr[0] || "", arr[1] || "", arr[2] || ""];
}

function dbRowToProfile(row: DbProfileRow): EscritorioProfile {
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
    diferenciais: ensureThree(row.diferenciais),
    persona: row.persona,
    doresPrincipais: ensureThree(row.dores_principais),
    cases: Array.isArray(row.cases) ? (row.cases as EscritorioProfile["cases"]) : [],
    tomDeVoz: row.tom_de_voz as EscritorioProfile["tomDeVoz"],
    ctaPrimario: row.cta_primario as EscritorioProfile["ctaPrimario"],
    whatsapp: row.whatsapp || undefined,
    linkGoogleMeuNegocio: row.link_google_meu_negocio || undefined,
    selos: (row.selos as EscritorioProfile["selos"]) || [],
  };
}

export async function getProfile(): Promise<EscritorioProfile | null> {
  const account = await requireAccount();
  const supabase = await createClient();
  const { data } = await supabase
    .from("copywriter_profile")
    .select("*")
    .eq("account_id", account.id)
    .maybeSingle();

  if (!data) return null;
  return dbRowToProfile(data as DbProfileRow);
}

export async function saveProfile(profile: EscritorioProfile): Promise<void> {
  const account = await requireAccount();
  const supabase = await createClient();

  const row = {
    account_id: account.id,
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
    .from("copywriter_profile")
    .upsert(row, { onConflict: "account_id" });

  if (error) throw new Error(`Erro ao salvar perfil: ${error.message}`);
  revalidatePath("/copy/app");
}

// ---------------------------------------------------------------------------
// Credits
// ---------------------------------------------------------------------------
export async function getCredits(): Promise<{
  saldo: number;
  plano: string;
  creditosMensais: number;
}> {
  const account = await requireAccount();
  const supabase = await createClient();
  const { data } = await supabase
    .from("copywriter_credits")
    .select("saldo, plano, creditos_mensais")
    .eq("account_id", account.id)
    .maybeSingle();

  if (!data) return { saldo: 0, plano: "trial", creditosMensais: 0 };
  return {
    saldo: data.saldo,
    plano: data.plano,
    creditosMensais: data.creditos_mensais,
  };
}

// ---------------------------------------------------------------------------
// Generate copy
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
  const account = await requireAccount();
  const supabase = await createClient();

  const profile = await getProfile();
  if (!profile) {
    return {
      ok: false,
      error: "Você precisa cadastrar o perfil do escritório primeiro.",
    };
  }

  const custo = COPY_CREDITS_COST[geracao.modo];
  const credits = await getCredits();
  if (credits.saldo < custo) {
    return {
      ok: false,
      error: `Saldo insuficiente. Você tem ${credits.saldo} crédito(s), esta geração custa ${custo}.`,
    };
  }

  const { data: consumed } = await supabase.rpc("consume_copywriter_credits", {
    p_amount: custo,
  });

  if (!consumed) {
    return { ok: false, error: "Falha ao debitar créditos." };
  }

  let result: CopyGenerationResult;
  try {
    result = await generateCopy({ escritorio: profile, geracao });
  } catch (err) {
    // Reembolso em caso de falha
    await supabase
      .from("copywriter_credits")
      .update({ saldo: credits.saldo })
      .eq("account_id", account.id);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erro ao gerar copy",
    };
  }

  const { data: gen } = await supabase
    .from("copywriter_generations")
    .insert({
      account_id: account.id,
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

  revalidatePath("/copy/app");

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
  const account = await requireAccount();
  const supabase = await createClient();
  const { data } = await supabase
    .from("copywriter_generations")
    .select("id, modo, created_at, creditos_consumidos, modelo_ia")
    .eq("account_id", account.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data || []) as HistoryEntry[];
}

export async function getGeneration(id: string) {
  const account = await requireAccount();
  const supabase = await createClient();
  const { data } = await supabase
    .from("copywriter_generations")
    .select("*")
    .eq("id", id)
    .eq("account_id", account.id)
    .maybeSingle();

  return data;
}
