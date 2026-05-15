import Link from "next/link";
import { notFound } from "next/navigation";
import { getGeneration } from "../../../actions";
import { OutputViewer } from "./output-viewer";
import { ChevronLeft } from "lucide-react";
import type { CopyGenerationOutput } from "@crm-contabil/copywriter-core";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function GenerationDetailPage({ params }: PageProps) {
  const { id } = await params;
  const gen = await getGeneration(id);

  if (!gen) notFound();

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Link
        href="/copy/app/historico"
        className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center mb-3"
      >
        <ChevronLeft className="size-4 mr-1" /> Voltar ao histórico
      </Link>
      <OutputViewer
        modo={gen.modo}
        output={gen.output as CopyGenerationOutput}
        avisos={(gen.avisos as string[]) || []}
        createdAt={gen.created_at}
        modeloIA={gen.modelo_ia}
      />
    </div>
  );
}
