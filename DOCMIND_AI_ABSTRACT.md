# DocMind AI — Project Abstract & Presentation Brief

---

## 1. Formal Project Abstract (175 Words)

Manual extraction of insights from voluminous PDF documents is inherently laborious, error-prone, and constrained by the lexical limitations of keyword search. Conversely, deploying standard Large Language Models introduces significant risk of ungrounded hallucinations, lacks citation provenance, and presents severe data privacy vulnerabilities when proprietary documents are transmitted to cloud databases. 

**DocMind AI** introduces a privacy-preserving, page-aware Retrieval-Augmented Generation (RAG) system executed directly in the client browser. Utilizing Mozilla’s PDF.js engine, documents are ingested, parsed page by page, and partitioned into sentence-bounded chunks with strict page-level isolation. Text chunks are transformed into 1536-dimensional dense vectors via a secure server embedding proxy and indexed entirely in volatile browser memory. 

Upon receiving a user query, exhaustive in-memory cosine similarity retrieval isolates the top matching passages, passing them to a context-constrained LLM. The resulting response is streamed with auditable inline page citations `(p. X)`, linked evidence cards with match confidence scores, and three automated follow-up suggestions. Clicking any citation immediately navigates the integrated PDF viewer to the source page, achieving verifiable document intelligence with zero server-side document persistence.

---

## 2. Explain DocMind AI in 60 Seconds (Elevator Pitch for Judges)

> "Judges, reading dense PDFs—like research papers, legal contracts, or financial reports—takes hours, and basic keyword search can't answer conceptual questions. But if you paste text into ChatGPT, you risk hallucinations and you have no idea which page the answer actually came from.
>
> That is why we built **DocMind AI**.
>
> When you drop any PDF into DocMind, the entire document is extracted and indexed **locally inside your browser's memory**. We chunk the text with strict page boundaries, convert it into dense vector embeddings, and perform sub-millisecond cosine similarity search right in the client.
>
> When you ask a question, DocMind retrieves the exact passages and feeds them into our grounded AI assistant. The AI is strictly instructed to answer *only* from the text and cite exact page numbers.
>
> Every answer comes with clickable citations like `(p. 4)` and source evidence cards showing similarity match percentages. Click any citation, and our PDF canvas jumps straight to that exact page. You get instant, grounded, and 100% auditable answers with complete data privacy and zero database overhead. That is DocMind AI."

---

## 3. Key Differentiators Matrix

| Feature | Generic Chatbots (ChatGPT / Claude) | Standard Enterprise RAG | DocMind AI |
| :--- | :--- | :--- | :--- |
| **Document Grounding** | Low (relies heavily on training weights) | Moderate to High | **Strict (Prompt forbids outside facts)** |
| **Citation Granularity** | None or document-level only | Vague section headers | **Exact Page Badges `(p. X)`** |
| **Interactive Auditability**| None | Separate static link | **Click citation ➔ Canvas jumps to page** |
| **Document Privacy** | Stored on model provider servers | Stored in remote vector database | **Transient in browser memory only** |
| **Infrastructure Cost** | High monthly subscription | Ongoing vector database hosting | **Zero database cost (Serverless proxy)** |
| **Setup Time** | Manual copy-pasting | Heavy cloud ingestion pipeline | **Instant drag-and-drop in 5 seconds** |

---

## 4. Quick Facts & Technical Specifications

- **Application Type**: Hybrid Client-Server RAG Web Application
- **Language & Runtime**: TypeScript / React 19 / Node.js
- **Framework**: TanStack Start / TanStack Router (Meta-framework)
- **PDF Engine**: `pdfjs-dist` (v6.3) in dedicated Web Worker
- **Embedding Model**: `openai/text-embedding-3-small` (1536 Dimensions)
- **Chat Generation Model**: `openai/gpt-4o-mini`
- **Model Training / Fine-Tuning**: **None** (Pretrained models accessed via OpenRouter API)
- **Vector Index**: In-memory JavaScript array with exhaustive cosine similarity
- **Chunking Parameters**: 220 words per chunk, 45-word sentence-aware overlap, zero cross-page leakage
- **Retrieval Thresholds**: Top $K=5$, minimum similarity score $\ge 0.30$, relative delta from best $\le 0.18$
- **Stream Format**: Server-Sent Events (`text/event-stream`) with custom AST lookahead delimiter parsing
- **Primary Design Palette**: Berry Wine (`#731235`), Olive Moss (`#A1AA68`), Warm Ivory (`#F8F6F2`), Charcoal (`#242124`)
