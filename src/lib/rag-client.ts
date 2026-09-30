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

export type StreamAnswerResult = {
  content: string;
  suggestions: string[];
};

function normalizeText(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const DELIMITER_REGEX = /\n?-{2,}\s*RELATED[_\s]QUESTIONS\s*-{2,}\n?/i;
const TARGET_PREFIX = "\n\n---RELATED_QUESTIONS---\n";

function parseAndEnforce3Suggestions(params: {
  suggestionsRaw: string;
  answerText: string;
  question: string;
  history: ChatTurn[];
  context: (Retrieved | Chunk)[];
}): string[] {
  const askedSet = new Set<string>();
  askedSet.add(normalizeText(params.question));
  if (Array.isArray(params.history)) {
    for (const h of params.history) {
      if (h.content) askedSet.add(normalizeText(h.content));
    }
  }

  const isNotFound =
    /(not found|does not provide|cannot be found|no information|not mention|unclear from the context)/i.test(
      params.answerText,
    );

  const rawLines = params.suggestionsRaw ? params.suggestionsRaw.split("\n") : [];
  const candidates: string[] = [];

  for (const line of rawLines) {
    let clean = line
      .replace(/^(\d+[\.\)]\s*|[-*•]\s*)/, "")
      .replace(/^["'`]|["'`]$/g, "")
      .trim();
    if (!clean) continue;
    if (!clean.endsWith("?")) clean += "?";

    // Skip if it contains delimiter or is too short
    if (clean.includes("---") || clean.length < 10) continue;

    // Check duplicate against current question and conversation history
    const norm = normalizeText(clean);
    if (askedSet.has(norm)) continue;

    // If answer states information was not found, avoid repeating keywords of the current question
    if (isNotFound) {
      const qWords = params.question.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
      const matchesKeyword = qWords.some((w) => clean.toLowerCase().includes(w));
      if (matchesKeyword) continue;
    }

    if (!candidates.includes(clean)) {
      candidates.push(clean);
      askedSet.add(norm);
    }
  }

  // Fallback generator from context chunks to ensure EXACTLY 3
  if (candidates.length < 3 && Array.isArray(params.context) && params.context.length > 0) {
    const fallbackTemplates = [
      (topic: string, page: number) => `What details does page ${page} provide regarding ${topic}?`,
      (topic: string) => `What methodology or tools are discussed for ${topic}?`,
      (topic: string) => `What key findings or metrics are reported in ${topic}?`,
      (topic: string, page: number) => `How is ${topic} implemented according to page ${page}?`,
      (topic: string) => `What are the primary conclusions regarding ${topic}?`,
    ];

    for (let i = 0; i < params.context.length && candidates.length < 3; i++) {
      const c = params.context[i];
      if (!c) continue;
      const page = c.page_number || 1;
      const text = c.text || "";

      // Extract a representative phrase / heading from the chunk
      const lines = text
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 5 && l.length < 60);
      const firstHeading = lines.find((l) => !l.startsWith("http") && !/^\d+$/.test(l)) || "";
      const topic = firstHeading
        ? firstHeading.replace(/[:\-]$/, "").toLowerCase()
        : `the topics on page ${page}`;

      const template = fallbackTemplates[i % fallbackTemplates.length];
      if (template) {
        const fallbackQ = template(topic, page);
        const norm = normalizeText(fallbackQ);
        if (!askedSet.has(norm) && !candidates.includes(fallbackQ)) {
          candidates.push(fallbackQ);
          askedSet.add(norm);
        }
      }
    }
  }

  // Final static grounded fallbacks to guarantee strictly 3
  const ultimateFallbacks = [
    "What are the main topics covered in this document?",
    "What methodology or approach is described?",
    "What are the key results and findings?",
  ];

  for (const fallback of ultimateFallbacks) {
    if (candidates.length >= 3) break;
    const norm = normalizeText(fallback);
    if (!askedSet.has(norm) && !candidates.includes(fallback)) {
      candidates.push(fallback);
      askedSet.add(norm);
    }
  }

  return candidates.slice(0, 3);
}

export async function streamAnswer(params: {
  question: string;
  documentName: string;
  context: (Retrieved | Chunk)[];
  history: ChatTurn[];
  signal?: AbortSignal;
  onDelta: (text: string) => void;
  onSuggestions?: (questions: string[]) => void;
}): Promise<StreamAnswerResult> {
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

  let lookaheadBuffer = "";
  let answerAccumulated = "";
  let suggestionsRaw = "";
  let delimiterFound = false;

  const processDelta = (delta: string) => {
    if (delimiterFound) {
      suggestionsRaw += delta;
      return;
    }

    lookaheadBuffer += delta;

    const match = DELIMITER_REGEX.exec(lookaheadBuffer);
    if (match && match.index !== undefined) {
      const before = lookaheadBuffer.slice(0, match.index);
      if (before) {
        answerAccumulated += before;
        params.onDelta(before);
      }
      suggestionsRaw += lookaheadBuffer.slice(match.index + match[0].length);
      delimiterFound = true;
      lookaheadBuffer = "";
    } else {
      // Withhold potential delimiter prefix from being prematurely rendered in the chat bubble
      let holdLen = 0;
      for (let len = 1; len <= Math.min(lookaheadBuffer.length, 30); len++) {
        const tail = lookaheadBuffer.slice(-len);
        if (TARGET_PREFIX.includes(tail)) {
          holdLen = len;
        }
      }

      const safeLen = lookaheadBuffer.length - holdLen;
      if (safeLen > 0) {
        const emit = lookaheadBuffer.slice(0, safeLen);
        answerAccumulated += emit;
        params.onDelta(emit);
        lookaheadBuffer = lookaheadBuffer.slice(safeLen);
      }
    }
  };

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
          const event = JSON.parse(payload) as {
            type?: string;
            delta?: string;
            choices?: Array<{ delta?: { content?: string } }>;
          };
          if (event.type === "response.output_text.delta" && event.delta) {
            processDelta(event.delta);
          } else if (event.choices?.[0]?.delta?.content) {
            processDelta(event.choices[0].delta.content);
          } else if (typeof event.delta === "string" && event.delta) {
            processDelta(event.delta);
          }
        } catch {
          // ignore keep-alive / non-JSON frames
        }
      }
    }
  }

  // Flush remaining lookahead buffer if delimiter was never encountered
  if (!delimiterFound && lookaheadBuffer.length > 0) {
    answerAccumulated += lookaheadBuffer;
    params.onDelta(lookaheadBuffer);
    lookaheadBuffer = "";
  }

  const suggestions = parseAndEnforce3Suggestions({
    suggestionsRaw,
    answerText: answerAccumulated,
    question: params.question,
    history: params.history,
    context: params.context,
  });

  params.onSuggestions?.(suggestions);

  return {
    content: answerAccumulated.trim(),
    suggestions,
  };
}
