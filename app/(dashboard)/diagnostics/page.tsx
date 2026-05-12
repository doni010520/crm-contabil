import { getBriefings } from "./actions";
import { DiagnosticsListClient } from "./diagnostics-list-client";

export default async function DiagnosticsPage() {
  const briefings = await getBriefings();

  return (
    <div className="p-6">
      <DiagnosticsListClient briefings={briefings} />
    </div>
  );
}
