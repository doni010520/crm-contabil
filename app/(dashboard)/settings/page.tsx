import { getTenantSettings, getTeamMembers } from "./actions";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const [{ tenant, user }, teamMembers] = await Promise.all([
    getTenantSettings(),
    getTeamMembers(),
  ]);

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

      <SettingsForm tenant={tenant} user={user} teamMembers={teamMembers} />
    </div>
  );
}
