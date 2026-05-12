import { getCalculators, initCalculators, getTenantSlug } from "./actions";
import { CalculatorCards } from "./calculator-cards";

export default async function CalculatorsPage() {
  let calculators = await getCalculators();

  if (calculators.length === 0) {
    await initCalculators();
    calculators = await getCalculators();
  }

  const tenantSlug = await getTenantSlug();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Calculadoras</h1>
        <p className="mt-1 text-muted-foreground">
          Calculadoras públicas para captar leads automaticamente no seu pipeline.
        </p>
      </div>

      <CalculatorCards calculators={calculators} tenantSlug={tenantSlug} />
    </div>
  );
}
