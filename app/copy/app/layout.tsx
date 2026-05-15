import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAccount, getCredits, logout } from "../actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, LogOut } from "lucide-react";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const account = await getCurrentAccount();
  if (!account) redirect("/copy/login");

  const credits = await getCredits();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <Link href="/copy/app" className="flex items-center gap-2 font-semibold">
            <Sparkles className="size-5" /> Copy Contábil
          </Link>

          <nav className="flex items-center gap-2 text-sm">
            <Link href="/copy/app" className="px-3 py-1.5 rounded hover:bg-muted">
              Início
            </Link>
            <Link href="/copy/app/perfil" className="px-3 py-1.5 rounded hover:bg-muted">
              Perfil
            </Link>
            <Link href="/copy/app/historico" className="px-3 py-1.5 rounded hover:bg-muted">
              Histórico
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Badge variant="outline">
              {credits.saldo} créd · {credits.plano}
            </Badge>
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {account.email}
            </span>
            <form action={logout}>
              <Button type="submit" variant="ghost" size="sm">
                <LogOut className="size-4" />
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}
