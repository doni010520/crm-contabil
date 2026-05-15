import { redirect } from "next/navigation";
import { getProfile, getCredits } from "../actions";
import { GenerateForm } from "./generate-form";
import type { CopyMode } from "@crm-contabil/copywriter-core";

const VALID_MODES: CopyMode[] = [
  "site-home",
  "site-lp-nicho",
  "site-servico",
  "google-ads",
  "meta-ads",
];

interface PageProps {
  searchParams: Promise<{ modo?: string }>;
}

export default async function GeneratePage({ searchParams }: PageProps) {
  const { modo } = await searchParams;

  if (!modo || !VALID_MODES.includes(modo as CopyMode)) {
    redirect("/copywriter");
  }

  const [profile, credits] = await Promise.all([getProfile(), getCredits()]);

  if (!profile) {
    redirect("/copywriter/perfil");
  }

  return (
    <div className="p-6 max-w-3xl">
      <GenerateForm modo={modo as CopyMode} profile={profile} saldo={credits.saldo} />
    </div>
  );
}
