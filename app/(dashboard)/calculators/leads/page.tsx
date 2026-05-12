import { getCalculatorLeads } from "../actions";
import { CalculatorLeadsClient } from "./calculator-leads-client";

export default async function CalculatorLeadsPage() {
  const leads = await getCalculatorLeads();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Leads das Calculadoras
        </h1>
        <p className="mt-1 text-muted-foreground">
          Todos os leads capturados pelas calculadoras públicas.
        </p>
      </div>

      <CalculatorLeadsClient initialLeads={leads} />
    </div>
  );
}
