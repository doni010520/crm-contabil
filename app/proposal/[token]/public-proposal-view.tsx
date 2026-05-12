"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, FileText } from "lucide-react";

interface Proposal {
  id: string;
  status: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  services: Array<{ name: string; value: number }>;
  total_value: number;
  discount: number;
  notes?: string;
  valid_until?: string;
  created_at: string;
  accepted_at?: string;
  rejected_at?: string;
  [key: string]: unknown;
}

interface Props {
  proposal: Proposal;
  tenant: { name: string; email: string; phone: string } | null;
  token: string;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
}

export function PublicProposalView({ proposal, tenant, token }: Props) {
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [done, setDone] = useState(false);
  const [resultStatus, setResultStatus] = useState<string | null>(null);

  const status = proposal.status;
  const services = proposal.services || [];
  const totalValue = Number(proposal.total_value) || 0;
  const discount = Number(proposal.discount) || 0;
  const finalValue = totalValue - discount;

  async function handleAccept() {
    setAccepting(true);
    try {
      const res = await fetch(`/api/public/proposal-action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, action: "accept" }),
      });
      if (res.ok) {
        setDone(true);
        setResultStatus("accepted");
      }
    } finally {
      setAccepting(false);
    }
  }

  async function handleReject() {
    setRejecting(true);
    try {
      const res = await fetch(`/api/public/proposal-action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, action: "reject", reason: rejectionReason }),
      });
      if (res.ok) {
        setDone(true);
        setResultStatus("rejected");
      }
    } finally {
      setRejecting(false);
    }
  }

  const isActionable = (status === "sent" || status === "viewed") && !done;
  const showAccepted = status === "accepted" || resultStatus === "accepted";
  const showRejected = status === "rejected" || resultStatus === "rejected";

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <FileText className="h-10 w-10 text-primary mx-auto" />
          {tenant && (
            <h1 className="text-2xl font-bold">{tenant.name}</h1>
          )}
          <p className="text-muted-foreground">Proposta Comercial</p>
        </div>

        {/* Status Banners */}
        {showAccepted && (
          <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-center text-green-800">
            <Check className="h-5 w-5 inline mr-2" />
            Proposta aceita{proposal.accepted_at ? ` em ${formatDate(proposal.accepted_at as string)}` : ""}
          </div>
        )}
        {showRejected && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-center text-red-800">
            <X className="h-5 w-5 inline mr-2" />
            Proposta recusada
          </div>
        )}
        {status === "expired" && (
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 text-center text-gray-600">
            Proposta expirada
          </div>
        )}

        {/* Client Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Para: {proposal.client_name}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            {proposal.client_email && (
              <div>
                <span className="text-muted-foreground">Email: </span>
                {proposal.client_email}
              </div>
            )}
            {proposal.client_phone && (
              <div>
                <span className="text-muted-foreground">Telefone: </span>
                {proposal.client_phone}
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Data: </span>
              {formatDate(proposal.created_at as string)}
            </div>
            {proposal.valid_until && (
              <div>
                <span className="text-muted-foreground">Válida até: </span>
                {formatDate(proposal.valid_until as string)}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Services */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Serviços</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {services.map((svc, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <span>{svc.name}</span>
                  <span className="font-medium">{formatCurrency(svc.value)}/mês</span>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-1 text-right">
              {discount > 0 && (
                <>
                  <div className="text-sm text-muted-foreground">
                    Subtotal: {formatCurrency(totalValue)}
                  </div>
                  <div className="text-sm text-green-600">
                    Desconto: -{formatCurrency(discount)}
                  </div>
                </>
              )}
              <div className="text-xl font-bold">
                Total: {formatCurrency(finalValue)}/mês
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        {proposal.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">
                {proposal.notes}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        {isActionable && (
          <div className="space-y-4">
            <div className="flex gap-4">
              <Button
                size="lg"
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={handleAccept}
                disabled={accepting}
              >
                <Check className="mr-2 h-4 w-4" />
                {accepting ? "Aceitando..." : "Aceitar Proposta"}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => setShowRejectForm(!showRejectForm)}
              >
                <X className="mr-2 h-4 w-4" />
                Recusar
              </Button>
            </div>

            {showRejectForm && (
              <Card>
                <CardContent className="pt-4 space-y-3">
                  <Textarea
                    placeholder="Motivo da recusa (opcional)"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                  />
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={rejecting}
                    className="w-full"
                  >
                    {rejecting ? "Enviando..." : "Confirmar Recusa"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pt-4">
          {tenant && (
            <p>
              {tenant.name} &bull; {tenant.email} &bull; {tenant.phone}
            </p>
          )}
          <p className="mt-1">
            Powered by{" "}
            <a href="https://benitech.com.br" className="text-primary hover:underline">
              Benitech Lab
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
