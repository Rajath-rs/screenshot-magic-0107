<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Project rules

- RAG pipeline runs client-side (PDF extraction, chunking, in-memory cosine vector index in `src/lib/`), because the edge runtime cannot host PyMuPDF/FAISS and a per-document index needs no persistence.
- All AI calls go through server routes `src/routes/api/embed.ts` (embeddings) and `src/routes/api/ask.ts` (streamed grounded answers), so `LOVABLE_API_KEY` never reaches the browser.
- The LLM id is a single constant (`CHAT_MODEL`) in `src/routes/api/ask.ts` so the provider can be swapped without touching the pipeline.
