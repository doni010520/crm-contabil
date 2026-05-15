import { getProfile } from "../../actions";
import { ProfileWizard } from "./profile-wizard";

export default async function ProfilePage() {
  const profile = await getProfile();

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          {profile ? "Editar perfil do escritório" : "Cadastrar perfil do escritório"}
        </h1>
        <p className="mt-1 text-muted-foreground">
          4 telas curtas. Esses dados alimentam todas as gerações de copy.
        </p>
      </div>
      <ProfileWizard initial={profile} />
    </div>
  );
}
