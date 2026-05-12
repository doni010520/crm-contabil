import { getGmbConnection } from "../actions";
import { redirect } from "next/navigation";
import { GmbProfileClient } from "./gmb-profile-client";

export default async function GmbProfilePage() {
  const connection = await getGmbConnection();

  if (!connection) {
    redirect("/gmb/connect");
  }

  return (
    <div className="p-6">
      <GmbProfileClient connection={connection} />
    </div>
  );
}
