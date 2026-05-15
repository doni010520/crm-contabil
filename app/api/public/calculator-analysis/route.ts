// ---------------------------------------------------------------------------
// POST /api/public/calculator-analysis
// ---------------------------------------------------------------------------
// Endpoint público (sem auth). Recebe os dados de uma calculadora pública
// já preenchida + nome do lead capturado e devolve a análise personalizada
// gerada por IA via copywriter-core.
//
// Chamado pelo public-calculator.tsx APÓS o gate de captura (não roda
// para visitantes que abandonam — economia de API).
// ---------------------------------------------------------------------------

import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import {
  generateCalculatorAnalysis,
  type EscritorioProfile,
  type CalculatorType,
  type TomDeVoz,
} from "@crm-contabil/copywriter-core";

interface RequestBody {
  calculator_id: string;
  calculator_type: CalculatorType;
  inputs: Record<string, unknown>;
  result: Record<string, unknown>;
  lead_name: string;
  score?: number;
  score_level?: string;
}

const TOM_MAP: Record<string, TomDeVoz> = {
  formal: "formal-consultivo",
  friendly: "proximo-direto",
  casual: "informal-tecnologico",
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;

    if (
      !body.calculator_id ||
      !body.calculator_type ||
      !body.inputs ||
      !body.result
    ) {
      return NextResponse.json(
        { error: "Payload incompleto" },
        { status: 400 }
      );
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: { getAll: () => [], setAll: () => {} },
      }
    );

    // 1. Resolve tenant via calculator_id (nunca confia no cliente)
    const { data: calculator } = await supabase
      .from("tenant_calculators")
      .select("id, tenant_id")
      .eq("id", body.calculator_id)
      .single();

    if (!calculator) {
      return NextResponse.json(
        { error: "Calculadora não encontrada" },
        { status: 404 }
      );
    }

    // 2. Constrói perfil mínimo do escritório a partir do tenant + gmb_connection
    const [tenantRes, gmbRes] = await Promise.all([
      supabase.from("tenants").select("name, settings").eq("id", calculator.tenant_id).single(),
      supabase.from("gmb_connections").select("office_name_gmb, post_tone").eq("tenant_id", calculator.tenant_id).maybeSingle(),
    ]);

    const tenant = tenantRes.data;
    const gmb = gmbRes.data;

    const settings = (tenant?.settings || {}) as Record<string, unknown>;
    const nome = (gmb?.office_name_gmb || tenant?.name || "Escritório").toString();
    const cidade = (settings.cidade as string) || "sua cidade";
    const estado = (settings.estado_atuacao as string) || "BR";

    const tomDeVoz: TomDeVoz =
      TOM_MAP[(gmb?.post_tone as string) || "friendly"] || "proximo-direto";

    const escritorio: EscritorioProfile = {
      nome,
      cidade,
      atendeRemoto: false,
      estadoAtuacao: estado,
      crcUf: estado,
      crcNumero: "—",
      anosMercado: 0,
      faixaClientes: "1-50",
      nichos: [],
      servicos: ["contabil", "fiscal", "folha"],
      modeloPreco: "sob-consulta",
      diferenciais: [
        "Atendimento próximo e direto",
        "Resposta rápida a dúvidas fiscais",
        "Plataforma digital",
      ],
      persona: "Empresário(a) buscando um contador parceiro",
      doresPrincipais: [
        "Empresa pagando imposto a mais por estar no regime errado",
        "Contador atual demora dias para responder",
        "Falta de orientação sobre prazos fiscais",
      ],
      cases: [],
      tomDeVoz,
      ctaPrimario: "diagnostico-gratuito",
    };

    // 3. Gera análise
    const result = await generateCalculatorAnalysis(escritorio, {
      calculatorType: body.calculator_type,
      calculatorInputs: body.inputs,
      calculatorResult: body.result,
      leadName: body.lead_name,
      score: body.score,
      scoreLevel: body.score_level,
    });

    if (result.output.tipo !== "calculator-analysis") {
      return NextResponse.json(
        { error: "Erro na geração" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      analysis: result.output.conteudo,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro interno" },
      { status: 500 }
    );
  }
}
