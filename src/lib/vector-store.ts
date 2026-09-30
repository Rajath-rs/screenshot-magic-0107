import type { Chunk } from "./chunk";

export type IndexedChunk = Chunk & { embedding: number[] };

export type Retrieved = Chunk & { score: number };

function dot(a: number[], b: number[]) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += (a[i] ?? 0) * (b[i] ?? 0);
  return sum;
}

function norm(a: number[]) {
  return Math.sqrt(dot(a, a)) || 1;
}

export function cosineSimilarity(a: number[], b: number[]) {
  return dot(a, b) / (norm(a) * norm(b));
}

/**
 * In-memory vector store (the browser-side equivalent of a local FAISS index).
 * Exhaustive cosine search — exact and fast for single-document scale.
 */
export function searchIndex(
  index: IndexedChunk[],
  queryEmbedding: number[],
  topK = 5,
  minScore = 0.3,
): Retrieved[] {
  const scored = index.map((c) => ({
    chunk_id: c.chunk_id,
    page_number: c.page_number,
    text: c.text,
    score: cosineSimilarity(queryEmbedding, c.embedding),
  }));
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, topK);
  const best = top[0]?.score ?? 0;
  // Drop clearly irrelevant hits, but always keep the best match so the
  // model itself can decide the document has no answer.
  return top.filter((c, i) => i === 0 || (c.score >= minScore && c.score >= best - 0.18));
}
