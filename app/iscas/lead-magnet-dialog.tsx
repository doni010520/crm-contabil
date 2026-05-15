"use client";

import { useState } from "react";
import { X, Download, Loader2, CheckCircle2 } from "lucide-react";

type MagnetType = "kit-iscas" | "prompts-pdf";

interface LeadMagnetDialogProps {
  open: boolean;
  magnet: MagnetType;
  title: string;
  description: string;
  onClose: () => void;
}

export function LeadMagnetDialog({
  open,
  magnet,
  title,
  description,
  onClose,
}: LeadMagnetDialogProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ url: string; label: string } | null>(null);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/public/lead-magnet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, whatsapp, magnet }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao processar");
        return;
      }
      setSuccess({ url: data.downloadUrl, label: data.magnetLabel });
    } catch {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setName("");
    setEmail("");
    setWhatsapp("");
    setError(null);
    setSuccess(null);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
        >
          <X className="h-5 w-5" />
        </button>

        {!success ? (
          <>
            <div className="mb-5">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5 mb-3">
                <Download className="h-3.5 w-3.5" />
                100% gratuito
              </div>
              <h3 className="text-xl font-bold text-slate-900">{title}</h3>
              <p className="text-sm text-slate-600 mt-2">{description}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Seu nome
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="João Silva"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  WhatsApp
                </label>
                <input
                  type="tel"
                  required
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="(71) 99999-9999"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="seu@email.com.br"
                />
              </div>

              {error && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-2.5">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-60 transition px-4 py-2.5 text-sm font-semibold text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Preparando...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" /> Quero receber grátis
                  </>
                )}
              </button>
              <p className="text-[11px] text-slate-500 text-center">
                Seus dados são salvos com segurança e usados apenas para te
                enviar o material.
              </p>
            </form>
          </>
        ) : (
          <>
            <div className="text-center py-4">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 mb-4">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Pronto, {name.split(" ")[0]}!</h3>
              <p className="text-sm text-slate-600 mt-2">
                Seu acesso a <strong>{success.label}</strong> está liberado abaixo.
              </p>
            </div>
            <a
              href={success.url}
              download
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 transition px-4 py-3 text-sm font-semibold text-white shadow-md"
            >
              <Download className="h-4 w-4" /> Baixar agora
            </a>
            <p className="text-[11px] text-slate-500 text-center mt-3">
              Também enviamos uma cópia do link no seu e-mail.
            </p>
            <button
              onClick={handleClose}
              className="block w-full text-sm text-slate-500 hover:text-slate-700 mt-3"
            >
              Fechar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
