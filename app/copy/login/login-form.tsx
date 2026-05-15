"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { login } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await login(email, password);
      if (!result.ok) {
        setError(result.error || "Erro ao entrar");
        return;
      }
      router.push("/copy/app");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
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
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
      </div>
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-2.5 rounded">
          {error}
        </div>
      )}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
