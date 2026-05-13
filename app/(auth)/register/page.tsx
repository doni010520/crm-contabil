import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <div className="flex min-h-full items-center justify-center px-4 py-12">
      <Card className="glass-strong rounded-2xl w-full max-w-md p-2">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-white">Criar conta</CardTitle>
          <CardDescription>Crie sua conta pra começar a usar o CRM</CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
          <p className="mt-4 text-center text-sm text-white/40">
            Já tem conta?{" "}
            <Link href="/login" className="font-medium text-[oklch(0.8_0.12_195)] hover:underline">
              Faça login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
