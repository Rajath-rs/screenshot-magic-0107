import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

// Swap this id to change LLM provider; the rest of the pipeline is unchanged.
const CHAT_MODEL = "openai/gpt-6-astra";
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
6. Give concise but useful answers (markdown-free plain prose, short paragraphs or simple dashes for lists).
7. Cite the supporting page numbers inline like (p. 12).
8. Do not claim something is in the document unless the retrieved context supports it.
9. If multiple sections support the answer, cite each page.`;

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
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) {
          return Response.json({ error: "AI is not configured." }, { status: 500 });
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

        const input = [
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

        const incomingRunId = request.headers.get(RUN_ID_HEADER)?.trim();

        try {
          const upstream = await fetch(`${GATEWAY}/responses`, {
            method: "POST",
            signal: request.signal,
            headers: {
              "Content-Type": "application/json",
              "Lovable-API-Key": apiKey,
              "X-Lovable-AIG-SDK": "fetch",
              ...(incomingRunId ? { [RUN_ID_HEADER]: incomingRunId } : {}),
            },
            body: JSON.stringify({
              model: CHAT_MODEL,
              input,
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
