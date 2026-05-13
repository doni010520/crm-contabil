import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OnboardingForm } from "./onboarding-form";

export default function OnboardingPage() {
  return (
    <div className="flex min-h-full items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-fade-in">
        <Card className="glass-strong rounded-2xl p-2">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-white">Configure seu escritório</CardTitle>
            <CardDescription>
              Preencha os dados do seu escritório pra começar a usar o CRM.
              Você poderá alterar depois em Configurações.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OnboardingForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
