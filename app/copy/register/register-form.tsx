"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signup, login } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Senha precisa ter pelo menos 8 caracteres");
      return;
    }
    startTransition(async () => {
      const result = await signup(email, password, nome);
      if (!result.ok) {
        setError(result.error || "Erro ao criar conta");
        return;
      }
      // Auto-login após signup
      const loginResult = await login(email, password);
      if (!loginResult.ok) {
        router.push("/copy/login");
        return;
      }
      router.push("/copy/app/perfil");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Label htmlFor="nome">Nome</Label>
        <Input
          id="nome"
          required
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          autoComplete="name"
        />
      </div>
      <div>
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
      </div>
      <div>
        <Label htmlFor="password">Senha (mín. 8 caracteres)</Label>
        <Input
          id="password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />
      </div>
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-2.5 rounded">
          {error}
        </div>
      )}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Criando..." : "Criar conta grátis"}
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        Ao criar conta você aceita os termos de uso.
      </p>
    </form>
  );
}
