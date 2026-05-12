import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      tenant_id,
      calculator_id,
      calculator_type,
      name,
      phone,
      email,
      company_name,
      inputs,
      result,
      score,
      score_level,
    } = body;

    if (!tenant_id || !calculator_id || !calculator_type || !name || !phone) {
      return NextResponse.json(
        { error: "Campos obrigatórios faltando." },
        { status: 400 }
      );
    }

    // Use service role client (no auth needed for public route)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll: () => [],
          setAll: () => {},
        },
      }
    );

    // 1. Find or create contact
    const phoneDigits = phone.replace(/\D/g, "");
    const { data: existingContact } = await supabase
      .from("contacts")
      .select("id")
      .eq("tenant_id", tenant_id)
      .eq("phone", phoneDigits)
      .maybeSingle();

    let contactId: string;

    if (existingContact) {
      contactId = existingContact.id;
    } else {
      const { data: newContact, error: contactError } = await supabase
        .from("contacts")
        .insert({
          tenant_id,
          name,
          phone: phoneDigits,
          email: email || null,
          company_name: company_name || null,
          type: "lead",
          source: "organic",
          tags: ["calculadora"],
          notes: `Lead captado via calculadora: ${calculator_type}`,
        })
        .select("id")
        .single();

      if (contactError || !newContact) {
        console.error("Error creating contact:", contactError);
        return NextResponse.json(
          { error: "Erro ao criar contato." },
          { status: 500 }
        );
      }

      contactId = newContact.id;
    }

    // 2. Create calculator lead record
    const { error: leadError } = await supabase
      .from("calculator_leads")
      .insert({
        tenant_id,
        calculator_id,
        contact_id: contactId,
        calculator_type,
        name,
        phone: phoneDigits,
        email: email || null,
        company_name: company_name || null,
        inputs: inputs || {},
        result: result || {},
        score: score ?? null,
        score_level: score_level || null,
        source: "calculadora",
      });

    if (leadError) {
      console.error("Error creating calculator lead:", leadError);
      return NextResponse.json(
        { error: "Erro ao registrar lead." },
        { status: 500 }
      );
    }

    // 3. Create pipeline entry in first stage ("Lead Novo" or first by position)
    const { data: firstStage } = await supabase
      .from("pipeline_stages")
      .select("id")
      .eq("tenant_id", tenant_id)
      .order("position", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (firstStage) {
      // Check if contact already has an entry
      const { data: existingEntry } = await supabase
        .from("pipeline_entries")
        .select("id")
        .eq("tenant_id", tenant_id)
        .eq("contact_id", contactId)
        .maybeSingle();

      if (!existingEntry) {
        await supabase.from("pipeline_entries").insert({
          tenant_id,
          contact_id: contactId,
          stage_id: firstStage.id,
          entered_at: new Date().toISOString(),
          notes: `Lead captado via calculadora: ${calculator_type}`,
        });
      }
    }

    // 4. Increment leads_count on the calculator
    const { data: calc } = await supabase
      .from("tenant_calculators")
      .select("leads_count")
      .eq("id", calculator_id)
      .single();

    if (calc) {
      await supabase
        .from("tenant_calculators")
        .update({ leads_count: (calc.leads_count || 0) + 1 })
        .eq("id", calculator_id);
    }

    return NextResponse.json({ success: true, contact_id: contactId });
  } catch (error) {
    console.error("Calculator lead API error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
