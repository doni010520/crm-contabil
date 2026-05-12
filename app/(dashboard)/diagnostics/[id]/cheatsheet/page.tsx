"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import type { MeetingBriefing } from "../../actions";
import { getBriefing } from "../../actions";

export default function CheatSheetPage() {
  const params = useParams();
  const id = params.id as string;
  const [briefing, setBriefing] = useState<MeetingBriefing | null>(null);
  const [loading, setLoading] = useState(true);

  const loadBriefing = useCallback(async () => {
    try {
      const data = await getBriefing(id);
      setBriefing(data);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadBriefing();
  }, [loadBriefing]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const sections = (briefing?.content_sections || {}) as Record<string, string>;
  const cheatSheet = sections.cheat_sheet;

  if (!briefing || !cheatSheet) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Cola Rápida não disponível.</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href={`/diagnostics/${id}`}>Voltar ao Diagnóstico</Link>
        </Button>
      </div>
    );
  }

  // Parse cheat sheet content into visual blocks
  const lines = cheatSheet.split("\n").filter((l) => l.trim());

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/diagnostics/${id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Link>
        </Button>
      </div>

      <h1 className="mb-2 text-xl font-bold">{briefing.name}</h1>
      <p className="mb-6 text-sm text-muted-foreground">Cola Rápida</p>

      <div className="space-y-4">
        {lines.map((line, i) => {
          // Bold heading
          if (line.startsWith("**") && line.endsWith("**")) {
            const text = line.replace(/\*\*/g, "");
            return (
              <h2 key={i} className="mt-4 text-lg font-bold text-primary">
                {text}
              </h2>
            );
          }

          // Bold prefix with content
          const boldMatch = line.match(/^\*\*(.+?)\*\*\s*(.*)/);
          if (boldMatch) {
            return (
              <div key={i} className="rounded-lg bg-muted p-3">
                <p className="font-semibold">{boldMatch[1]}</p>
                {boldMatch[2] && (
                  <p className="mt-1 text-lg">{boldMatch[2].replace(/"/g, "")}</p>
                )}
              </div>
            );
          }

          // Numbered items
          const numMatch = line.match(/^(\d+)\.\s+(.*)/);
          if (numMatch) {
            // Clean quotes
            const content = numMatch[2].replace(/"/g, "");
            return (
              <div
                key={i}
                className="flex gap-3 rounded-lg border p-3"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {numMatch[1]}
                </span>
                <p className="text-base leading-relaxed">{content}</p>
              </div>
            );
          }

          // Fallback
          return (
            <p key={i} className="text-base leading-relaxed">
              {line.replace(/"/g, "")}
            </p>
          );
        })}
      </div>
    </div>
  );
}
