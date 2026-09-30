# DocMind AI — Complete Technical Summary & Architecture Documentation

---

## 1. Executive Summary

| Parameter | Specification |
| :--- | :--- |
| **Project Name** | **DocMind AI** |
| **Category** | AI Document Intelligence / Client-Side Retrieval-Augmented Generation (RAG) |
| **Problem Addressed** | Information retrieval in dense PDFs is slow and keyword search lacks semantic understanding, while generic Large Language Models (LLMs) hallucinate facts without verifiable document grounding. |
| **Solution** | A privacy-preserving, page-aware RAG workspace that extracts text in-browser, indexes dense semantic vectors in client memory, and generates context-constrained answers with clickable page citations and verifiable evidence snippets. |
| **Core Architecture** | Hybrid Client-Server RAG: Browser-side PDF extraction, chunking, and vector cosine indexing; secure server-side proxy routes for embedding and streamed LLM generation. |
| **AI Models Used** | **Pretrained only** (No model training or fine-tuning):<br>• Embedding: `openai/text-embedding-3-small` (1536 dimensions) via OpenRouter<br>• Chat/Generation: `openai/gpt-4o-mini` (or optional Lovable Gateway fallback) |
| **Vector Search** | In-memory exhaustive cosine similarity computed in client-side TypeScript (`dot(a, b) / (norm(a) * norm(b))`) with top-K retrieval ($K=5$, score threshold $\ge 0.30$, relative delta $\le 0.18$). |
| **PDF Processing** | Client-side `pdfjs-dist` (v6.3) running in dedicated Web Worker; strict page-level isolation. |
| **External APIs** | OpenRouter AI API (`/api/v1/embeddings`, `/api/v1/chat/completions`) with Lovable AI Gateway fallback. |
| **Key Differentiator** | **100% Traceable Chain of Custody**: Every answer cites exact inline pages `(p. X)`. Clicking any citation or evidence card dynamically shifts the embedded PDF canvas to the exact page and highlights the evidence with zero document persistence on external servers. |

---

## 2. Abstract

Traditional document inspection relies heavily on manual reading or crude keyword matching (Ctrl+F), both of which fail to comprehend semantic context, cross-page synthesis, or complex inquiries. Conversely, feeding full documents into generic Large Language Models (LLMs) introduces high latency, cost inefficiency, and the critical danger of hallucinations—where models fabricate persuasive but unsupported claims. 

**DocMind AI** resolves this dichotomy by deploying a page-aware, client-orchestrated Retrieval-Augmented Generation (RAG) pipeline. Upon uploading a PDF, document bytes are processed entirely inside the user's browser using PDF.js. Text is extracted page by page, segmented into sentence-bounded chunks with rolling overlap while strictly preserving page isolation, and converted into dense vector representations via a secure server-side embedding proxy. Vectors are held in browser memory, enabling zero-database, client-side cosine similarity search. When a user submits a query, semantic retrieval extracts the top-$K$ matching passages, which are injected into a constrained LLM prompt that explicitly forbids external knowledge. The resulting response is streamed in real time with inline page citations `(p. X)`, linked source evidence cards displaying match confidence scores, and automatic generation of three contextual follow-up questions. Users can click any citation to instantly navigate the PDF viewer to the source page, establishing an auditable, evidence-backed document interaction workflow.

---

## 3. Problem Statement

Modern research papers, legal agreements, clinical reports, and financial filings routinely span dozens of dense pages. Analysts and students face three critical hurdles:
1. **Semantic Inefficiency of Lexical Search**: Keyword search cannot match synonyms, infer conceptual relationships, or answer synthesized analytical questions.
2. **LLM Hallucinations and Lack of Provenance**: Standard generative AI interfaces do not cite page numbers, often invent nonexistent clauses, and cannot be audited without re-reading the entire source text.
3. **Data Privacy and Overhead**: Enterprise vector databases and cloud document pipelines expose sensitive files to third-party database persistence and incur steep infrastructure costs.

DocMind AI addresses these challenges by executing the extraction, chunking, and vector index entirely within the client's transient memory, and enforcing strict prompt-level grounding that compels the AI model to admit when information is missing rather than fabricating an answer.

---

## 4. System Objectives

The implemented DocMind AI system achieves the following verified functional objectives:
- **Client-Side PDF Text Ingestion**: Ingest PDF files directly in the browser via drag-and-drop or file picker without server-side file persistence.
- **Page-Aware Extraction**: Extract text page by page, tagging each segment with its physical page number.
- **Page-Isolated Sentence Chunking**: Partition page text into rolling windows ($\approx 220$ words with $45$-word overlap) that never cross page boundaries, guaranteeing citation integrity.
- **Dense Vector Embedding**: Convert text chunks into 1536-dimensional vectors via a protected server route (`/api/embed`).
- **In-Memory Cosine Vector Store**: Index vectors in transient browser memory with sub-millisecond similarity search.
- **Evidence-Grounded Generation**: Restrict LLM generation to retrieved chunks, instructing the model to declare absence of data when ungrounded.
- **Auditable Inline Citations**: Parse and render interactive inline badges `(p. X)` linking directly to the PDF viewer.
- **Verifiable Evidence Cards**: Present source chunks with match confidence percentages and `View Page ↗` action triggers.
- **Interactive PDF Canvas**: Render crisp PDF pages via an HTML5 canvas with zoom, pan, and automated page navigation.
- **Contextual Follow-Up Suggestions**: Deduplicate and stream exactly three document-grounded related questions after each answer.

---

## 5. System Architecture & High-Level Flow

DocMind AI utilizes a **Hybrid Client-Server RAG Architecture**:

```
[ USER / BROWSER ]
       │
       ▼
 [ PDF Upload ] ──► [ PDF.js Worker ] ──► Page-by-Page Text
                                                │
                                                ▼
                                    [ Sentence-Aware Chunking ]
                                    (220 words / 45-word overlap)
                                                │
                                                ▼
 [ Client In-Memory Index ] ◄──── [ Vector Embeddings ] ◄───┐
 (IndexedChunk[]: vector+page)                              │
       │                                                    │ POST /api/embed
       ▼                                                    │ (Batch of 50 chunks)
 [ User Question ] ─────────────────────────────────────────┤
       │                                                    │
       ▼                                                    │
 [ Query Vector ] ──► [ In-Memory Cosine Search ]          │
                                │                           │
                                ▼                           ▼
                      [ Top-5 Retrieved Chunks ]     [ OPENROUTER API ]
                                │                    (text-embedding-3-small)
                                ▼
                       [ POST /api/ask ]
                                │
                                ▼
                       [ OPENROUTER API ] ──► SSE Token Stream
                       (gpt-4o-mini)                 │
                                                     ▼
                                            [ Client Markdown Parser ]
                                            • Headings, bold, lists
                                            • Inline citations (p. X)
                                            • 3 Related Questions
                                                     │
                                                     ▼
                                            [ Interactive UI ]
                                            • PDF Viewer navigation
                                            • Evidence Cards (match %)
```

---

## 6. Detailed Step-by-Step Workflow

### Step 1 — PDF Upload & Validation
- **File Ingestion**: The user drops a PDF or uses the native file picker in [`UploadZone.tsx`](file:///d:/Doc_Mind/screenshot-magic-0107/src/components/docmind/UploadZone.tsx).
- **Validation**: Enforces MIME type `application/pdf` or `.pdf` extension.
- **Storage Location**: Bytes are converted to `ArrayBuffer` in browser memory. The original file is **never written to disk or sent to a database**.

### Step 2 — Page-by-Page Extraction
- **Library**: `pdfjs-dist` (v6.3) running a dedicated web worker (`pdf.worker.mjs`).
- **Implementation**: [`extractPdfPages()`](file:///d:/Doc_Mind/screenshot-magic-0107/src/lib/pdf.ts) iterates from page $1$ to `doc.numPages`.
- **Handling Empty Pages**: If `text.length < 2`, the page is tagged with `empty: true` and text `"No extractable text"`.
- **Buffer Preservation**: Creates cloned slices of `ArrayBuffer` so worker data transfers do not detach the viewer buffer.

### Step 3 — Page-Isolated Chunking
- **Algorithm**: Sentence-boundary chunking implemented in [`chunkPages()`](file:///d:/Doc_Mind/screenshot-magic-0107/src/lib/chunk.ts).
- **Parameters**: `WORDS_PER_CHUNK = 220`, `WORD_OVERLAP = 45`.
- **Regex Boundary**: Splits text on `/(?<=[.!?])\s+|\n+/`.
- **Page Isolation Rule**: **Chunks never cross page boundaries.** When a page boundary is reached, the buffer is flushed and a new chunk sequence begins for the subsequent page. This guarantees that every chunk has exactly one immutable `page_number`.

### Step 4 — Vector Embedding Generation
- **Client Dispatch**: [`embedTexts()`](file:///d:/Doc_Mind/screenshot-magic-0107/src/lib/rag-client.ts) splits chunks into batches of $50$ (`EMBED_BATCH = 50`) and posts them to `/api/embed`.
- **Server Handler**: [`src/routes/api/embed.ts`](file:///d:/Doc_Mind/screenshot-magic-0107/src/routes/api/embed.ts) validates input with Zod (`z.array(z.string()).max(100)`).
- **Upstream Call**: Forwards payload to OpenRouter `https://openrouter.ai/api/v1/embeddings` using `openai/text-embedding-3-small`.
- **Output**: Returns 1536-dimensional floating-point vectors ordered by input index.

### Step 5 — In-Memory Vector Storage
- **Storage Structure**: An array of objects `IndexedChunk = Chunk & { embedding: number[] }` held in React component state (`setIndex`).
- **Persistence**: Exists exclusively in browser RAM. Reloading the page or clicking "New Document" resets the index.
- **Scalability**: Zero database latency; instantaneous indexing for single documents ($10$ to $200$ pages).

### Step 6 — User Query Ingestion
- Natural language query submitted via the input area in [`ChatWindow.tsx`](file:///d:/Doc_Mind/screenshot-magic-0107/src/components/docmind/ChatWindow.tsx) or triggered via [`QuickActions.tsx`](file:///d:/Doc_Mind/screenshot-magic-0107/src/components/docmind/QuickActions.tsx) (e.g., Summarize, Methodology, Key Findings).

### Step 7 — Query Vectorization
- The question string is embedded via a single-item call to [`embedTexts([question])`](file:///d:/Doc_Mind/screenshot-magic-0107/src/lib/rag-client.ts).

### Step 8 — Cosine Similarity Retrieval
- **Implementation**: [`searchIndex()`](file:///d:/Doc_Mind/screenshot-magic-0107/src/lib/vector-store.ts).
- **Mathematical Formula**:
  $$\text{cosineSimilarity}(u, v) = \frac{u \cdot v}{\|u\| \|v\|} = \frac{\sum_{i=1}^n u_i v_i}{\sqrt{\sum_{i=1}^n u_i^2} \sqrt{\sum_{i=1}^n v_i^2}}$$
- **Filtering Logic**:
  1. Computes similarity for all chunks and sorts descending.
  2. Slices top $K=5$ matches.
  3. Applies dual-threshold pruning: retains chunks where `score >= 0.30` and `score >= bestScore - 0.18`. The top match is always preserved so the LLM can evaluate marginal context.

### Step 9 — Context Assembly
- In [`src/routes/api/ask.ts`](file:///d:/Doc_Mind/screenshot-magic-0107/src/routes/api/ask.ts), retrieved chunks are formatted into an explicit context block:
  ```
  [page 4 | page4_chunk2]
  Multi-head attention allows the model to jointly attend to information...

  ---

  [page 7 | page7_chunk1]
  We trained the models on one machine with 8 NVIDIA P100 GPUs...
  ```

### Step 10 — Grounded LLM Generation
- Upstream chat completion request dispatched to OpenRouter (`openai/gpt-4o-mini`).
- System prompt instructs:
  - Answer using **ONLY** provided document context.
  - **Never invent facts or use outside knowledge.**
  - Cite supporting page numbers inline like `(p. 12)`.
  - Output three grounded follow-up questions at the end under delimiter `---RELATED_QUESTIONS---`.

### Step 11 — SSE Token Streaming
- OpenRouter stream is transformed via a Web `TransformStream` into standard Server-Sent Events (`text/event-stream`).
- [`streamAnswer()`](file:///d:/Doc_Mind/screenshot-magic-0107/src/lib/rag-client.ts) reads chunks in real time, buffers lookahead tokens to intercept the delimiter before it renders, and updates the UI incrementally.

### Step 12 — Inline Citation Parsing & Rendering
- [`ChatMessage.tsx`](file:///d:/Doc_Mind/screenshot-magic-0107/src/components/docmind/ChatMessage.tsx) scans generated text using regex `tokenRegex = /([\(\[](?:[^)\]]*?\b)?(?:p(?:ages?|\.)?\s*\d+[^)\]]*)[\)\]])/gi`.
- Transforms raw text strings like `(p. 4)` or `[p. 4, 7]` into interactive buttons styled with Olive Moss (`#A1AA68`).

### Step 13 — Evidence Cards Display
- Retrieved source chunks are attached to the message object and rendered as [`SourceCard`](file:///d:/Doc_Mind/screenshot-magic-0107/src/components/docmind/SourceCard.tsx) components.
- Each card shows:
  - Document Evidence tag
  - Match confidence percentage: `Math.min(100, Math.round(source.score * 100))%`
  - Chunk ID and Page Badge
  - Verbatim text excerpt
  - `View Page ↗` action button

### Step 14 — Exact PDF Page Navigation
- Clicking an inline citation button or a SourceCard's `View Page` calls `handleOpenPage(pageNumber)`.
- Updates `activePage` and `highlightedEvidencePage` in `src/routes/index.tsx`.
- Navigates the [`PdfViewer`](file:///d:/Doc_Mind/screenshot-magic-0107/src/components/docmind/PdfViewer.tsx) to the target page, re-renders the canvas, applies a subtle visual ring highlight to the active page header, and shows a transient toast notification.

---

## 7. Retrieval-Augmented Generation (RAG) Deep Dive

### Why RAG Instead of Direct Prompting?
1. **Context Window & Cost Efficiency**: Sending an entire 100-page PDF ($50,000+$ words) on every query exhausts token budgets and causes high API latency.
2. **Attention Degradation ("Lost in the Middle")**: LLMs lose recall precision when relevant information is buried in massive monolithic prompts.
3. **Auditability**: RAG isolates the exact chunks that justify the answer, enabling page-level citations.

### Hallucination Mitigation Mechanisms
DocMind AI implements a multi-layer defense against hallucination:
1. **System Prompt Constraint**: Explicitly states: *"Answer questions using ONLY the provided document context. Never invent facts. Never use outside knowledge."*
2. **Negative Disclosure Mandate**: *"If the answer cannot be found in the provided context, clearly say the information was not found in this document."*
3. **Similarity Pruning**: Chunks below cosine threshold ($0.30$) or lagging more than $0.18$ behind the best match are eliminated before prompting.
4. **Follow-Up Question Grounding**: If the model answers that information was not found, the suggestion generator detects `"not found"` and suppresses repetitive prompts, offering grounded exploratory topics instead.

---

## 8. Models Used

| Component | Model ID | Provider | Purpose | Input Format | Output Format | Why Selected |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Embeddings** | `openai/text-embedding-3-small` | OpenRouter | Semantic vector representation of document chunks and queries | Text string (chunk or query, $\le 8191$ tokens) | 1536-dimensional dense float vector array | High semantic retrieval density, low cost, fast inference |
| **Chat / LLM** | `openai/gpt-4o-mini` | OpenRouter | Context-grounded synthesis, page citation, and follow-up generation | System prompt + Chat history + Context chunks + User query | Streamed Markdown text tokens via SSE | Superior instruction adherence, fast time-to-first-token, accurate citations |
| **Fallback Embedding** | `google/gemini-embedding-2` | Lovable Gateway | Optional fallback for embedding generation | Text batch | Float array | High compatibility when using Lovable Gateway API keys |
| **Fallback Chat** | `openai/gpt-6-astra` | Lovable Gateway | Optional fallback chat completion | Chat turns array | Streamed SSE events | Serverless fallback route |

> [!IMPORTANT]
> **No other models exist in the codebase.** There are no OCR models, vision models, cross-encoder rerankers, or local transformer weights.

---

## 9. Pretrained vs. Trained Model Analysis

### Are We Training an AI Model?
**No. The DocMind AI project does not train, fine-tune, or retrain any machine learning model.**

### Architecture Rationale:
1. **Zero Cold-Start Overhead**: Pretrained models (`text-embedding-3-small`, `gpt-4o-mini`) have extensive general language understanding and technical vocabulary out of the box.
2. **Instant Document Agility**: Training or fine-tuning requires hours of gradient optimization and curated training datasets for each new PDF. With RAG, any arbitrary PDF is indexed and queryable within seconds.
3. **Data Integrity & Immutability**: Fine-tuned weights suffer from catastrophic forgetting and weight hallucination. RAG decouples knowledge storage (the transient vector index) from reasoning (the frozen pretrained LLM), ensuring facts come strictly from retrieved chunks.

---

## 10. APIs and External Services

| Service | Provider | Endpoint | Data Sent | Data Returned |
| :--- | :--- | :--- | :--- | :--- |
| **Embeddings API** | OpenRouter | `https://openrouter.ai/api/v1/embeddings` | JSON `{ model: "openai/text-embedding-3-small", input: string[] }` | Vector array: `{ data: [{ index: 0, embedding: number[] }] }` |
| **Chat Completions API** | OpenRouter | `https://openrouter.ai/api/v1/chat/completions` | JSON `{ model: "openai/gpt-4o-mini", messages: [...], stream: true }` | Server-Sent Events stream (`data: {"choices":[{"delta":{"content":"..."}}]}`) |
| **Lovable AI Gateway (Fallback)** | Lovable | `https://ai.gateway.lovable.dev/v1/embeddings` & `/responses` | JSON payload with Lovable API Key | Embeddings array or streamed SSE response |

---

## 11. Libraries, Packages, and Dependencies

### Frontend & Application Framework
- **`@tanstack/react-start` (v1.168.32)** & **`@tanstack/react-router` (v1.170.18)**: Full-stack meta-framework providing type-safe file-based routing and server API endpoints (`createFileRoute`).
- **`react` (v19.2.0)** & **`react-dom` (v19.2.0)**: Modern declarative user interface runtime.
- **`@tailwindcss/vite` (v4.2.1)** & **Tailwind CSS**: Utility-first responsive design system using CSS variables for theme tokens (Berry Wine, Olive Moss, Warm Ivory).
- **`lucide-react` (v0.575.0)**: Lightweight SVG iconography across all document tools.
- **`sonner` (v1.7.4)**: Accessible toast notifications for page navigation and copy actions.

### PDF Processing
- **`pdfjs-dist` (v6.3.289)**: Mozilla's standard PDF engine. Executes client-side extraction of text content streams and canvas rendering in a dedicated web worker (`pdf.worker.mjs`).

### Validation & Utilities
- **`zod` (v3.25.76)**: Runtime schema validation for server route payloads (`/api/embed` and `/api/ask`).
- **`clsx` (v2.1.1)** & **`tailwind-merge` (v8.8.9)**: Conditional class merging.
- **`@radix-ui/react-progress`**: Accessible progress bar during multi-stage PDF indexing.

---

## 12. Component Architecture & Source Organization

| Source File | Key Responsibilities |
| :--- | :--- |
| [`src/routes/index.tsx`](file:///d:/Doc_Mind/screenshot-magic-0107/src/routes/index.tsx) | Root application orchestrator: handles document upload state, indexing lifecycle, active page selection, split viewer/chat layout, and home landing view. |
| [`src/lib/pdf.ts`](file:///d:/Doc_Mind/screenshot-magic-0107/src/lib/pdf.ts) | Client-side PDF text extraction via PDF.js worker; tags pages with page numbers and detects empty pages. |
| [`src/lib/chunk.ts`](file:///d:/Doc_Mind/screenshot-magic-0107/src/lib/chunk.ts) | Sentence-aware sliding chunker (220 words / 45 overlap) with strict page boundary isolation. |
| [`src/lib/vector-store.ts`](file:///d:/Doc_Mind/screenshot-magic-0107/src/lib/vector-store.ts) | In-memory cosine similarity calculation, vector normalization, top-$K$ sorting, and dual-threshold pruning. |
| [`src/lib/rag-client.ts`](file:///d:/Doc_Mind/screenshot-magic-0107/src/lib/rag-client.ts) | Client-side API orchestrator for batched embedding calls and SSE streaming answer ingestion with delimiter lookahead. |
| [`src/lib/env.ts`](file:///d:/Doc_Mind/screenshot-magic-0107/src/lib/env.ts) | Centralized environment resolver reading `OPENROUTER_API_KEY`, models, or fallback Lovable keys. |
| [`src/routes/api/embed.ts`](file:///d:/Doc_Mind/screenshot-magic-0107/src/routes/api/embed.ts) | Protected server route forwarding chunk batches to OpenRouter embedding API; protects API keys from browser exposure. |
| [`src/routes/api/ask.ts`](file:///d:/Doc_Mind/screenshot-magic-0107/src/routes/api/ask.ts) | Protected server route assembling grounded system prompts and piping SSE tokens from OpenRouter to client. |
| [`src/components/docmind/PdfViewer.tsx`](file:///d:/Doc_Mind/screenshot-magic-0107/src/components/docmind/PdfViewer.tsx) | HTML5 Canvas-based PDF viewer with zoom controls, page jumps, loading states, and page highlight triggers. |
| [`src/components/docmind/ChatWindow.tsx`](file:///d:/Doc_Mind/screenshot-magic-0107/src/components/docmind/ChatWindow.tsx) | Chat interface supporting follow-up question inputs, backdrop blur during inference, and `GeneratingOrb` overlay. |
| [`src/components/docmind/ChatMessage.tsx`](file:///d:/Doc_Mind/screenshot-magic-0107/src/components/docmind/ChatMessage.tsx) | Custom Markdown parser rendering headings, lists, inline citations `(p. X)`, and associated SourceCards. |
| [`src/components/docmind/SourceCard.tsx`](file:///d:/Doc_Mind/screenshot-magic-0107/src/components/docmind/SourceCard.tsx) | Interactive evidence display showing match confidence score, chunk text, and `View Page ↗` action button. |
| [`src/components/docmind/QuickActions.tsx`](file:///d:/Doc_Mind/screenshot-magic-0107/src/components/docmind/QuickActions.tsx) | Pre-configured analytical prompt bar (Summarize, Main Objective, Methodology, Key Findings, Limitations). |
| [`src/components/docmind/RelatedQuestions.tsx`](file:///d:/Doc_Mind/screenshot-magic-0107/src/components/docmind/RelatedQuestions.tsx) | Renders exactly 3 grounded follow-up question buttons with click-to-ask behavior. |
| [`src/components/ui/generating-orb.tsx`](file:///d:/Doc_Mind/screenshot-magic-0107/src/components/ui/generating-orb.tsx) | Animated orb with CSS/Canvas renderers indicating active LLM generation. |
| [`src/components/docmind/UploadZone.tsx`](file:///d:/Doc_Mind/screenshot-magic-0107/src/components/docmind/UploadZone.tsx) | Drag-and-drop PDF upload component with progress feedback during indexing. |

---

## 13. Prompt Engineering & System Prompt Analysis

The system prompt in [`src/routes/api/ask.ts`](file:///d:/Doc_Mind/screenshot-magic-0107/src/routes/api/ask.ts) enforces the following constraints:

```text
You are DocMind AI, an evidence-grounded document assistant.

Answer questions using ONLY the provided document context.

Rules:
1. Use only information contained in the retrieved context.
2. Never invent facts.
3. Never use outside knowledge to fill missing information.
4. If the answer cannot be found in the provided context, clearly say the information was not found in this document.
5. Maintain conversational context for follow-up questions.
6. Format answers cleanly with markdown headings, paragraphs, and bullet points where helpful.
7. Cite the supporting page numbers inline like (p. 12).
8. Do not claim something is in the document unless the retrieved context supports it.
9. If multiple sections support the answer, cite each page.

FOLLOW-UP QUESTIONS REQUIREMENT:
At the very end of your response, after your complete answer, output a dedicated follow-up questions block formatted exactly as:

---RELATED_QUESTIONS---
1. <First concise question grounded in the retrieved document context>
2. <Second concise question grounded in the retrieved document context>
3. <Third concise question grounded in the retrieved document context>
```

### Purpose of Key Directives:
- **Rule 1 & 3 (Context Closure)**: Creates an epistemic boundary preventing the model from drawing on unverified pre-training data.
- **Rule 4 (Admit Missing Data)**: Reduces hallucination rates by rewarding explicit statements of non-presence.
- **Rule 7 & 9 (Traceability)**: Forces the model to attach page markers directly to factual assertions, which the client regex converts into clickable links.
- **Follow-up Block**: Uses a distinct ASCII delimiter (`---RELATED_QUESTIONS---`) so the client streaming parser can seamlessly separate the answer body from follow-up suggestions before rendering.

---

## 14. Conversational Memory & Context Tracking

1. **Window Size**: Retains up to $12$ previous conversational turns (`history.max(12)` in `ask.ts`).
2. **Context Passing**: Each new request sends the full recent dialogue history alongside the freshly retrieved context chunks for the current question:
   ```json
   {
     "role": "user",
     "content": "What is the optimizer?"
   },
   {
     "role": "assistant",
     "content": "The authors use Adam with β1 = 0.9... (p. 7)"
   },
   {
     "role": "user",
     "content": "What was the learning rate schedule?"
   }
   ```
3. **Persistence Scope**: Conversation history is maintained in React memory. It **does not persist across page refreshes** or survive document resets, preserving complete session privacy.

---

## 15. Security, Privacy, and Data Governance

- **Zero Third-Party Database Ingestion**: Neither the PDF binary nor its extracted text is stored in Pinecone, Weaviate, Supabase, or any external database.
- **Browser-Contained Extraction**: Text extraction via PDF.js runs client-side inside the user's browser sandbox.
- **Server API Key Isolation**: OpenRouter and Lovable API keys reside strictly in server-side environment variables (`process.env.OPENROUTER_API_KEY`). They are never bundled into client JavaScript.
- **Strict Input Validation**: All server endpoints enforce Zod schemas, restricting question length ($\le 2000$ characters) and chunk counts ($\le 12$ chunks) to block Denial-of-Service and payload tampering.
- **Sanitized Markdown Rendering**: The custom Markdown parser in `ChatMessage.tsx` builds React DOM nodes directly from structured AST blocks rather than using dangerous `dangerouslySetInnerHTML`, mitigating Cross-Site Scripting (XSS) vectors.

---

## 16. Technical Limitations of the Current Implementation

1. **Scanned & Image-Only PDFs**: Text extraction relies purely on embedded font glyphs via PDF.js `getTextContent()`. PDFs consisting solely of scanned images contain no text layers and will yield `"No extractable text"`. Optical Character Recognition (OCR) is **not implemented**.
2. **Complex Table Parsing**: Multi-column layouts and borderless tables may have their text flattened into horizontal streams, occasionally degrading tabular spatial context.
3. **Session Volatility**: Because index vectors exist only in browser memory, a hard browser refresh requires the user to re-index the PDF.
4. **Single-Document Scope**: The current vector index indexes one document at a time; multi-document cross-corpus queries are not supported.
5. **Context Window Cap**: Retrieval is capped at the top $5$ chunks ($\approx 1100$ words). Questions requiring synthesis across $30+$ different pages simultaneously cannot receive all relevant text at once.

---

## 17. Future Enhancements (Clearly Not Implemented in Current Codebase)

The following capabilities are **not currently implemented** and represent areas for future architectural expansion:
- **Client-Side or Server-Side OCR**: Integrating Tesseract.js or cloud vision OCR to support scanned image PDFs.
- **Persistent Vector Caching**: Storing generated vectors in IndexedDB to avoid re-embedding upon browser reloads.
- **Cross-Encoder Reranking**: Running a local mini-reranker (e.g., via ONNX Runtime Web) to re-score the top-$20$ retrieved passages.
- **Multi-Document Workspaces**: Enabling simultaneous vector querying across folders of documents.
- **Bounding Box Annotation**: Overlaying visual highlight rectangles directly onto the PDF canvas corresponding to exact character coordinates.

---

## 18. Model Importance Analysis

### Embedding Model (`openai/text-embedding-3-small`)
- **What it does**: Maps variable-length text passages and queries into continuous 1536-dimensional semantic vector space.
- **Why it is needed**: Enables semantic similarity retrieval based on meaning rather than literal keyword matches.
- **What would happen without it**: Semantic vector retrieval would be impossible; the system would revert to basic keyword matching or fail to find synonymous concepts.

### Chat / Generation Model (`openai/gpt-4o-mini`)
- **What it does**: Synthesizes retrieved textual context into fluent, structured natural language answers with exact page citations.
- **Why it is needed**: Transforms raw, fragmented document excerpts into coherent, conversational explanations.
- **What would happen without it**: The system could only display raw, disconnected text chunks, requiring users to manually read and stitch together answers.

### PDF Engine (`pdfjs-dist`)
- **What it does**: Parses PDF binary structures, extracts text streams per page, and renders visual page viewports to HTML5 canvas.
- **Why it is needed**: Provides the page-level text extraction and document visualization foundation.
- **What would happen without it**: The application could neither extract text nor render the visual PDF in the browser.

---

## 19. 15 Viva / Technical Judge Questions & Answers

#### Q1: What is Retrieval-Augmented Generation (RAG)?
**Answer**: RAG is an architectural pattern where an external knowledge retrieval step precedes LLM text generation. Instead of asking a model to answer from static pre-training memory, relevant document passages are retrieved via semantic vector search and passed dynamically into the model's context window alongside the query.

#### Q2: Did your team train or fine-tune an AI model?
**Answer**: No. The system intentionally uses frozen, pretrained models (`text-embedding-3-small` and `gpt-4o-mini`) via API endpoints. RAG eliminates the need for expensive, time-consuming model training while delivering accurate, verifiable answers on any uploaded PDF within seconds.

#### Q3: Where are the document vectors stored?
**Answer**: Vectors are stored entirely in client-side browser memory as an array of JavaScript objects (`IndexedChunk[]`). There is no external vector database (such as Pinecone or Milvus).

#### Q4: How is similarity search executed?
**Answer**: We compute exhaustive cosine similarity between the 1536-dimensional query embedding and all indexed chunk embeddings directly in TypeScript using the formula `dot(a, b) / (norm(a) * norm(b))`, sorting the results descending and selecting the top $K=5$ chunks above a $0.30$ similarity threshold.

#### Q5: Why do chunks never cross page boundaries?
**Answer**: Page isolation ensures that every chunk has a single, unambiguous `page_number` metadata attribute. If chunks spanned page transitions, inline citations like `(p. 4)` would be ambiguous or misleading.

#### Q6: How does DocMind AI prevent hallucinations?
**Answer**: Through strict prompt engineering requiring the model to answer *only* from retrieved passages, explicit instructions to declare when information is missing, similarity score thresholding to discard irrelevant context, and inline page citations that allow users to immediately audit claims against the original PDF.

#### Q7: How do clickable citations navigate the PDF viewer?
**Answer**: The client parser uses regular expressions to detect patterns like `(p. 7)` in the streamed Markdown and renders them as clickable buttons. When clicked, an event handler updates `activePage` state, triggering `PdfViewer` to load and render the corresponding page on the HTML5 canvas with a visual highlight.

#### Q8: What embedding model is used and what is its vector dimension?
**Answer**: We use OpenAI's `text-embedding-3-small` via OpenRouter, which produces dense vectors with $1536$ dimensions.

#### Q9: What happens if a user uploads a scanned PDF with no text layer?
**Answer**: PDF.js extracts an empty string, tags the page as `empty: true`, and assigns text `"No extractable text"`. These empty pages are omitted from vector indexing. The current system does not perform OCR.

#### Q10: How are follow-up questions generated?
**Answer**: The LLM is instructed in the system prompt to append exactly three concise, context-grounded questions under a delimiter (`---RELATED_QUESTIONS---`). The client stream reader intercepts this delimiter using a lookahead buffer, strips it from the chat bubble, and renders the three questions as interactive suggestion buttons.

#### Q11: How is the API key protected from browser inspection?
**Answer**: All requests to OpenRouter route through server-side TanStack Start handlers (`/api/embed` and `/api/ask`). The browser only communicates with internal application endpoints; the `OPENROUTER_API_KEY` never reaches client JavaScript.

#### Q12: What is the chunking strategy and size?
**Answer**: We use sentence-aware sliding window chunking with a target size of $220$ words and a $45$-word sentence-bounded overlap, implemented in `src/lib/chunk.ts`.

#### Q13: Does DocMind AI support conversation history?
**Answer**: Yes. Up to $12$ previous dialogue turns are sent with each request to `/api/ask`, allowing users to ask natural follow-up questions like *"Can you elaborate on its third point?"*.

#### Q14: What is the purpose of the GeneratingOrb component?
**Answer**: While the LLM is preparing the response, `GeneratingOrb` displays a focused glowing animation centered over a dimmed, blurred backdrop of prior chat history, giving users clear visual feedback that evidence analysis is actively taking place.

#### Q15: How could this system scale to enterprise multi-document libraries?
**Answer**: By migrating vector storage from client memory to an external vector database (such as pgvector or Qdrant), introducing an asynchronous worker queue for background PDF indexing, and implementing a cross-encoder reranker to handle larger candidate retrieval pools.

---

## 20. Codebase Verification Table

| Claim / Feature | Source File Reference | Verification Status |
| :--- | :--- | :--- |
| **Client-Side PDF Text Extraction** | [`src/lib/pdf.ts:21-60`](file:///d:/Doc_Mind/screenshot-magic-0107/src/lib/pdf.ts#L21-L60) | **Verified** |
| **Sentence-Aware Chunking (220/45)** | [`src/lib/chunk.ts:9-75`](file:///d:/Doc_Mind/screenshot-magic-0107/src/lib/chunk.ts#L9-L75) | **Verified** |
| **In-Memory Cosine Similarity Store** | [`src/lib/vector-store.ts:17-43`](file:///d:/Doc_Mind/screenshot-magic-0107/src/lib/vector-store.ts#L17-L43) | **Verified** |
| **Server-Side Embedding Route** | [`src/routes/api/embed.ts:15-95`](file:///d:/Doc_Mind/screenshot-magic-0107/src/routes/api/embed.ts#L15-L95) | **Verified** |
| **Server-Side Grounded Chat Route** | [`src/routes/api/ask.ts:67-238`](file:///d:/Doc_Mind/screenshot-magic-0107/src/routes/api/ask.ts#L67-L238) | **Verified** |
| **Pretrained Models (`text-embedding-3-small`, `gpt-4o-mini`)** | [`src/lib/env.ts:28-30`](file:///d:/Doc_Mind/screenshot-magic-0107/src/lib/env.ts#L28-L30), [`src/routes/api/ask.ts:6`](file:///d:/Doc_Mind/screenshot-magic-0107/src/routes/api/ask.ts#L6) | **Verified** |
| **SSE Answer Streaming & Lookahead Parsing** | [`src/lib/rag-client.ts:165-285`](file:///d:/Doc_Mind/screenshot-magic-0107/src/lib/rag-client.ts#L165-L285) | **Verified** |
| **Clickable Citation Parsing `(p. X)`** | [`src/components/docmind/ChatMessage.tsx:205-261`](file:///d:/Doc_Mind/screenshot-magic-0107/src/components/docmind/ChatMessage.tsx#L205-L261) | **Verified** |
| **Evidence Cards with Match % & Page Jump** | [`src/components/docmind/SourceCard.tsx:15-99`](file:///d:/Doc_Mind/screenshot-magic-0107/src/components/docmind/SourceCard.tsx#L15-L99) | **Verified** |
| **Canvas PDF Viewer Navigation** | [`src/components/docmind/PdfViewer.tsx:49-140`](file:///d:/Doc_Mind/screenshot-magic-0107/src/components/docmind/PdfViewer.tsx#L49-L140) | **Verified** |
| **AI Quick Actions Analytical Templates** | [`src/components/docmind/quick-actions-data.ts:20-71`](file:///d:/Doc_Mind/screenshot-magic-0107/src/components/docmind/quick-actions-data.ts#L20-L71) | **Verified** |
| **Follow-Up Related Questions System** | [`src/components/docmind/RelatedQuestions.tsx:10-50`](file:///d:/Doc_Mind/screenshot-magic-0107/src/components/docmind/RelatedQuestions.tsx#L10-L50) | **Verified** |
| **GeneratingOrb Overlay & Blur Effect** | [`src/components/docmind/ChatWindow.tsx:73-141`](file:///d:/Doc_Mind/screenshot-magic-0107/src/components/docmind/ChatWindow.tsx#L73-L141) | **Verified** |
| **Model Training / Fine-Tuning** | *Entire codebase* | **Confirmed Not Implemented** |
| **Optical Character Recognition (OCR)** | *Entire codebase* | **Confirmed Not Implemented** |
| **External Vector Database (Pinecone, etc.)** | *Entire codebase* | **Confirmed Not Implemented** |
