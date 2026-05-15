"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface MeetingBriefing {
  id: string;
  tenant_id: string;
  contact_id: string | null;
  pipeline_entry_id: string | null;
  name: string;
  status: string;
  cnpj: string | null;
  enrichment_data: Record<string, unknown>;
  manual_inputs: Record<string, unknown>;
  content: string | null;
  content_sections: Record<string, string>;
  error_message: string | null;
  generated_at: string | null;
  created_at: string;
  updated_at: string;
  contact?: {
    id: string;
    name: string;
    company_name: string | null;
    email: string | null;
    cnpj: string | null;
  } | null;
}

// Get all briefings
export async function getBriefings(): Promise<MeetingBriefing[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meeting_briefings")
    .select(`*, contact:contacts!contact_id(id, name, company_name, email)`)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as unknown as MeetingBriefing[]) ?? [];
}

// Get single briefing
export async function getBriefing(id: string): Promise<MeetingBriefing | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meeting_briefings")
    .select(`*, contact:contacts!contact_id(id, name, company_name, email)`)
    .eq("id", id)
    .single();
  if (error) return null;
  return data as unknown as MeetingBriefing;
}

// Create briefing
export async function createBriefing(formData: {
  name: string;
  cnpj?: string;
  contact_id?: string;
  pipeline_entry_id?: string;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nao autenticado.");

  const { data: dbUser } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("auth_id", user.id)
    .single();
  if (!dbUser) throw new Error("Usuario nao encontrado.");

  const { data, error } = await supabase
    .from("meeting_briefings")
    .insert({
      tenant_id: dbUser.tenant_id,
      name: formData.name,
      cnpj: formData.cnpj || null,
      contact_id: formData.contact_id || null,
      pipeline_entry_id: formData.pipeline_entry_id || null,
      status: "draft",
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/diagnostics");
  return data;
}

// Update briefing enrichment data
export async function updateEnrichment(
  id: string,
  enrichment_data: Record<string, unknown>,
  cnpj: string
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("meeting_briefings")
    .update({ enrichment_data, cnpj, status: "draft" })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/diagnostics/${id}`);
}

// Update manual inputs
export async function updateManualInputs(
  id: string,
  manual_inputs: Record<string, unknown>
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("meeting_briefings")
    .update({ manual_inputs })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/diagnostics/${id}`);
}

// Generate briefing (calls mock for now)
export async function generateBriefing(id: string) {
  const supabase = await createClient();

  // Update status
  await supabase
    .from("meeting_briefings")
    .update({ status: "generating" })
    .eq("id", id);

  // Get the briefing data
  const { data: briefing } = await supabase
    .from("meeting_briefings")
    .select("*")
    .eq("id", id)
    .single();

  if (!briefing) throw new Error("Briefing não encontrado");

  try {
    const enrichment = (briefing.enrichment_data || {}) as Record<
      string,
      string | boolean | number
    >;
    const manual = (briefing.manual_inputs || {}) as Record<
      string,
      string | string[] | number | boolean
    >;

    const prospect = {
      company_name: (enrichment.company_name as string) || briefing.name,
      trade_name: enrichment.trade_name as string,
      cnae_code: enrichment.cnae_code as string,
      cnae_description: enrichment.cnae_description as string,
      tax_regime: enrichment.tax_regime as string,
      company_size: enrichment.company_size as string,
      state: enrichment.state as string,
      city: enrichment.city as string,
      founding_date: enrichment.founding_date as string,
      has_branches: enrichment.has_branches as boolean,
      monthly_revenue: manual.monthly_revenue as number,
      monthly_payroll: manual.monthly_payroll as number,
      employee_count: manual.employee_count as number,
      monthly_invoices: manual.monthly_invoices as number,
      current_accountant: manual.current_accountant as string,
      switching_reason: manual.switching_reason as string,
      main_pain: manual.main_pain as string[],
      additional_notes: manual.additional_notes as string,
    };

    // Get tenant info for office data
    const { data: tenantData } = await supabase
      .from("tenants")
      .select("*")
      .limit(1)
      .single();

    const office = {
      office_name: tenantData?.company_name || "Escritório",
      office_niche: "",
      office_services: [] as string[],
      office_differentials: "",
      package_prices: undefined as
        | { essencial?: number; profissional?: number; estrategico?: number }
        | undefined,
    };

    // Generate mock content
    const content = generateMockContent(prospect, office);

    // Parse sections
    const sections = parseSectionsFromContent(content);

    await supabase
      .from("meeting_briefings")
      .update({
        content,
        content_sections: sections,
        status: "completed",
        generated_at: new Date().toISOString(),
      })
      .eq("id", id);

    revalidatePath(`/diagnostics/${id}`);
    revalidatePath("/diagnostics");
  } catch (err) {
    await supabase
      .from("meeting_briefings")
      .update({
        status: "error",
        error_message:
          err instanceof Error ? err.message : "Erro desconhecido",
      })
      .eq("id", id);
    throw err;
  }
}

// Delete briefing
export async function deleteBriefing(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("meeting_briefings")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/diagnostics");
}

// Search contacts for linking
export async function searchContacts(search: string) {
  const supabase = await createClient();
  let query = supabase
    .from("contacts")
    .select("id, name, company_name, email")
    .order("name")
    .limit(20);
  if (search) {
    const term = `%${search}%`;
    query = query.or(
      `name.ilike.${term},company_name.ilike.${term}`
    );
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

// ---------------------------------------------------------------------------
// Section parsing helper
// ---------------------------------------------------------------------------
function parseSectionsFromContent(content: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const sectionMap: [RegExp, string][] = [
    [/##\s*1\.\s*RESUMO/i, "summary"],
    [/##\s*2\.\s*SIMULA/i, "tax_simulation"],
    [/##\s*3\.\s*OPORTUNIDADES/i, "opportunities"],
    [/##\s*4\.\s*PONTOS/i, "risks"],
    [/##\s*5\.\s*DADOS/i, "sector_data"],
    [/##\s*6\.\s*AGENDA/i, "meeting_agenda"],
    [/##\s*7\.\s*PERGUNTAS/i, "spin_questions"],
    [/##\s*8\.\s*OBJE/i, "objection_handling"],
    [/##\s*9\.\s*ESTIMATIVA/i, "roi_estimate"],
    [/##\s*10\.\s*CALEND/i, "obligation_calendar"],
    [/##\s*11\.\s*CHECKLIST/i, "onboarding_checklist"],
    [/##\s*12\.\s*COLA/i, "cheat_sheet"],
  ];
  const positions: { key: string; start: number }[] = [];
  for (const [regex, key] of sectionMap) {
    const match = content.match(regex);
    if (match && match.index !== undefined)
      positions.push({ key, start: match.index });
  }
  positions.sort((a, b) => a.start - b.start);
  for (let i = 0; i < positions.length; i++) {
    const current = positions[i];
    const next = positions[i + 1];
    const sectionContent = next
      ? content.slice(current.start, next.start)
      : content.slice(current.start);
    const lines = sectionContent.split("\n");
    sections[current.key] = lines.slice(1).join("\n").trim();
  }
  return sections;
}

// ---------------------------------------------------------------------------
// Inline mock content generator (simplified version for CRM)
// ---------------------------------------------------------------------------
function generateMockContent(
  prospect: Record<string, unknown>,
  office: Record<string, unknown>
): string {
  const companyName = (prospect.trade_name ||
    prospect.company_name ||
    "Empresa") as string;
  const officeName = (office.office_name || "Escritório") as string;
  const hasRevenue = !!prospect.monthly_revenue;
  const revenue = (prospect.monthly_revenue || 0) as number;
  const payroll = (prospect.monthly_payroll || 0) as number;

  return `## 1. RESUMO DO PROSPECT
${companyName} é uma empresa do segmento de ${prospect.cnae_description || "serviços"}, enquadrada como ${prospect.company_size || "ME"} no regime ${prospect.tax_regime || "Simples Nacional"}. Localizada em ${prospect.city || "São Paulo"}/${prospect.state || "SP"}, ${prospect.employee_count ? `conta com ${prospect.employee_count} funcionários` : "número de funcionários não informado"} e ${hasRevenue ? `fatura aproximadamente R$ ${revenue.toLocaleString("pt-BR")}/mês` : "faturamento não informado"}.

## 2. SIMULAÇÃO DE REGIME TRIBUTÁRIO
${
  hasRevenue
    ? `**Simples Nacional** (Anexo III estimado):
- Faturamento anual estimado: R$ ${(revenue * 12).toLocaleString("pt-BR")}
- Alíquota efetiva estimada: 11,2%
- Imposto mensal estimado: R$ ${Math.round(revenue * 0.112).toLocaleString("pt-BR")}
${payroll > 0 ? `- Fator R: ${((payroll / revenue) * 100).toFixed(1)}%` : ""}

**Lucro Presumido** (presunção 32% serviços):
- Total mensal estimado: R$ ${Math.round(revenue * 0.32 * 0.24 + revenue * 0.0365).toLocaleString("pt-BR")}

**Recomendação**: ${revenue * 12 < 4800000 ? "Simples Nacional provavelmente mais vantajoso." : "Avaliar Lucro Presumido."}`
    : `Simulação não disponível — dados de faturamento não informados.`
}

## 3. OPORTUNIDADES IDENTIFICADAS
1. **Revisão de enquadramento tributário**: Verificar se o regime atual é o mais econômico.
2. **Recuperação de créditos tributários**: Potencial de R$ 15.000 a R$ 50.000 em créditos recuperáveis.
3. **Otimização da folha de pagamento**: Revisar benefícios fiscais do eSocial.
4. **Planejamento tributário preventivo**: Identificar contingências fiscais.
5. **Gestão financeira integrada**: Oferecer BPO financeiro como diferencial.

## 4. PONTOS DE ATENÇÃO E RISCOS
1. **Obrigações do eSocial**: Multas por eventos atrasados podem chegar a R$ 402,53 por empregado/mês.
2. **LGPD e compliance**: Multas podem chegar a 2% do faturamento.
3. **Fiscalização setorial**: CNAE ${prospect.cnae_code || "informado"} tem sido alvo de fiscalização.

## 5. DADOS DO SETOR
1. Segmento teve crescimento de 8,3% no último ano (IBGE).
2. Reforma tributária (CBS/IBS) vai impactar diretamente a partir de 2026.
3. 67% das empresas trocam de contador nos primeiros 3 anos por insatisfação com atendimento.
4. Ticket médio de honorários: R$ 800 a R$ 1.500/mês.

## 6. AGENDA SUGERIDA PARA A REUNIÃO
**Minutos 0-5 — Abertura e Rapport:**
"Obrigado por reservar esse tempo. Antes de falar do ${officeName}, queria entender melhor a ${companyName}."

**Minutos 5-15 — Qualificação (perguntas SPIN):**
Use as perguntas da seção 7.

**Minutos 15-22 — Diagnóstico:**
Mostre as oportunidades identificadas com números.

**Minutos 22-28 — Proposta de valor:**
Apresente os diferenciais e pacotes.

**Minutos 28-30 — Fechamento:**
"Qual desses pacotes faz mais sentido pra ${companyName} nesse momento?"

## 7. PERGUNTAS SPIN PERSONALIZADAS
**SITUAÇÃO:**
1. "Como funciona a rotina contábil da ${companyName} hoje?"
2. "Vocês recebem relatórios gerenciais do contador? Com que frequência?"
3. "Como está estruturado o departamento pessoal?"

**PROBLEMA:**
1. "Qual é a maior dificuldade com a parte contábil/fiscal?"
2. "Quando foi a última revisão do regime tributário?"
3. "Já tiveram algum susto com fiscalização nos últimos 2 anos?"

**IMPLICAÇÃO:**
1. "Se o regime não for ideal, pode significar R$ ${hasRevenue ? Math.round(revenue * 0.02 * 12).toLocaleString("pt-BR") : "X mil"} a mais por ano."
2. "Uma fiscalização com irregularidades pode ser retroativa a 5 anos."
3. "Sem relatórios, como tomam decisões sobre investir ou expandir?"

**NECESSIDADE-SOLUÇÃO:**
1. "Se existisse forma de ter tudo resolvido com relatórios claros, faria diferença?"
2. "O ideal seria um contador que só entrega guias, ou um parceiro estratégico?"

## 8. OBJEÇÕES PROVÁVEIS E RESPOSTAS
**"Vou pensar":**
Resposta: "Claro. Pensar sobre o quê especificamente? Posso te dar mais informações agora."
Retomada: "Se o investimento não fosse questão, você fecharia hoje?"

**"Está caro":**
Resposta: "${hasRevenue ? `Identifiquei economia de R$ ${Math.round(revenue * 0.02 * 12).toLocaleString("pt-BR")}/ano. Se paga em 3 meses.` : "Normalmente recuperam o valor em 3 meses."}"

**"Preciso falar com meu sócio":**
Resposta: "Posso agendar 15min com vocês dois pra apresentar os pontos principais?"

## 9. ESTIMATIVA DE ROI
${
  hasRevenue
    ? `**Economia potencial:** ~R$ ${Math.round(revenue * 0.02 * 12).toLocaleString("pt-BR")}/ano
**ROI:** Serviço se paga em 2-3 meses.`
    : `Sem dados completos. Coletar faturamento na reunião.`
}

## 10. CALENDÁRIO DE OBRIGAÇÕES
| Obrigação | Periodicidade | Vencimento | Penalidade |
|-----------|---------------|------------|------------|
| DAS | Mensal | Dia 20 | 0,33%/dia + Selic |
| DCTF | Mensal | 15º dia útil | R$ 500/mês |
| eSocial | Mensal | Dia 15 | R$ 402,53/evento |
| EFD-Reinf | Mensal | Dia 15 | R$ 500/mês |
| DEFIS | Anual | Março | R$ 500 a R$ 1.500 |

## 11. CHECKLIST DE ONBOARDING
- [ ] Contrato social e alterações
- [ ] Cartão CNPJ atualizado
- [ ] Certificado digital e-CNPJ
- [ ] Acesso ao e-CAC
- [ ] Último balanço patrimonial
- [ ] Últimas 3 DAS/guias pagas
- [ ] Relação de funcionários
- [ ] Extratos bancários (3 meses)
- [ ] Documentos dos sócios

## 12. COLA RÁPIDA
**3 dados impressionantes:**
1. ${companyName} — ${prospect.company_size || "ME"} no ${prospect.tax_regime || "Simples Nacional"}
2. ${hasRevenue ? `Fatura R$ ${revenue.toLocaleString("pt-BR")}/mês` : "Faturamento a descobrir"}
3. ${Array.isArray(prospect.main_pain) && prospect.main_pain.length > 0 ? `Dor: ${(prospect.main_pain as string[])[0]}` : "Sem dor declarada — investigar"}

**Pergunta de abertura:** "Como está o momento da ${companyName} hoje?"

**3 perguntas chave:**
1. "Última revisão do regime tributário?"
2. "Maior frustração com contabilidade?"
3. "Tranquilo se viesse uma fiscalização amanhã?"

**Frase de fechamento:** "Qual próximo passo faz mais sentido: diagnóstico completo ou já iniciar com um pacote?"`;
}
