import Link from "next/link";
import { LoginForm } from "./login-form";
import { Sparkles } from "lucide-react";

export default function CopyLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-muted/30">
      <div className="w-full max-w-sm">
        <Link href="/copy" className="flex items-center justify-center gap-2 font-semibold mb-6">
          <Sparkles className="size-5" /> Copy Contábil
        </Link>
        <div className="bg-background rounded-lg border p-6">
          <h1 className="text-xl font-semibold mb-1">Entrar</h1>
          <p className="text-sm text-muted-foreground mb-5">
            Acesse sua conta para gerar copy.
          </p>
          <LoginForm />
        </div>
        <p className="text-sm text-center mt-4 text-muted-foreground">
          Não tem conta?{" "}
          <Link href="/copy/register" className="text-foreground underline">
            Criar grátis
          </Link>
        </p>
      </div>
    </div>
  );
}
