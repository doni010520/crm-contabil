import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Copy Contábil — Copy especializada para escritórios de contabilidade",
  description:
    "Gere copy de site e anúncios escritos como por um copywriter especialista em contabilidade. Para escritórios que querem parar de depender de indicação.",
};

export default function CopyRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
