import Link from "next/link";
import { RegisterForm } from "./register-form";
import { Sparkles } from "lucide-react";

export default function CopyRegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-muted/30">
      <div className="w-full max-w-sm">
        <Link href="/copy" className="flex items-center justify-center gap-2 font-semibold mb-6">
          <Sparkles className="size-5" /> Copy Contábil
        </Link>
        <div className="bg-background rounded-lg border p-6">
          <h1 className="text-xl font-semibold mb-1">Criar conta</h1>
          <p className="text-sm text-muted-foreground mb-5">
            5 créditos grátis no signup. Sem cartão de crédito.
          </p>
          <RegisterForm />
        </div>
        <p className="text-sm text-center mt-4 text-muted-foreground">
          Já tem conta?{" "}
          <Link href="/copy/login" className="text-foreground underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
