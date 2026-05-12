import { getGmbDashboard } from "./actions";
import { GmbDashboardClient } from "./gmb-dashboard-client";

export default async function GmbPage() {
  const dashboard = await getGmbDashboard();

  return (
    <div className="p-6">
      <GmbDashboardClient dashboard={dashboard} />
    </div>
  );
}
