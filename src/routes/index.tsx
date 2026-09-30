import { createFileRoute } from "@tanstack/react-router";
import { motion, useScroll, useSpring } from "framer-motion";
import {
  Bot,
  BrainCircuit,
  Database,
  FileSearch,
  FileText,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { ChatWindow } from "@/components/docmind/ChatWindow";
import type { Message } from "@/components/docmind/ChatMessage";
import { PdfViewer } from "@/components/docmind/PdfViewer";
import { QuickActions } from "@/components/docmind/QuickActions";
import { UploadZone } from "@/components/docmind/UploadZone";
import { EvidenceShowcase } from "@/components/docmind/home/EvidenceShowcase";
import { FeatureGrid } from "@/components/docmind/home/FeatureGrid";
import { FinalCTA } from "@/components/docmind/home/FinalCTA";
import { HeroSection } from "@/components/docmind/home/HeroSection";
import { HomeFooter } from "@/components/docmind/home/HomeFooter";
import { HowItWorks } from "@/components/docmind/home/HowItWorks";
import { ValueStrip } from "@/components/docmind/home/ValueStrip";
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
  const [activePage, setActivePage] = useState<number>(1);
  const [highlightedEvidencePage, setHighlightedEvidencePage] = useState<number | null>(null);
  const [activeMobileTab, setActiveMobileTab] = useState<"viewer" | "chat">("chat");
  const [activeActionId, setActiveActionId] = useState<string | null>(null);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const idRef = useRef(0);
  const nextId = () => `m${++idRef.current}`;

  const reset = () => {
    setDoc(null);
    setIndex([]);
    setMessages([]);
    setDraft("");
    setProgress(0);
    setActivePage(1);
    setHighlightedEvidencePage(null);
    setActiveMobileTab("chat");
    setActiveActionId(null);
  };

  const handleQuickAction = (actionId: string, prompt: string) => {
    if (asking) return;
    setActiveActionId(actionId);
    ask(prompt);
  };

  const handleOpenPage = (pageNumber: number) => {
    if (!doc) return;
    const parsed =
      typeof pageNumber === "number" ? Math.floor(pageNumber) : parseInt(String(pageNumber), 10);
    if (isNaN(parsed) || parsed < 1) return;
    const safePage = Math.min(parsed, doc.pageCount || 1);
    setActivePage(safePage);
    setHighlightedEvidencePage(safePage);
    setActiveMobileTab("viewer");
    toast.info(`Navigated to Page ${safePage} in viewer`, { duration: 2000 });
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
        toast.error("No readable text found. This PDF looks scanned — try a text-based PDF.");
        setIndexing(false);
        return;
      }

      setStage(`Embedding ${chunks.length} chunks…`);
      const vectors = await embedTexts(
        chunks.map((c) => c.text),
        (done, total) => setProgress(45 + (done / total) * 50),
      );

      setStage("Building the vector index…");
      setIndex(chunks.map((chunk, i) => ({ ...chunk, embedding: vectors[i] ?? [] })));
      setDoc(extracted);
      setActivePage(1);
      setProgress(100);
      setMessages([
        {
          id: nextId(),
          role: "assistant",
          content: `"${extracted.fileName}" is indexed: ${extracted.pageCount} pages, ${chunks.length} searchable chunks. Ask me anything — I'll answer only from this document and show the pages I used.`,
        },
      ]);
      toast.success("Document indexed successfully!");
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
    setActiveMobileTab("chat");

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
      if (!queryVector) throw new Error("Could not understand that question.");
      const sources = searchIndex(index, queryVector, TOP_K);

      let streamed = "";
      const result = await streamAnswer({
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
                content:
                  result.content ||
                  streamed ||
                  "I couldn't find this information in the uploaded document.",
                sources,
                suggestions: result.suggestions,
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
      setActiveActionId(null);
    }
  };

  const emptyPages = doc ? doc.pages.filter((p) => p.empty).length : 0;

  return (
    <div
      className={`flex flex-col bg-background ${doc ? "h-screen overflow-hidden" : "min-h-screen"}`}
    >
      {/* Subtle Berry Wine Scroll Progress Indicator */}
      {!doc && (
        <motion.div
          style={{ scaleX }}
          className="fixed top-0 left-0 right-0 h-[2.5px] bg-primary z-50 origin-left pointer-events-none"
          aria-hidden="true"
        />
      )}

      {/* Top Header */}
      <header className="border-b border-border bg-surface sticky top-0 z-30 shrink-0 shadow-2xs">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:py-3">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-primary p-1.5 sm:p-2 text-primary-foreground shadow-xs shrink-0">
              <BrainCircuit className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-display text-base sm:text-lg font-bold leading-tight tracking-tight text-foreground">
                  DocMind AI
                </h1>
                <span className="hidden sm:inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary font-mono">
                  RAG Studio
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
                Grounded Document Intelligence with Page Evidence
              </p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-4 text-xs text-muted-foreground">
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

          <div className="flex items-center gap-2 shrink-0">
            {doc && (
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-foreground transition-all hover:bg-secondary hover:border-primary/40 shadow-2xs cursor-pointer"
                title="Upload a different document"
              >
                <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="hidden sm:inline">New Document</span>
                <span className="sm:hidden">New</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main
        className={`flex-1 w-full flex flex-col ${doc ? "max-w-7xl mx-auto min-h-0 overflow-hidden" : ""}`}
      >
        {!doc ? (
          /* Redesigned Premium Landing Page */
          <div className="w-full flex flex-col">
            <HeroSection onFile={handleFile} busy={indexing} stage={stage} progress={progress} />
            <ValueStrip />
            <HowItWorks />
            <FeatureGrid />
            <EvidenceShowcase />
            <FinalCTA onFile={handleFile} busy={indexing} />
            <HomeFooter />
          </div>
        ) : (
          /* Active Document Workspace (Split View) */
          <div className="flex flex-col flex-1 min-h-0 px-3 sm:px-4 py-2.5 overflow-hidden">
            {/* Document Information / Status Bar */}
            <div className="mb-2 flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3.5 py-1.5 text-xs shrink-0 shadow-2xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex items-center gap-2 font-medium text-foreground min-w-0">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <FileText className="h-3.5 w-3.5" />
                  </div>
                  <span
                    className="truncate max-w-[160px] sm:max-w-[260px] md:max-w-[400px] font-semibold text-foreground"
                    title={doc.fileName}
                  >
                    {doc.fileName}
                  </span>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-muted-foreground border-l border-border pl-3 font-mono text-[11px]">
                  <span>{doc.pageCount} Pages</span>
                  <span className="text-border">•</span>
                  <span>{index.length} Chunks</span>
                  {emptyPages > 0 && (
                    <>
                      <span className="text-border">•</span>
                      <span className="text-warning font-medium">{emptyPages} Empty</span>
                    </>
                  )}
                  <span className="text-border">•</span>
                  <span className="inline-flex items-center gap-1.5 font-semibold text-evidence">
                    <span className="h-1.5 w-1.5 rounded-full bg-evidence" />
                    Indexed
                  </span>
                </div>
              </div>

              {/* Mobile Tab Toggle */}
              <div className="flex items-center gap-1 lg:hidden">
                <button
                  type="button"
                  onClick={() => setActiveMobileTab("viewer")}
                  className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    activeMobileTab === "viewer"
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "bg-secondary text-foreground hover:bg-secondary/80"
                  }`}
                >
                  <FileText className="h-3 w-3" />
                  <span>PDF (p. {activePage})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMobileTab("chat")}
                  className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    activeMobileTab === "chat"
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "bg-secondary text-foreground hover:bg-secondary/80"
                  }`}
                >
                  <Bot className="h-3 w-3" />
                  <span>AI Chat</span>
                </button>
              </div>
            </div>

            {/* AI Quick Actions Command Bar */}
            <QuickActions
              onPick={handleQuickAction}
              disabled={asking}
              activeActionId={activeActionId}
            />

            {/* Split Screen Workspace */}
            <div className="grid flex-1 min-h-0 gap-3.5 lg:grid-cols-2 overflow-hidden">
              {/* Left Column: Embedded PDF Viewer */}
              <div
                className={`h-full min-h-0 ${
                  activeMobileTab === "viewer" ? "block" : "hidden lg:block"
                }`}
              >
                <PdfViewer
                  pdfData={doc.rawData ?? null}
                  fileName={doc.fileName}
                  currentPage={activePage}
                  pageCount={doc.pageCount}
                  onPageChange={(p) => {
                    const safe = Math.max(1, Math.min(p, doc.pageCount || 1));
                    setActivePage(safe);
                    if (highlightedEvidencePage && highlightedEvidencePage !== safe) {
                      setHighlightedEvidencePage(null);
                    }
                  }}
                  highlightPage={highlightedEvidencePage}
                />
              </div>

              {/* Right Column: AI Chat Panel */}
              <div
                className={`h-full min-h-0 ${
                  activeMobileTab === "chat" ? "block" : "hidden lg:block"
                }`}
              >
                <ChatWindow
                  messages={messages}
                  onAsk={ask}
                  busy={asking}
                  draft={draft}
                  onDraftChange={setDraft}
                  onOpenPage={handleOpenPage}
                  activePage={activePage}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
