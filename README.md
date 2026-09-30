# DocMind AI

Evidence-grounded question answering over PDF documents.

## Pipeline

```
PDF → page-aware text extraction → chunking (overlap) → embeddings
    → local vector index → similarity search → top-k context
    → LLM → grounded answer + page evidence
```

## Where things live

| Step | File |
| --- | --- |
| PDF text extraction (per page, pdf.js) | `src/lib/pdf.ts` |
| Sentence-aware chunking with overlap | `src/lib/chunk.ts` |
| Cosine-similarity vector store | `src/lib/vector-store.ts` |
| Client pipeline calls / SSE streaming | `src/lib/rag-client.ts` |
| Embeddings endpoint | `src/routes/api/embed.ts` |
| Grounded answer endpoint (system prompt) | `src/routes/api/ask.ts` |
| UI | `src/routes/index.tsx`, `src/components/docmind/*` |

## Notes

- No model is trained or fine-tuned: pretrained embeddings + pretrained LLM only.
- Pages with no extractable text are marked `No extractable text` and skipped during indexing.
- The system prompt forbids outside knowledge; when the context has no answer the assistant says so.
- Retrieval settings: chunk ≈220 words with 45-word overlap, top-k = 5.
