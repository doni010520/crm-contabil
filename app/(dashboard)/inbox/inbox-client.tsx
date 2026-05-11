"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Check,
  CheckCheck,
  Clock,
  MessageSquare,
  Search,
  Send,
  X,
  XCircle,
} from "lucide-react";
import {
  type ConversationWithContact,
  type Message,
  getMessages,
  sendMessage,
  markConversationRead,
  closeConversation,
  searchConversations,
  getConversations,
} from "./actions";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 13 && digits.startsWith("55")) {
    const ddd = digits.slice(2, 4);
    const num = digits.slice(4);
    return `+55 (${ddd}) ${num.slice(0, 5)}-${num.slice(5)}`;
  }
  if (digits.length === 11) {
    return `+55 (${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `+55 (${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `${diffMin} min`;
  if (diffHour < 24) return `${diffHour}h`;
  if (diffDay === 1) return "ontem";
  if (diffDay < 7) return `${diffDay}d`;

  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function messageTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function contactInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function messagePreview(msg: ConversationWithContact["last_message"]): string {
  if (!msg) return "Sem mensagens";
  if (msg.type === "image") return "Imagem";
  if (msg.type === "audio") return "Audio";
  if (msg.type === "video") return "Video";
  if (msg.type === "document") return "Documento";
  if (msg.type === "sticker") return "Figurinha";
  if (msg.type === "location") return "Localizacao";
  return msg.body ?? "";
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "sent":
      return <Check className="h-3.5 w-3.5 text-muted-foreground" />;
    case "delivered":
      return <CheckCheck className="h-3.5 w-3.5 text-muted-foreground" />;
    case "read":
      return <CheckCheck className="h-3.5 w-3.5 text-blue-500" />;
    case "failed":
      return <XCircle className="h-3.5 w-3.5 text-destructive" />;
    default:
      return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function InboxClient({
  initialConversations,
}: {
  initialConversations: ConversationWithContact[];
}) {
  const [conversations, setConversations] =
    useState<ConversationWithContact[]>(initialConversations);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedConv = conversations.find((c) => c.id === selectedId) ?? null;

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load messages when conversation is selected
  const selectConversation = useCallback(
    (convId: string) => {
      setSelectedId(convId);
      startTransition(async () => {
        const msgs = await getMessages(convId);
        setMessages(msgs);
        // Mark as read
        await markConversationRead(convId);
        setConversations((prev) =>
          prev.map((c) => (c.id === convId ? { ...c, unread_count: 0 } : c))
        );
      });
    },
    []
  );

  // Send message handler
  const handleSend = useCallback(async () => {
    if (!selectedId || !messageText.trim() || isSending) return;

    const text = messageText.trim();
    setMessageText("");
    setIsSending(true);

    try {
      const newMsg = await sendMessage(selectedId, text);
      setMessages((prev) => [...prev, newMsg]);

      // Update conversation last message preview
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedId
            ? {
                ...c,
                last_message_at: new Date().toISOString(),
                last_message: {
                  body: text,
                  type: "text",
                  direction: "outbound",
                  created_at: new Date().toISOString(),
                },
              }
            : c
        )
      );
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  }, [selectedId, messageText, isSending]);

  // Search handler
  useEffect(() => {
    if (!searchTerm.trim()) {
      startTransition(async () => {
        const convs = await getConversations();
        setConversations(convs);
      });
      return;
    }

    const timeout = setTimeout(() => {
      startTransition(async () => {
        const results = await searchConversations(searchTerm);
        setConversations(results);
      });
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchTerm]);

  // Close conversation handler
  const handleClose = useCallback(async () => {
    if (!selectedId) return;
    try {
      await closeConversation(selectedId);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedId ? { ...c, status: "closed" } : c
        )
      );
    } catch (err) {
      console.error("Erro ao fechar conversa:", err);
    }
  }, [selectedId]);

  // ---------------------------------------------------------------------------
  // Realtime subscriptions
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("inbox-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const newMsg = payload.new as Message;

          // If this message is for the selected conversation, add it to the list
          if (newMsg.conversation_id === selectedId) {
            setMessages((prev) => {
              // Avoid duplicates (we may have optimistically added outbound)
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          }

          // Update conversation list preview
          setConversations((prev) => {
            const updated = prev.map((c) => {
              if (c.id === newMsg.conversation_id) {
                return {
                  ...c,
                  last_message_at: newMsg.created_at,
                  last_message: {
                    body: newMsg.body,
                    type: newMsg.type,
                    direction: newMsg.direction,
                    created_at: newMsg.created_at,
                  },
                  unread_count:
                    newMsg.direction === "inbound" &&
                    newMsg.conversation_id !== selectedId
                      ? c.unread_count + 1
                      : c.unread_count,
                };
              }
              return c;
            });

            // Sort by last_message_at descending
            return updated.sort((a, b) => {
              const aTime = a.last_message_at
                ? new Date(a.last_message_at).getTime()
                : 0;
              const bTime = b.last_message_at
                ? new Date(b.last_message_at).getTime()
                : 0;
              return bTime - aTime;
            });
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "conversations" },
        (payload) => {
          const updated = payload.new as Record<string, unknown>;
          setConversations((prev) =>
            prev.map((c) =>
              c.id === updated.id
                ? {
                    ...c,
                    unread_count:
                      (updated.unread_count as number) ?? c.unread_count,
                    status: (updated.status as string) ?? c.status,
                    last_message_at:
                      (updated.last_message_at as string) ??
                      c.last_message_at,
                  }
                : c
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedId]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="flex h-full">
      {/* ------------------------------------------------------------------ */}
      {/* Left panel — conversation list                                     */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex w-80 flex-col border-r">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h1 className="text-lg font-semibold">Inbox</h1>
          <Badge variant="secondary" className="text-xs">
            {conversations.filter((c) => c.status === "open").length} abertas
          </Badge>
        </div>

        {/* Search */}
        <div className="border-b px-3 py-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar conversa..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                {searchTerm
                  ? "Nenhuma conversa encontrada"
                  : "Nenhuma conversa ainda"}
              </p>
            </div>
          ) : (
            conversations.map((conv) => {
              const isSelected = conv.id === selectedId;
              const contactName =
                conv.contact?.contact_name ?? conv.wa_chat_id;
              const phone = conv.contact?.phone ?? conv.wa_chat_id;

              return (
                <button
                  key={conv.id}
                  onClick={() => selectConversation(conv.id)}
                  className={`flex w-full items-start gap-3 border-b px-4 py-3 text-left transition-colors hover:bg-muted/50 ${
                    isSelected ? "bg-muted" : ""
                  }`}
                >
                  <Avatar className="mt-0.5 h-10 w-10 shrink-0">
                    <AvatarFallback className="text-xs">
                      {contactInitials(contactName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="truncate text-sm font-medium">
                        {contactName}
                      </span>
                      <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                        {relativeTime(
                          conv.last_message?.created_at ?? conv.last_message_at
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="truncate text-xs text-muted-foreground">
                        {conv.last_message?.direction === "outbound" && (
                          <span className="mr-1 text-muted-foreground">
                            Voce:
                          </span>
                        )}
                        {messagePreview(conv.last_message)}
                      </p>
                      {conv.unread_count > 0 && (
                        <Badge className="ml-2 h-5 min-w-5 shrink-0 justify-center rounded-full px-1.5 text-[10px]">
                          {conv.unread_count}
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Right panel — messages                                             */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-1 flex-col">
        {selectedConv ? (
          <>
            {/* Chat header */}
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="text-xs">
                    {contactInitials(
                      selectedConv.contact?.contact_name ??
                        selectedConv.wa_chat_id
                    )}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">
                    {selectedConv.contact?.contact_name ??
                      selectedConv.wa_chat_id}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatPhone(
                      selectedConv.contact?.phone ?? selectedConv.wa_chat_id
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedConv.status === "open" && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleClose}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Fechar conversa</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                <Badge
                  variant={
                    selectedConv.status === "open" ? "default" : "secondary"
                  }
                  className="text-xs"
                >
                  {selectedConv.status === "open"
                    ? "Aberta"
                    : selectedConv.status === "closed"
                      ? "Fechada"
                      : "Arquivada"}
                </Badge>
              </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto bg-muted/30 px-4 py-4">
              {isPending && messages.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-muted-foreground">
                    Carregando mensagens...
                  </p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-muted-foreground">
                    Nenhuma mensagem nesta conversa
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map((msg, idx) => {
                    const isOutbound = msg.direction === "outbound";
                    const showDate =
                      idx === 0 ||
                      new Date(msg.created_at).toDateString() !==
                        new Date(
                          messages[idx - 1].created_at
                        ).toDateString();

                    return (
                      <div key={msg.id}>
                        {showDate && (
                          <div className="my-3 flex justify-center">
                            <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                              {new Date(msg.created_at).toLocaleDateString(
                                "pt-BR",
                                {
                                  day: "2-digit",
                                  month: "long",
                                  year:
                                    new Date(msg.created_at).getFullYear() !==
                                    new Date().getFullYear()
                                      ? "numeric"
                                      : undefined,
                                }
                              )}
                            </span>
                          </div>
                        )}
                        <div
                          className={`flex ${
                            isOutbound ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`relative max-w-[70%] rounded-lg px-3 py-2 ${
                              isOutbound
                                ? "bg-primary text-primary-foreground"
                                : "bg-card border shadow-sm"
                            }`}
                          >
                            {msg.type !== "text" && msg.type !== "reaction" && (
                              <p
                                className={`mb-1 text-xs font-medium ${
                                  isOutbound
                                    ? "text-primary-foreground/70"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {msg.type === "image"
                                  ? "Imagem"
                                  : msg.type === "audio"
                                    ? "Audio"
                                    : msg.type === "video"
                                      ? "Video"
                                      : msg.type === "document"
                                        ? "Documento"
                                        : msg.type === "sticker"
                                          ? "Figurinha"
                                          : msg.type === "location"
                                            ? "Localizacao"
                                            : msg.type}
                              </p>
                            )}
                            {msg.body && (
                              <p className="whitespace-pre-wrap break-words text-sm">
                                {msg.body}
                              </p>
                            )}
                            <div
                              className={`mt-1 flex items-center justify-end gap-1 ${
                                isOutbound
                                  ? "text-primary-foreground/60"
                                  : "text-muted-foreground"
                              }`}
                            >
                              <span className="text-[10px]">
                                {messageTime(msg.created_at)}
                              </span>
                              {isOutbound && (
                                <StatusIcon status={msg.status} />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message input */}
            <div className="border-t bg-background px-4 py-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <Input
                  ref={inputRef}
                  placeholder="Digite uma mensagem..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  disabled={isSending}
                  className="flex-1"
                  autoFocus
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!messageText.trim() || isSending}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">Inbox WhatsApp</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Selecione uma conversa ao lado para visualizar as mensagens e
              responder seus contatos.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
