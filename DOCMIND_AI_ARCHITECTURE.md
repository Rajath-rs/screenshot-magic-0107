# DocMind AI — Technical Architecture & Workflow Blueprint

---

## 1. Architectural Philosophy

DocMind AI implements a **Client-First, Privacy-Preserving Hybrid RAG Architecture**. 

Instead of routing massive PDF binaries to remote cloud storage and enterprise vector clusters, DocMind AI exploits modern client execution environments (WebAssembly / Web Workers) to extract, chunk, and index document vectors directly inside the user's browser. The server acts strictly as a secure, stateless proxy for embedding generation and streamed LLM inference, safeguarding API credentials without storing user data.

---

## 2. End-to-End System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CLIENT (BROWSER RUNTIME)                         │
│                                                                             │
│  ┌───────────────────────┐         ┌─────────────────────────────────────┐  │
│  │     PDF Ingestion     │         │          HTML5 PDF Viewer           │  │
│  │  - Drag & Drop Zone   │         │  - pdfjs-dist Canvas Renderer       │  │
│  │  - Native File Picker │         │  - Scale / Zoom / Page Jump Controls│  │
│  │  - Uint8Array In-Mem  │         │  - Active Page Evidence Ring Highlight│
│  └───────────┬───────────┘         └──────────────────▲──────────────────┘  │
│              │                                        │                      │
│              ▼                                        │ Page Navigation      │
│  ┌───────────────────────┐                            │ (activePage, toast)  │
│  │   pdf.worker.mjs      │                            │                      │
│  │  - getTextContent()   │                            │                      │
│  │  - Page-by-Page Split │                            │                      │
│  │  - Empty Page Filter  │                            │                      │
│  └───────────┬───────────┘                            │                      │
│              │ PdfPage[]                              │                      │
│              ▼                                        │                      │
│  ┌───────────────────────┐                            │                      │
│  │ Sentence Chunker      │                            │                      │
│  │  - 220 words / chunk  │                            │                      │
│  │  - 45 words overlap   │                            │                      │
│  │  - Strict Page Bounds │                            │                      │
│  └───────────┬───────────┘                            │                      │
│              │ Chunk[]                                │                      │
│              ▼                                        │                      │
│  ┌───────────────────────┐         ┌──────────────────┴──────────────────┐  │
│  │ In-Memory Vector Store│         │         Chat & Evidence UI          │  │
│  │  - IndexedChunk[]     │         │  - AST Markdown Parser              │  │
│  │  - Cosine Similarity  │◄────────┤  - Clickable Citations (p. X)       │  │
│  │  - Dual-Threshold TopK│         │  - SourceCards with Match Scores    │  │
│  │  - Transient in RAM   │         │  - 3 Grounded Related Questions     │  │
│  └───────────────────────┘         │  - GeneratingOrb Backdrop Blur      │  │
│                                    └──────────────────▲──────────────────┘  │
└───────────────────────────────────────────────────────┼──────────────────────┘
                          ▲                             │
             Chunk Batch  │                             │ Natural Language Query
             Texts        │                             │ + Top-5 Retrieved Chunks
                          ▼                             ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                  SERVER PROXY LAYER (TANSTACK START / NITRO)                 │
│                                                                              │
│    ┌──────────────────────────────┐       ┌──────────────────────────────┐   │
│    │     POST /api/embed          │       │      POST /api/ask           │   │
│    │  - Zod Input Validation      │       │  - Zod Request Validation    │   │
│    │  - Batching (max 100)        │       │  - Grounded System Prompt    │   │
│    │  - Injects OPENROUTER_API_KEY│       │  - Context Block Assembly    │   │
│    │  - Returns Ordered Vectors   │       │  - TransformStream SSE Pipe  │   │
│    └──────────────┬───────────────┘       └──────────────┬───────────────┘   │
└───────────────────┼──────────────────────────────────────┼───────────────────┘
                    │                                      │
                    ▼                                      ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                           EXTERNAL AI PROVIDER                               │
│                                                                              │
│       ┌──────────────────────────────────────────────────────────────┐       │
│       │                      OPENROUTER API                          │       │
│       │                                                              │       │
│       │  1. Embeddings Endpoint: /api/v1/embeddings                  │       │
│       │     Model: openai/text-embedding-3-small (1536-D)            │       │
│       │                                                              │       │
│       │  2. Chat Endpoint: /api/v1/chat/completions                  │       │
│       │     Model: openai/gpt-4o-mini                                │       │
│       │     SSE Token Streaming with Delimiter Output                │       │
│       └──────────────────────────────────────────────────────────────┘       │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Client vs. Server Responsibility Matrix

| Subsystem | Execution Realm | File Reference | Rationale |
| :--- | :--- | :--- | :--- |
| **PDF Binary Ingestion** | Client (Browser) | [`src/components/docmind/UploadZone.tsx`](file:///d:/Doc_Mind/screenshot-magic-0107/src/components/docmind/UploadZone.tsx) | Avoids sending large files over the wire; guarantees user document privacy. |
| **Text Extraction** | Client (Web Worker) | [`src/lib/pdf.ts`](file:///d:/Doc_Mind/screenshot-magic-0107/src/lib/pdf.ts) | Leverages client CPU; prevents server CPU saturation from rendering heavy PDFs. |
| **Text Chunking** | Client (Browser) | [`src/lib/chunk.ts`](file:///d:/Doc_Mind/screenshot-magic-0107/src/lib/chunk.ts) | Ensures deterministic sentence splitting with immutable page association in-memory. |
| **Vector Storage** | Client (RAM) | [`src/lib/vector-store.ts`](file:///d:/Doc_Mind/screenshot-magic-0107/src/lib/vector-store.ts) | Zero external database dependencies; instantaneous setup with zero persistence risk. |
| **Cosine Retrieval** | Client (Browser) | [`src/lib/vector-store.ts`](file:///d:/Doc_Mind/screenshot-magic-0107/src/lib/vector-store.ts) | Sub-millisecond vector math directly on client array; zero network latency. |
| **Embedding Generation** | Server (Proxy) | [`src/routes/api/embed.ts`](file:///d:/Doc_Mind/screenshot-magic-0107/src/routes/api/embed.ts) | Protects `OPENROUTER_API_KEY` from public exposure; batches calls to remote models. |
| **Prompt Synthesis & LLM**| Server (Proxy) | [`src/routes/api/ask.ts`](file:///d:/Doc_Mind/screenshot-magic-0107/src/routes/api/ask.ts) | Formulates strict system instructions and proxies SSE streaming chunks. |
| **Canvas PDF Rendering** | Client (Browser) | [`src/components/docmind/PdfViewer.tsx`](file:///d:/Doc_Mind/screenshot-magic-0107/src/components/docmind/PdfViewer.tsx) | Direct hardware-accelerated canvas rendering with responsive zooming and paging. |
| **Citation AST Parsing** | Client (Browser) | [`src/components/docmind/ChatMessage.tsx`](file:///d:/Doc_Mind/screenshot-magic-0107/src/components/docmind/ChatMessage.tsx) | Safe dynamic generation of interactive React buttons without `dangerouslySetInnerHTML`. |

---

## 4. In-Depth Component Workflows

### 4.1 Document Ingestion and Indexing Lifecycle

```
[User Drops File]
       │
       ▼
1. Validate File MIME (application/pdf)
       │
       ▼
2. Read ArrayBuffer (slice copy to prevent detachment)
       │
       ▼
3. Initialize PDF.js Document Proxy
       │
       ▼
4. Loop through Pages (1 to numPages):
   ├─ page.getTextContent()
   ├─ Concatenate item strings
   ├─ Replace whitespace & newlines
   └─ Push { page_number, text, empty }
       │
       ▼
5. chunkPages(pages, wordsPerChunk=220, overlap=45):
   ├─ Split by sentence punctuation: /(?<=[.!?])\s+|\n+/
   ├─ Accumulate sentences until wordCount > 220
   ├─ Retain 45-word tail as overlap
   └─ Flush at page boundary (STRICT PAGE ISOLATION)
       │
       ▼
6. embedTexts(chunks, batchSize=50):
   ├─ POST /api/embed { input: batch }
   ├─ Server forwards to OpenRouter (text-embedding-3-small)
   └─ Collect 1536-D embedding vectors
       │
       ▼
7. Construct IndexedChunk[]:
   [{ chunk_id, page_number, text, embedding }, ...]
       │
       ▼
[Update State: setDoc(doc), setIndex(chunks)] ──► UI Transitions to Active Workspace
```

### 4.2 Query, Retrieval, and Generation Lifecycle

```
[User Submits Question]
       │
       ▼
1. Embed Query:
   embedTexts([question]) ──► Returns queryEmbedding (1536-D)
       │
       ▼
2. In-Memory Search (searchIndex):
   For each c in index:
     score = dot(queryEmbedding, c.embedding) / (norm(q) * norm(c))
   Sort descending by score
   Slice topK = 5
   Filter: score >= 0.30 && score >= (best - 0.18)
       │
       ▼
3. Stream Request:
   POST /api/ask {
     question,
     documentName,
     context: retrievedChunks,
     history: recentTurns (max 12)
   }
       │
       ▼
4. Server Assembles Context Block:
   [page 3 | page3_chunk1]
   "Text of chunk..."
   System Prompt: Answer strictly from context, cite (p. X), append delimiter.
       │
       ▼
5. Stream Response from OpenRouter (gpt-4o-mini):
   Client streamAnswer receives SSE events:
   ├─ Buffers tokens in lookahead window
   ├─ Detects delimiter: ---RELATED_QUESTIONS---
   ├─ Emits clean answer tokens to ChatMessage
   └─ Extracts 3 follow-up questions
       │
       ▼
6. UI Updates:
   ├─ Chat bubble renders formatted Markdown + clickable (p. X) buttons
   ├─ Attached SourceCards display match confidence and excerpts
   └─ RelatedQuestions bar renders 3 clickable query suggestions
```

---

## 5. Mathematical Formulations

### 5.1 Vector Dot Product
For two $n$-dimensional vectors $u$ and $v$ ($n = 1536$):
$$\text{dot}(u, v) = \sum_{i=1}^{n} u_i v_i$$

### 5.2 Euclidean Vector Norm (L2 Norm)
$$\|u\| = \sqrt{\sum_{i=1}^{n} u_i^2}$$

### 5.3 Cosine Similarity
$$\text{cosineSimilarity}(u, v) = \frac{\text{dot}(u, v)}{\|u\| \|v\|}$$
Implemented in [`src/lib/vector-store.ts`](file:///d:/Doc_Mind/screenshot-magic-0107/src/lib/vector-store.ts):
```typescript
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
```

### 5.4 Dual-Threshold Candidate Pruning
Let $S = \{s_1, s_2, \dots, s_K\}$ be the top-$K$ cosine scores sorted in descending order, with $s_{\text{best}} = s_1$. A chunk $c_i$ is retained if and only if:
$$i = 1 \quad \lor \quad (s_i \ge 0.30 \;\land\; s_i \ge s_{\text{best}} - 0.18)$$

---

## 6. Security and Threat Model

1. **Credential Exposure Risk**: Zero. Client code contains no API keys. The browser only makes relative HTTP calls to `/api/embed` and `/api/ask`.
2. **Data Exfiltration Risk**: Zero document persistence. The PDF binary and extracted text remain exclusively in the client's volatile memory. When the tab closes, all document data is purged.
3. **Payload Tampering**: Mitigated by Zod schemas in `/api/embed` and `/api/ask` restricting array lengths, string sizes, and turn counts.
4. **Denial of Service (DoS)**: Rate-limiting upstream errors ($429$) and credit exhaustion ($402$) are gracefully mapped to user-friendly notifications in `sonner`.
5. **Cross-Site Scripting (XSS)**: Chat responses are rendered by translating Markdown blocks into typed React elements rather than injecting unescaped HTML.
