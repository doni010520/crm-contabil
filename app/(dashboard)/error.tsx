"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Dashboard Error]", error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <h2 className="mt-4 text-lg font-semibold">Algo deu errado</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {error.message || "Ocorreu um erro inesperado."}
      </p>
      {error.digest && (
        <p className="mt-1 text-xs text-muted-foreground">
          Codigo: {error.digest}
        </p>
      )}
      <Button onClick={reset} className="mt-6">
        Tentar novamente
      </Button>
    </div>
  );
}
