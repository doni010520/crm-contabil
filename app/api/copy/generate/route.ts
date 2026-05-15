import { NextRequest } from "next/server";
import { generateCopyAction } from "@/app/copy/actions";
import type { CopyGenerationParams } from "@crm-contabil/copywriter-core";

// ---------------------------------------------------------------------------
// POST /api/copy/generate
// ---------------------------------------------------------------------------
// Endpoint REST para integrações externas (ex: n8n, automações).
// Reusa o server action que já faz autenticação, débito de créditos e
// salvamento no histórico.
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  let body: { geracao: CopyGenerationParams };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!body.geracao || !body.geracao.modo) {
    return Response.json(
      { error: 'Payload deve conter { geracao: { modo, params } }' },
      { status: 400 }
    );
  }

  try {
    const result = await generateCopyAction(body.geracao);
    if (!result.ok) {
      return Response.json({ error: result.error }, { status: 400 });
    }
    return Response.json({
      generationId: result.generationId,
      result: result.result,
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Erro interno" },
      { status: 500 }
    );
  }
}
