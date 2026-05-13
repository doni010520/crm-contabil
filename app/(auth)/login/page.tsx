import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-full items-center justify-center px-4 py-12">
      <Card className="glass-strong rounded-2xl w-full max-w-md p-2">
        <CardHeader className="text-center">
          <div className="mx-auto p-2 rounded-xl bg-[oklch(0.72_0.15_195)]/15 w-fit mb-2">
            <span className="text-2xl font-bold text-white">CRM</span>
          </div>
          <CardTitle className="text-xl text-white">CRM Contábil</CardTitle>
          <CardDescription>Entre com seu email e senha</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
          <p className="mt-4 text-center text-sm text-white/40">
            Não tem conta?{" "}
            <Link href="/register" className="font-medium text-[oklch(0.8_0.12_195)] hover:underline">
              Crie aqui
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
