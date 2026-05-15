import { NextRequest } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { SYSTEM_PROMPT } from "@/lib/ai/system-prompt";
import { AI_TOOLS } from "@/lib/ai/tools";
import { executeToolCall } from "@/lib/ai/tool-handlers";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

let _openai: OpenAI | null = null;
function getOpenAI() {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

const MAX_TOOL_ROUNDS = 5;

// ---------------------------------------------------------------------------
// POST /api/ai/chat
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  // Authenticate
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Nao autenticado" }, { status: 401 });
  }

  const { messages } = (await req.json()) as {
    messages: ChatCompletionMessageParam[];
  };

  // Build messages array with system prompt
  const allMessages: ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...messages,
  ];

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        let rounds = 0;

        while (rounds < MAX_TOOL_ROUNDS) {
          rounds++;

          const response = await getOpenAI().chat.completions.create({
            model: "gpt-4o",
            messages: allMessages,
            tools: AI_TOOLS,
            tool_choice: "auto",
            stream: true,
          });

          let assistantContent = "";
          const toolCalls: {
            id: string;
            name: string;
            arguments: string;
          }[] = [];

          for await (const chunk of response) {
            const delta = chunk.choices[0]?.delta;

            // Text content
            if (delta?.content) {
              assistantContent += delta.content;
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "text", content: delta.content })}\n\n`
                )
              );
            }

            // Tool calls
            if (delta?.tool_calls) {
              for (const tc of delta.tool_calls) {
                if (tc.index !== undefined) {
                  if (!toolCalls[tc.index]) {
                    toolCalls[tc.index] = {
                      id: tc.id ?? "",
                      name: tc.function?.name ?? "",
                      arguments: tc.function?.arguments ?? "",
                    };
                  } else {
                    if (tc.id) toolCalls[tc.index].id = tc.id;
                    if (tc.function?.name)
                      toolCalls[tc.index].name = tc.function.name;
                    if (tc.function?.arguments)
                      toolCalls[tc.index].arguments +=
                        tc.function.arguments;
                  }
                }
              }
            }
          }

          // If no tool calls, we're done
          if (toolCalls.length === 0) {
            break;
          }

          // Add assistant message with tool calls to history
          allMessages.push({
            role: "assistant",
            content: assistantContent || null,
            tool_calls: toolCalls.map((tc) => ({
              id: tc.id,
              type: "function" as const,
              function: { name: tc.name, arguments: tc.arguments },
            })),
          });

          // Execute each tool call and send status to client
          for (const tc of toolCalls) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "tool_start", name: tc.name })}\n\n`
              )
            );

            let toolArgs: Record<string, unknown> = {};
            try {
              toolArgs = JSON.parse(tc.arguments);
            } catch {
              // Invalid JSON from GPT
            }

            const result = await executeToolCall(tc.name, toolArgs);

            allMessages.push({
              role: "tool",
              tool_call_id: tc.id,
              content: JSON.stringify(result),
            });

            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "tool_end", name: tc.name })}\n\n`
              )
            );
          }

          // Loop back to get GPT's response to the tool results
        }

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`)
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro interno do assistente";
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", content: message })}\n\n`
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
