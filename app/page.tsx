export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <div className="max-w-2xl text-center space-y-6">
        <span className="inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
          v0.1 — fundação
        </span>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          CRM Contábil
        </h1>
        <p className="text-lg text-muted-foreground">
          CRM SaaS multi-tenant para escritórios de contabilidade. Pipeline,
          WhatsApp Cloud API, propostas e contratos em um só lugar.
        </p>
        <p className="text-sm text-muted-foreground">
          Em desenvolvimento. Veja{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
            docs/PLANO_TECNICO.md
          </code>{" "}
          para o roadmap completo.
        </p>
      </div>
    </main>
  );
}
