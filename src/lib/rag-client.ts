import type { Chunk } from "./chunk";
import type { Retrieved } from "./vector-store";

const EMBED_BATCH = 50;

async function readError(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error ?? fallback;
  } catch {
    return fallback;
  }
}

export async function embedTexts(
  texts: string[],
  onProgress?: (done: number, total: number) => void,
): Promise<number[][]> {
  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += EMBED_BATCH) {
    const batch = texts.slice(i, i + EMBED_BATCH);
    const response = await fetch("/api/embed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: batch }),
    });
    if (!response.ok) throw new Error(await readError(response, "Embedding failed."));
    const { embeddings } = (await response.json()) as { embeddings: number[][] };
    out.push(...embeddings);
    onProgress?.(Math.min(i + batch.length, texts.length), texts.length);
  }
  return out;
}

export type ChatTurn = { role: "user" | "assistant"; content: string };

export async function streamAnswer(params: {
  question: string;
  documentName: string;
  context: Retrieved[] | Chunk[];
  history: ChatTurn[];
  signal?: AbortSignal;
  onDelta: (text: string) => void;
}): Promise<void> {
  const response = await fetch("/api/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: params.signal ?? null,
    body: JSON.stringify({
      question: params.question,
      documentName: params.documentName,
      history: params.history,
      context: params.context.map((c) => ({
        chunk_id: c.chunk_id,
        page_number: c.page_number,
        text: c.text,
      })),
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error(await readError(response, "The assistant could not answer."));
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";
    for (const part of parts) {
      for (const line of part.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const event = JSON.parse(payload) as { type?: string; delta?: string };
          if (event.type === "response.output_text.delta" && event.delta) {
            params.onDelta(event.delta);
          }
        } catch {
          // ignore keep-alive / non-JSON frames
        }
      }
    }
  }
}
