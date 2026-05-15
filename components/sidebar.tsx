"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Kanban,
  MessageSquare,
  Users,
  FileText,
  FileSignature,
  CalendarDays,
  ListTodo,
  MapPin,
  Calculator,
  Stethoscope,
  Settings,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pipeline", label: "Pipeline", icon: Kanban },
  { href: "/inbox", label: "Inbox", icon: MessageSquare },
  { href: "/calendar", label: "Agenda", icon: CalendarDays },
  { href: "/tasks", label: "Tarefas", icon: ListTodo },
  { href: "/contacts", label: "Contatos", icon: Users },
  { href: "/proposals", label: "Propostas", icon: FileText },
  { href: "/contracts", label: "Contratos", icon: FileSignature },
  { href: "/gmb", label: "Google Meu Negócio", icon: MapPin },
  { href: "/calculators", label: "Calculadoras", icon: Calculator },
  { href: "/diagnostics", label: "Diagnósticos", icon: Stethoscope },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-full w-60 flex-col glass-strong border-r border-white/[0.06]">
      <div className="flex h-14 items-center px-5 border-b border-white/[0.06]">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-[oklch(0.72_0.15_195)]/20">
            <LayoutDashboard className="h-4 w-4 text-[oklch(0.8_0.12_195)]" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">CRM Contábil</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-2 py-3 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-[oklch(0.55_0.15_195)]/20 text-[oklch(0.85_0.1_195)]"
                  : "text-white/45 hover:bg-white/[0.06] hover:text-white/80"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-1 px-2 py-3 border-t border-white/[0.06]">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",
            pathname.startsWith("/settings")
              ? "bg-[oklch(0.55_0.15_195)]/20 text-[oklch(0.85_0.1_195)]"
              : "text-white/45 hover:bg-white/[0.06] hover:text-white/80"
          )}
        >
          <Settings className="h-4 w-4" />
          Configurações
        </Link>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 px-3 text-sm font-medium text-white/35 hover:text-white/65 hover:bg-white/[0.06]"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </aside>
  );
}
