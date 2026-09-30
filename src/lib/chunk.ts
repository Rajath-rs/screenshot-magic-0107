import type { PdfPage } from "./pdf";

export type Chunk = {
  chunk_id: string;
  page_number: number;
  text: string;
};

const WORDS_PER_CHUNK = 220;
const WORD_OVERLAP = 45;

/**
 * Sentence-aware chunking with overlap. Chunks never span pages, so every
 * chunk keeps an exact page number for evidence.
 */
export function chunkPages(
  pages: PdfPage[],
  wordsPerChunk = WORDS_PER_CHUNK,
  overlap = WORD_OVERLAP,
): Chunk[] {
  const chunks: Chunk[] = [];

  for (const page of pages) {
    if (page.empty) continue;
    const sentences = page.text
      .split(/(?<=[.!?])\s+|\n+/)
      .map((s) => s.trim())
      .filter(Boolean);

    let buffer: string[] = [];
    let count = 0;
    let index = 0;

    const flush = () => {
      if (!buffer.length) return;
      const text = buffer.join(" ").trim();
      if (text.length > 20) {
        chunks.push({
          chunk_id: `page${page.page_number}_chunk${index + 1}`,
          page_number: page.page_number,
          text,
        });
        index++;
      }
      // keep a tail of sentences as overlap
      const tail: string[] = [];
      let tailWords = 0;
      for (let i = buffer.length - 1; i >= 0 && tailWords < overlap; i--) {
        const sentence = buffer[i] ?? "";
        tail.unshift(sentence);
        tailWords += sentence.split(/\s+/).length;
      }
      buffer = tail;
      count = tailWords;
    };

    for (const sentence of sentences) {
      const words = sentence.split(/\s+/).length;
      if (count + words > wordsPerChunk && count > 0) flush();
      buffer.push(sentence);
      count += words;
    }
    if (count > 0) {
      const text = buffer.join(" ").trim();
      if (text.length > 20) {
        chunks.push({
          chunk_id: `page${page.page_number}_chunk${index + 1}`,
          page_number: page.page_number,
          text,
        });
      }
    }
  }

  return chunks;
}
