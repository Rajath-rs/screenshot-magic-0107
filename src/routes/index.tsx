import { createFileRoute } from "@tanstack/react-router";
import { BrainCircuit, Database, FileSearch, Sparkles } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { ChatWindow } from "@/components/docmind/ChatWindow";
import type { Message } from "@/components/docmind/ChatMessage";
import { DocumentInfo } from "@/components/docmind/DocumentInfo";
import { QuickActions } from "@/components/docmind/QuickActions";
import { UploadZone } from "@/components/docmind/UploadZone";
import { chunkPages } from "@/lib/chunk";
import { extractPdfPages, type PdfDocumentText } from "@/lib/pdf";
import { embedTexts, streamAnswer, type ChatTurn } from "@/lib/rag-client";
import { searchIndex, type IndexedChunk } from "@/lib/vector-store";

const TITLE = "DocMind AI — Ask your PDFs, get answers with page evidence";
const DESCRIPTION =
  "Upload a PDF and ask questions in natural language. DocMind AI retrieves the most relevant passages and answers only from your document, citing exact page numbers.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DocMind,
});

const TOP_K = 5;

function DocMind() {
  const [doc, setDoc] = useState<PdfDocumentText | null>(null);
  const [index, setIndex] = useState<IndexedChunk[]>([]);
  const [indexing, setIndexing] = useState(false);
  const [stage, setStage] = useState("");
  const [progress, setProgress] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [asking, setAsking] = useState(false);
  const idRef = useRef(0);

  const nextId = () => `m${++idRef.current}`;

  const reset = () => {
    setDoc(null);
    setIndex([]);
    setMessages([]);
    setDraft("");
    setProgress(0);
  };

  const handleFile = async (file: File) => {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please upload a PDF file.");
      return;
    }
    setIndexing(true);
    setProgress(0);
    setMessages([]);
    try {
      setStage("Extracting text page by page…");
      const extracted = await extractPdfPages(file, (done, total) =>
        setProgress((done / total) * 40),
      );

      setStage("Splitting into overlapping chunks…");
      const chunks = chunkPages(extracted.pages);
      setProgress(45);

      if (!chunks.length) {
        toast.error(
          "No readable text found. This PDF looks scanned — try a text-based PDF.",
        );
        setIndexing(false);
        return;
      }

      setStage(`Embedding ${chunks.length} chunks…`);
      const vectors = await embedTexts(
        chunks.map((c) => c.text),
        (done, total) => setProgress(45 + (done / total) * 50),
      );

      setStage("Building the vector index…");
      setIndex(chunks.map((chunk, i) => ({ ...chunk, embedding: vectors[i] })));
      setDoc(extracted);
      setProgress(100);
      setMessages([
        {
          id: nextId(),
          role: "assistant",
          content: `"${extracted.fileName}" is indexed: ${extracted.pageCount} pages, ${chunks.length} searchable chunks. Ask me anything — I'll answer only from this document and show the pages I used.`,
        },
      ]);
      toast.success("Document indexed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to process the PDF.");
    } finally {
      setIndexing(false);
    }
  };

  const ask = async (question: string) => {
    if (!doc || asking) return;
    setDraft("");
    setAsking(true);

    const history: ChatTurn[] = messages
      .filter((m) => !m.error)
      .slice(-6)
      .map((m) => ({ role: m.role, content: m.content }));

    const userMessage: Message = { id: nextId(), role: "user", content: question };
    const answerId = nextId();
    setMessages((prev) => [
      ...prev,
      userMessage,
      { id: answerId, role: "assistant", content: "", pending: true },
    ]);

    try {
      const [queryVector] = await embedTexts([question]);
      const sources = searchIndex(index, queryVector, TOP_K);

      let streamed = "";
      await streamAnswer({
        question,
        documentName: doc.fileName,
        context: sources,
        history,
        onDelta: (delta) => {
          streamed += delta;
          setMessages((prev) =>
            prev.map((m) => (m.id === answerId ? { ...m, content: streamed } : m)),
          );
        },
      });

      setMessages((prev) =>
        prev.map((m) =>
          m.id === answerId
            ? {
                ...m,
                pending: false,
                content: streamed || "I could not generate an answer. Please try again.",
                sources,
              }
            : m,
        ),
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong answering that.";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === answerId ? { ...m, pending: false, content: message, error: true } : m,
        ),
      );
    } finally {
      setAsking(false);
    }
  };

  const emptyPages = doc ? doc.pages.filter((p) => p.empty).length : 0;

  return (
    <div className="min-h-screen">
      <header className="border-b border-border/70">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-5 py-4">
          <div className="rounded-xl bg-gradient-brand p-2 text-primary-foreground">
            <BrainCircuit className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-lg leading-tight">DocMind AI</h1>
            <p className="text-xs text-muted-foreground">
              Retrieval-augmented answers, grounded in your PDF
            </p>
          </div>
          <div className="ml-auto hidden items-center gap-4 text-xs text-muted-foreground md:flex">
            <span className="inline-flex items-center gap-1.5">
              <FileSearch className="h-3.5 w-3.5 text-primary" /> Page-aware extraction
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-primary" /> Local vector search
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> No hallucinations
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-6">
        {!doc ? (
          <div className="mx-auto max-w-2xl space-y-8 py-10">
            <div className="text-center">
              <h2 className="font-display text-3xl">
                Ask your documents{" "}
                <span className="text-gradient-brand">real questions</span>
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground">
                DocMind AI reads your PDF page by page, indexes it, and answers only from
                what the document actually says — with the pages used as evidence.
              </p>
            </div>
            <UploadZone
              onFile={handleFile}
              busy={indexing}
              stage={stage}
              progress={progress}
            />
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { title: "1. Extract", body: "Text pulled per page with PyMuPDF-style page tracking." },
                { title: "2. Index", body: "Overlapping chunks embedded into a local vector store." },
                { title: "3. Answer", body: "Top matches feed the LLM, which cites its pages." },
              ].map((step) => (
                <div key={step.title} className="surface-panel p-4">
                  <p className="font-display text-sm text-primary">{step.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {step.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
            <aside className="space-y-4">
              <DocumentInfo
                fileName={doc.fileName}
                pageCount={doc.pageCount}
                chunkCount={index.length}
                emptyPages={emptyPages}
                onReset={reset}
              />
              <QuickActions onPick={ask} disabled={asking} />
            </aside>
            <section className="h-[calc(100vh-11rem)] min-h-[520px]">
              <ChatWindow
                messages={messages}
                onAsk={ask}
                busy={asking}
                draft={draft}
                onDraftChange={setDraft}
              />
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
