"use client";

import { useState, useCallback, useRef } from "react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolsUsed?: string[];
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTools, setActiveTools] = useState<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text.trim(),
      };

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: "",
        toolsUsed: [],
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsLoading(true);
      setActiveTools([]);

      // Build the messages for the API (only role + content)
      const apiMessages = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: text.trim() },
      ];

      try {
        abortRef.current = new AbortController();

        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: apiMessages }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) {
          throw new Error("Erro na comunicacao com o assistente.");
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("Stream nao disponivel.");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const json = line.slice(6);

            try {
              const event = JSON.parse(json);

              if (event.type === "text") {
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last && last.role === "assistant") {
                    last.content += event.content;
                  }
                  return updated;
                });
              } else if (event.type === "tool_start") {
                setActiveTools((prev) => [...prev, event.name]);
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last && last.role === "assistant") {
                    last.toolsUsed = [
                      ...(last.toolsUsed || []),
                      event.name,
                    ];
                  }
                  return updated;
                });
              } else if (event.type === "tool_end") {
                setActiveTools((prev) =>
                  prev.filter((t) => t !== event.name)
                );
              } else if (event.type === "error") {
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last && last.role === "assistant") {
                    last.content = event.content || "Erro no assistente.";
                  }
                  return updated;
                });
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last && last.role === "assistant" && !last.content) {
              last.content =
                "Desculpe, houve um erro ao processar sua mensagem.";
            }
            return updated;
          });
        }
      } finally {
        setIsLoading(false);
        setActiveTools([]);
        abortRef.current = null;
      }
    },
    [messages, isLoading]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { messages, isLoading, activeTools, sendMessage, clearMessages, stop };
}
