import { getTenantSettings, getTeamMembers } from "./actions";
import { SettingsForm } from "./settings-form";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const [{ tenant, user }, teamMembers] = await Promise.all([
    getTenantSettings(),
    getTeamMembers(),
  ]);

  // Fetch Google Calendar connection status
  let gcalConnected = false;
  let gcalEmail: string | undefined;
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (authUser) {
      const { data: dbUser } = await supabase
        .from("users")
        .select("tenant_id")
        .eq("auth_id", authUser.id)
        .single();
      if (dbUser) {
        const { data: gcalConn } = await supabase
          .from("google_calendar_connections")
          .select("google_email")
          .eq("tenant_id", dbUser.tenant_id)
          .maybeSingle();
        if (gcalConn) {
          gcalConnected = true;
          gcalEmail = gcalConn.google_email;
        }
      }
    }
  } catch {
    // Table may not exist yet
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Configuracoes
        </h1>
        <p className="mt-1 text-muted-foreground">
          Gerencie seu escritorio, perfil, equipe e integracoes.
        </p>
      </div>

      <SettingsForm
        tenant={tenant}
        user={user}
        teamMembers={teamMembers}
        gcalConnected={gcalConnected}
        gcalEmail={gcalEmail}
      />
    </div>
  );
}
