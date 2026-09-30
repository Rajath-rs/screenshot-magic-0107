import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const EMBEDDING_MODEL = "google/gemini-embedding-2";
const GATEWAY = "https://ai.gateway.lovable.dev/v1";
const MAX_BATCH_ITEMS = 100;

const bodySchema = z.object({
  input: z.array(z.string().min(1)).min(1).max(MAX_BATCH_ITEMS),
});

export const Route = createFileRoute("/api/embed")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) {
          return Response.json({ error: "AI is not configured." }, { status: 500 });
        }

        const parsed = bodySchema.safeParse(await request.json());
        if (!parsed.success) {
          return Response.json({ error: "Invalid embedding request." }, { status: 400 });
        }

        const upstream = await fetch(`${GATEWAY}/embeddings`, {
          method: "POST",
          signal: request.signal,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
            "X-Lovable-AIG-SDK": "fetch",
          },
          body: JSON.stringify({ model: EMBEDDING_MODEL, input: parsed.data.input }),
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
