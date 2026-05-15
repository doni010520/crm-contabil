// ---------------------------------------------------------------------------
// POST /api/public/lead-magnet
// ---------------------------------------------------------------------------
// Captura email/WhatsApp de quem quer baixar um material gratuito
// (kit das iscas, PDF de prompts, etc.). Salva como contato do tenant
// principal (configurado em NEXT_PUBLIC_ISCAS_TENANT_SLUG) e devolve
// a URL de download do material solicitado.
// ---------------------------------------------------------------------------

import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

const TENANT_SLUG =
  process.env.NEXT_PUBLIC_ISCAS_TENANT_SLUG || "teste-adonias";

type MagnetType = "kit-iscas" | "prompts-pdf";

const DOWNLOAD_URLS: Record<MagnetType, string> = {
  // Coloque os arquivos em public/downloads/ para esses caminhos funcionarem.
  // Por enquanto sao placeholders — o ZIP/PDF reais sao gerados separadamente.
  "kit-iscas": "/downloads/kit-iscas.zip",
  "prompts-pdf": "/downloads/prompts-aula.pdf",
};

const MAGNET_LABELS: Record<MagnetType, string> = {
  "kit-iscas": "Kit das 4 Iscas (DIY)",
  "prompts-pdf": "PDF dos prompts da aula",
};

interface RequestBody {
  name: string;
  email: string;
  whatsapp: string;
  magnet: MagnetType;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;

    if (!body.name || !body.email || !body.whatsapp || !body.magnet) {
      return NextResponse.json(
        { error: "Nome, email, WhatsApp e tipo de material sao obrigatorios" },
        { status: 400 }
      );
    }

    if (!DOWNLOAD_URLS[body.magnet]) {
      return NextResponse.json(
        { error: "Tipo de material invalido" },
        { status: 400 }
      );
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    );

    // 1. Localiza tenant configurado
    const { data: tenant } = await supabase
      .from("tenants")
      .select("id")
      .eq("slug", TENANT_SLUG)
      .single();

    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant nao encontrado" },
        { status: 500 }
      );
    }

    // 2. Cria/atualiza contato (lead) no pipeline
    const phoneDigits = body.whatsapp.replace(/\D/g, "");
    const { data: existing } = await supabase
      .from("contacts")
      .select("id, tags")
      .eq("tenant_id", tenant.id)
      .eq("phone", phoneDigits)
      .maybeSingle();

    const magnetTag = `lead-magnet:${body.magnet}`;

    if (existing) {
      const tags = Array.from(
        new Set([...(existing.tags || []), magnetTag, "lead-magnet"])
      );
      await supabase
        .from("contacts")
        .update({
          name: body.name,
          email: body.email,
          tags,
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("contacts").insert({
        tenant_id: tenant.id,
        name: body.name,
        email: body.email,
        phone: phoneDigits,
        type: "lead",
        tags: [magnetTag, "lead-magnet", "iscas-page"],
        source: "organic",
      });
    }

    return NextResponse.json({
      ok: true,
      downloadUrl: DOWNLOAD_URLS[body.magnet],
      magnetLabel: MAGNET_LABELS[body.magnet],
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro interno" },
      { status: 500 }
    );
  }
}
