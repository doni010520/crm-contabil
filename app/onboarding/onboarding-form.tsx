"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function OnboardingForm() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function handleNameChange(value: string) {
    setName(value);
    setSlug(slugify(value));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.rpc("create_tenant_with_owner", {
      p_name: name,
      p_slug: slug,
      p_cnpj: cnpj || null,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome do escritório</Label>
        <Input
          id="name"
          placeholder="Contabilidade Silva & Associados"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="slug">Identificador (URL)</Label>
        <Input
          id="slug"
          placeholder="contabilidade-silva"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
          pattern="[a-z0-9-]+"
          title="Apenas letras minúsculas, números e hífens"
        />
        <p className="text-xs text-muted-foreground">
          Usado na URL do seu CRM. Apenas letras, números e hífens.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="cnpj">CNPJ (opcional)</Label>
        <Input
          id="cnpj"
          placeholder="00.000.000/0001-00"
          value={cnpj}
          onChange={(e) => setCnpj(e.target.value)}
        />
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Criando escritório..." : "Criar escritório e começar"}
      </Button>
    </form>
  );
}
