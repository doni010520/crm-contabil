export default function DashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p className="mt-1 text-muted-foreground">
        Visão geral do seu pipeline e métricas de conversão.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {["Leads este mês", "Reuniões agendadas", "Propostas enviadas", "Contratos assinados"].map(
          (label) => (
            <div
              key={label}
              className="rounded-lg border border-border bg-card p-4"
            >
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-1 text-3xl font-semibold">0</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
