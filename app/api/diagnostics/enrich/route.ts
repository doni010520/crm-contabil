import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    // Verify auth
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { cnpj } = body;

    if (!cnpj) {
      return NextResponse.json(
        { error: "CNPJ é obrigatório" },
        { status: 400 }
      );
    }

    // Clean CNPJ — digits only
    const cleanCnpj = cnpj.replace(/\D/g, "");

    if (cleanCnpj.length !== 14) {
      return NextResponse.json(
        { error: "CNPJ inválido — deve ter 14 dígitos" },
        { status: 400 }
      );
    }

    // Call Brasil API
    const response = await fetch(
      `https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`,
      { next: { revalidate: 86400 } } // cache for 24h
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Não foi possível consultar o CNPJ. Verifique e tente novamente." },
        { status: 422 }
      );
    }

    const apiData = await response.json();

    // Map to enrichment format
    const enrichment: Record<string, unknown> = {
      company_name: apiData.razao_social || "",
      trade_name: apiData.nome_fantasia || "",
      cnae_code: apiData.cnae_fiscal?.toString() || "",
      cnae_description: apiData.cnae_fiscal_descricao || "",
      tax_regime: apiData.opcao_pelo_simples ? "Simples Nacional" : "Lucro Presumido",
      company_size: apiData.porte || "",
      state: apiData.uf || "",
      city: apiData.municipio || "",
      founding_date: apiData.data_inicio_atividade || "",
      address: [
        apiData.logradouro,
        apiData.numero,
        apiData.complemento,
        apiData.bairro,
        apiData.municipio,
        apiData.uf,
      ]
        .filter(Boolean)
        .join(", "),
      status: apiData.situacao_cadastral || "",
      has_branches: false,
      partners:
        apiData.qsa?.map(
          (q: { nome_socio: string; qualificacao_socio: string }) => ({
            name: q.nome_socio,
            role: q.qualificacao_socio,
          })
        ) || [],
      secondary_cnaes:
        apiData.cnaes_secundarios?.map(
          (c: { codigo: number; descricao: string }) => ({
            code: c.codigo?.toString(),
            description: c.descricao,
          })
        ) || [],
    };

    return NextResponse.json({ enrichment, cnpj: cleanCnpj });
  } catch (err) {
    console.error("Enrich error:", err);
    return NextResponse.json(
      { error: "Erro interno ao consultar CNPJ" },
      { status: 500 }
    );
  }
}
