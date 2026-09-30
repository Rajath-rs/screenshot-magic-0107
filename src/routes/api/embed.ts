import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { getAiConfig } from "@/lib/env";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";
const MAX_BATCH_ITEMS = 100;

const bodySchema = z.object({
  input: z.array(z.string().min(1)).min(1).max(MAX_BATCH_ITEMS),
});

export const Route = createFileRoute("/api/embed")({
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
          return Response.json({ error: "Invalid embedding request." }, { status: 400 });
        }

        const endpoint =
          config.provider === "openrouter"
            ? "https://openrouter.ai/api/v1/embeddings"
            : `${GATEWAY}/embeddings`;

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        };

        if (config.provider === "openrouter") {
          headers["HTTP-Referer"] = "http://localhost:8080";
          headers["X-Title"] = "DocMind AI";
        } else {
          headers["X-Lovable-AIG-SDK"] = "fetch";
        }

        const upstream = await fetch(endpoint, {
          method: "POST",
          signal: request.signal,
          headers,
          body: JSON.stringify({
            model: config.embeddingModel,
            input: parsed.data.input,
          }),
        });

        if (!upstream.ok) {
          const detail = await upstream.text();
          const message =
            upstream.status === 429
              ? "Too many requests while indexing. Please retry in a moment."
              : upstream.status === 402
                ? "AI credits are exhausted. Add credits to keep indexing documents."
                : `Embedding failed (${upstream.status}). ${detail.slice(0, 300)}`;
          return Response.json({ error: message }, { status: upstream.status });
        }

        const result = (await upstream.json()) as {
          data: { index: number; embedding: number[] }[];
        };

        if (!Array.isArray(result?.data)) {
          return Response.json({ error: "Invalid embedding response format." }, { status: 502 });
        }

        const ordered: (number[] | undefined)[] = Array.from({
          length: parsed.data.input.length,
        });
        for (const item of result.data) {
          if (
            !Number.isInteger(item.index) ||
            item.index < 0 ||
            item.index >= ordered.length ||
            !item.embedding?.length
          ) {
            return Response.json({ error: "Invalid embedding response." }, { status: 502 });
          }
          ordered[item.index] = item.embedding;
        }
        if (ordered.some((v) => !v)) {
          return Response.json({ error: "Missing embedding result." }, { status: 502 });
        }

        return Response.json({ embeddings: ordered });
      },
    },
  },
});
