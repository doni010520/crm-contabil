"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bot,
  Loader2,
  MessageSquare,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { useChat, type ChatMessage } from "./use-chat";

// ---------------------------------------------------------------------------
// Tool display names
// ---------------------------------------------------------------------------
const TOOL_LABELS: Record<string, string> = {
  get_dashboard_metrics: "Metricas",
  get_contacts: "Contatos",
  create_contact: "Criar contato",
  update_contact: "Atualizar contato",
  get_companies: "Empresas",
  create_company: "Criar empresa",
  get_pipeline: "Pipeline",
  create_deal: "Criar negocio",
  move_deal: "Mover negocio",
  get_tasks: "Tarefas",
  create_task: "Criar tarefa",
  update_task: "Atualizar tarefa",
  delete_task: "Excluir tarefa",
  get_calendar_events: "Agenda",
  create_calendar_event: "Criar evento",
  get_team_members: "Equipe",
};

// ---------------------------------------------------------------------------
// Message Bubble
// ---------------------------------------------------------------------------
function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-[oklch(0.55_0.15_195)] text-white"
            : "bg-white/[0.08] text-white/90"
        }`}
      >
        {/* Tool badges */}
        {!isUser &&
          message.toolsUsed &&
          message.toolsUsed.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {message.toolsUsed.map((tool, i) => (
                <Badge
                  key={`${tool}-${i}`}
                  variant="secondary"
                  className="text-[10px] bg-white/10 text-white/60 border-white/10"
                >
                  {TOOL_LABELS[tool] || tool}
                </Badge>
              ))}
            </div>
          )}

        {/* Content with basic markdown-like formatting */}
        <div className="whitespace-pre-wrap break-words">
          {message.content || (
            <span className="flex items-center gap-2 text-white/40">
              <Loader2 className="h-3 w-3 animate-spin" />
              Pensando...
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Active tools indicator
// ---------------------------------------------------------------------------
function ToolIndicator({ tools }: { tools: string[] }) {
  if (tools.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <Loader2 className="h-3 w-3 animate-spin text-[oklch(0.8_0.12_195)]" />
      <span className="text-xs text-white/50">
        {tools.map((t) => TOOL_LABELS[t] || t).join(", ")}...
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Chat Component
// ---------------------------------------------------------------------------
export function AiChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, isLoading, activeTools, sendMessage, clearMessages } =
    useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeTools]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[oklch(0.55_0.15_195)] text-white shadow-lg shadow-black/25 transition-all hover:scale-105 hover:bg-[oklch(0.6_0.15_195)] active:scale-95"
        >
          <MessageSquare className="h-6 w-6" />
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[600px] w-[400px] flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[oklch(0.16_0.02_260)] shadow-2xl shadow-black/40">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[oklch(0.55_0.15_195)]/20">
                <Bot className="h-4 w-4 text-[oklch(0.8_0.12_195)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  Assistente IA
                </p>
                <p className="text-[10px] text-white/40">GPT-4o</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white/40 hover:text-white/70 hover:bg-white/[0.06]"
                  onClick={clearMessages}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white/40 hover:text-white/70 hover:bg-white/[0.06]"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[oklch(0.55_0.15_195)]/10">
                  <Bot className="h-6 w-6 text-[oklch(0.8_0.12_195)]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/70">
                    Ola! Como posso ajudar?
                  </p>
                  <p className="text-xs text-white/40 mt-1">
                    Posso consultar dados, criar tarefas, mover negocios...
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 mt-2 justify-center">
                  {[
                    "Quantos leads temos?",
                    "Tarefas atrasadas",
                    "Resumo do pipeline",
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => sendMessage(suggestion)}
                      className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/50 hover:bg-white/[0.06] hover:text-white/70 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            <ToolIndicator tools={activeTools} />
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="border-t border-white/[0.08] px-4 py-3"
          >
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pergunte algo..."
                rows={1}
                className="flex-1 resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[oklch(0.55_0.15_195)]/50 focus:outline-none focus:ring-0"
                style={{ maxHeight: "100px" }}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isLoading}
                className="h-10 w-10 shrink-0 rounded-xl bg-[oklch(0.55_0.15_195)] hover:bg-[oklch(0.6_0.15_195)]"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
