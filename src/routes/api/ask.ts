import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { getAiConfig } from "@/lib/env";

// Swap this id to change LLM provider; the rest of the pipeline is unchanged.
const CHAT_MODEL = "openai/gpt-4o-mini";
const GATEWAY = "https://ai.gateway.lovable.dev/v1";
const RUN_ID_HEADER = "X-Lovable-AIG-Run-ID";

const SYSTEM_PROMPT = `You are DocMind AI, an evidence-grounded document assistant.

Answer questions using ONLY the provided document context.

Rules:
1. Use only information contained in the retrieved context.
2. Never invent facts.
3. Never use outside knowledge to fill missing information.
4. If the answer cannot be found in the provided context, clearly say the information was not found in this document.
5. Maintain conversational context for follow-up questions.
6. Format answers cleanly with markdown headings, paragraphs, and bullet points where helpful.
7. Cite the supporting page numbers inline like (p. 12).
8. Do not claim something is in the document unless the retrieved context supports it.
9. If multiple sections support the answer, cite each page.

FOLLOW-UP QUESTIONS REQUIREMENT:
At the very end of your response, after your complete answer, output a dedicated follow-up questions block formatted exactly as:

---RELATED_QUESTIONS---
1. <First concise question grounded in the retrieved document context>
2. <Second concise question grounded in the retrieved document context>
3. <Third concise question grounded in the retrieved document context>

Strict rules for follow-up questions:
- Provide EXACTLY 3 questions.
- Each question must be 5 to 12 words long.
- Every question must be directly answerable from the provided document context passages.
- Never suggest generic or outside questions.
- If the answer to the user's question was not found in the context, do NOT ask for that missing information again; instead suggest questions about topics that ARE discussed in the retrieved passages.
- Do NOT repeat the user's current question or previous questions from conversation history.`;

const bodySchema = z.object({
  question: z.string().min(1).max(2000),
  documentName: z.string().max(300).optional(),
  context: z
    .array(
      z.object({
        chunk_id: z.string().max(100),
        page_number: z.number().int().nonnegative(),
        text: z.string().max(8000),
      }),
    )
    .max(12),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(6000),
      }),
    )
    .max(12)
    .default([]),
});

export const Route = createFileRoute("/api/ask")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const config = getAiConfig();
        if (!config) {
          return Response.json(
            { error: "AI is not configured. Please set OPENROUTER_API_KEY in your .env file." },
            { status: 500 },
          );
        }

        const parsed = bodySchema.safeParse(await request.json());
        if (!parsed.success) {
          return Response.json({ error: "Invalid question request." }, { status: 400 });
        }
        const { question, context, history, documentName } = parsed.data;

        const contextBlock = context.length
          ? context
              .map((c) => `[page ${c.page_number} | ${c.chunk_id}]\n${c.text}`)
              .join("\n\n---\n\n")
          : "No relevant passages were retrieved from the document.";

        const promptMessages = [
          { role: "system", content: SYSTEM_PROMPT },
          ...history.map((m) => ({ role: m.role, content: m.content })),
          {
            role: "user",
            content: `Document: ${documentName ?? "uploaded PDF"}

Retrieved context:
${contextBlock}

Question: ${question}`,
          },
        ];

        try {
          if (config.provider === "openrouter") {
            const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
              method: "POST",
              signal: request.signal,
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${config.apiKey}`,
                "HTTP-Referer": "http://localhost:8080",
                "X-Title": "DocMind AI",
              },
              body: JSON.stringify({
                model: config.chatModel || CHAT_MODEL,
                messages: promptMessages,
                stream: true,
              }),
            });

            if (!upstream.ok || !upstream.body) {
              const detail = await upstream.text();
              const message =
                upstream.status === 429
                  ? "The assistant is rate limited. Please try again shortly."
                  : upstream.status === 402
                    ? "AI credits are exhausted. Add credits to keep asking questions."
                    : `The assistant failed (${upstream.status}). ${detail.slice(0, 300)}`;
              return Response.json({ error: message }, { status: upstream.status });
            }

            const decoder = new TextDecoder();
            const encoder = new TextEncoder();
            let buffer = "";

            const transform = new TransformStream<Uint8Array, Uint8Array>({
              transform(chunk, controller) {
                buffer += decoder.decode(chunk, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() ?? "";
                for (const line of lines) {
                  const trimmed = line.trim();
                  if (!trimmed.startsWith("data:")) continue;
                  const data = trimmed.slice(5).trim();
                  if (data === "[DONE]") {
                    controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                    continue;
                  }
                  try {
                    const event = JSON.parse(data) as {
                      choices?: Array<{ delta?: { content?: string } }>;
                    };
                    const text = event.choices?.[0]?.delta?.content;
                    if (text) {
                      controller.enqueue(
                        encoder.encode(
                          `data: ${JSON.stringify({ type: "response.output_text.delta", delta: text })}\n\n`,
                        ),
                      );
                    }
                  } catch {
                    // Ignore non-JSON lines or partial chunks
                  }
                }
              },
              flush(controller) {
                if (buffer.trim().startsWith("data:")) {
                  const data = buffer.trim().slice(5).trim();
                  if (data === "[DONE]") {
                    controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                  }
                }
              },
            });

            return new Response(upstream.body.pipeThrough(transform), {
              status: 200,
              headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
              },
            });
          }

          // Fallback to Lovable Gateway
          const incomingRunId = request.headers.get(RUN_ID_HEADER)?.trim();
          const upstream = await fetch(`${GATEWAY}/responses`, {
            method: "POST",
            signal: request.signal,
            headers: {
              "Content-Type": "application/json",
              "Lovable-API-Key": config.apiKey,
              "X-Lovable-AIG-SDK": "fetch",
              ...(incomingRunId ? { [RUN_ID_HEADER]: incomingRunId } : {}),
            },
            body: JSON.stringify({
              model: config.chatModel || "openai/gpt-6-astra",
              input: promptMessages,
              stream: true,
              store: false,
              reasoning: { effort: "low", summary: "auto" },
              include: ["reasoning.encrypted_content"],
            }),
          });

          if (!upstream.ok || !upstream.body) {
            const detail = await upstream.text();
            const message =
              upstream.status === 429
                ? "The assistant is rate limited. Please try again shortly."
                : upstream.status === 402
                  ? "AI credits are exhausted. Add credits to keep asking questions."
                  : `The assistant failed (${upstream.status}). ${detail.slice(0, 300)}`;
            return Response.json({ error: message }, { status: upstream.status });
          }

          const headers = new Headers();
          for (const [key, value] of upstream.headers) {
            if (key.toLowerCase().startsWith("x-lovable-aig-")) headers.set(key, value);
          }
          headers.set(
            "Content-Type",
            upstream.headers.get("Content-Type") ?? "text/event-stream",
          );
          headers.set("Cache-Control", "no-cache");
          return new Response(upstream.body, { status: 200, headers });
        } catch (error) {
          if (
            request.signal.aborted &&
            error instanceof Error &&
            error.name === "AbortError"
          ) {
            return new Response(null, { status: 499 });
          }
          throw error;
        }
      },
    },
  },
});
