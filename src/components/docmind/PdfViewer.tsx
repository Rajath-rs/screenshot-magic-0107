import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  Maximize2,
  Quote,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface PdfRenderTask {
  cancel: () => void;
  promise: Promise<void>;
}

interface PdfPageProxy {
  getViewport: (options: { scale: number }) => { width: number; height: number };
  render: (params: {
    canvasContext: CanvasRenderingContext2D;
    viewport: { width: number; height: number };
    transform?: number[] | null;
  }) => PdfRenderTask;
}

interface PdfDocProxy {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfPageProxy>;
}

type Props = {
  pdfData: Uint8Array | null;
  fileName: string;
  currentPage: number;
  onPageChange: (page: number) => void;
  pageCount?: number | undefined;
  highlightPage?: number | null | undefined;
};

export function PdfViewer({
  pdfData,
  fileName,
  currentPage,
  onPageChange,
  pageCount: propPageCount,
  highlightPage,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const renderTaskRef = useRef<PdfRenderTask | null>(null);

  const [pdfDoc, setPdfDoc] = useState<PdfDocProxy | null>(null);
  const [internalPageCount, setInternalPageCount] = useState<number>(propPageCount || 0);
  const [scale, setScale] = useState<number>(1.1);
  const [loading, setLoading] = useState<boolean>(true);
  const [rendering, setRendering] = useState<boolean>(false);
  const [pageInput, setPageInput] = useState<string>(String(currentPage));

  const totalPages = propPageCount || internalPageCount || pdfDoc?.numPages || 1;

  // Sync page input whenever currentPage changes externally
  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  // Sync internalPageCount if propPageCount updates
  useEffect(() => {
    if (propPageCount && propPageCount > 0) {
      setInternalPageCount(propPageCount);
    }
  }, [propPageCount]);

  // Load PDF Document when pdfData changes
  useEffect(() => {
    let active = true;
    if (!pdfData || pdfData.byteLength === 0) {
      setPdfDoc(null);
      setInternalPageCount(0);
      setLoading(false);
      return;
    }

    // Always slice a copy so PDF.js worker transfer never detaches the original buffer
    const dataToLoad = new Uint8Array(pdfData.slice(0));
    setLoading(true);

    async function loadDoc() {
      try {
        const pdfjs = await import("pdfjs-dist");
        const workerUrl = (await import("pdfjs-dist/build/pdf.worker.mjs?url")).default;
        pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

        const doc = (await pdfjs.getDocument({
          data: dataToLoad,
          verbosity: 0,
        }).promise) as unknown as PdfDocProxy;

        if (active) {
          setPdfDoc(doc);
          setInternalPageCount(doc.numPages);
          setLoading(false);
          if (containerRef.current) {
            try {
              const firstPage = await doc.getPage(1);
              const unscaled = firstPage.getViewport({ scale: 1.0 });
              const containerWidth = containerRef.current.clientWidth - 40;
              if (containerWidth > 200 && unscaled.width > 0) {
                const autoScale = Math.max(0.7, Math.min(containerWidth / unscaled.width, 1.4));
                setScale(Number(autoScale.toFixed(2)));
              }
            } catch {
              setScale(1.15);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load PDF in viewer:", err);
        if (active) {
          setLoading(false);
        }
      }
    }

    loadDoc();

    return () => {
      active = false;
    };
  }, [pdfData]);

  // Render current page onto canvas
  useEffect(() => {
    let cancelled = false;

    // Safety checks
    if (!pdfDoc || !canvasRef.current || currentPage < 1 || currentPage > totalPages) {
      return;
    }

    async function renderPage() {
      try {
        setRendering(true);

        // Cancel and await any active render task before rendering new page
        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
            await renderTaskRef.current.promise.catch(() => {});
          } catch {
            // ignore cancellation
          }
        }

        if (cancelled) return;

        if (!pdfDoc) return;
        const page = await pdfDoc.getPage(currentPage);
        if (cancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const viewport = page.getViewport({ scale });
        const dpr = window.devicePixelRatio || 1;

        // Retina display high-DPI scaling
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const renderContext = {
          canvasContext: ctx,
          viewport,
          transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null,
        };

        const task = page.render(renderContext);
        renderTaskRef.current = task;

        await task.promise;
        if (!cancelled) {
          renderTaskRef.current = null;
          setRendering(false);
          // Scroll canvas viewport to top smoothly on page transition
          if (containerRef.current) {
            containerRef.current.scrollTo({ top: 0, behavior: "smooth" });
          }
        }
      } catch (err: unknown) {
        const isCancelled =
          err != null &&
          typeof err === "object" &&
          "name" in err &&
          err.name === "RenderingCancelledException";
        if (!isCancelled) {
          console.error("PDF page render error:", err);
        }
        if (!cancelled) {
          setRendering(false);
        }
      }
    }

    renderPage();

    return () => {
      cancelled = true;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // ignore
        }
      }
    };
  }, [pdfDoc, currentPage, scale, totalPages]);

  // Scroll to top when evidence highlight activates for the current page
  useEffect(() => {
    if (highlightPage != null && highlightPage === currentPage) {
      containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [highlightPage, currentPage]);

  const handlePrev = () => {
    if (currentPage > 1) {
      onPageChange(Math.max(1, currentPage - 1));
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(Math.min(totalPages, currentPage + 1));
    }
  };

  const handlePageInputSubmit = () => {
    const pageNum = parseInt(pageInput, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      onPageChange(pageNum);
    } else {
      setPageInput(String(currentPage));
    }
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.15, 2.5));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.15, 0.6));
  };

  const handleResetZoom = () => {
    setScale(1.0);
  };

  const handleFitWidth = async () => {
    if (!pdfDoc || !containerRef.current) return;
    try {
      const page = await pdfDoc.getPage(currentPage);
      const unscaledViewport = page.getViewport({ scale: 1.0 });
      const availableWidth = containerRef.current.clientWidth - 40;
      if (availableWidth > 150 && unscaledViewport.width > 0) {
        const fitScale = Math.max(0.6, Math.min(availableWidth / unscaledViewport.width, 2.2));
        setScale(Number(fitScale.toFixed(2)));
      }
    } catch {
      setScale(1.15);
    }
  };

  const isEvidencePage = highlightPage != null && highlightPage === currentPage;

  return (
    <div className="surface-panel flex h-full min-h-0 flex-col overflow-hidden bg-white">
      {/* Viewer Header Toolbar */}
      <div className="flex items-center justify-between gap-3 border-b border-border bg-white px-3.5 py-2 text-xs shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileText className="h-4 w-4" />
          </div>
          <span
            className="truncate font-display text-xs font-semibold text-foreground max-w-[140px] sm:max-w-[220px]"
            title={fileName}
          >
            {fileName}
          </span>
          {isEvidencePage && (
            <span className="inline-flex items-center gap-1 rounded-md bg-[#F4F6ED] border border-[#A1AA68]/50 px-2 py-0.5 text-[11px] font-semibold text-[#3D4620] shrink-0 shadow-2xs">
              <Quote className="h-3 w-3 text-evidence" />
              Evidence Page {currentPage}
            </span>
          )}
        </div>

        {/* Zoom & View Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <div className="flex items-center rounded-lg border border-border bg-white p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={scale <= 0.6 || loading}
              className="flex h-6 w-6 items-center justify-center rounded text-foreground transition-colors hover:bg-secondary hover:text-primary disabled:opacity-30 cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="flex h-6 px-1.5 items-center justify-center font-mono text-[11px] font-medium text-foreground transition-colors hover:bg-secondary hover:text-primary cursor-pointer"
              title="Actual Size (100%)"
            >
              {Math.round(scale * 100)}%
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={scale >= 2.5 || loading}
              className="flex h-6 w-6 items-center justify-center rounded text-foreground transition-colors hover:bg-secondary hover:text-primary disabled:opacity-30 cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleFitWidth}
            disabled={loading}
            className="hidden sm:inline-flex items-center gap-1 rounded-lg border border-border bg-white px-2 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-secondary hover:text-primary cursor-pointer shadow-2xs"
            title="Fit to Width"
          >
            <Maximize2 className="h-3 w-3" />
            <span>Fit</span>
          </button>
        </div>
      </div>

      {/* Canvas Viewport: Neutral #EDEAE5 background */}
      <div
        ref={containerRef}
        className="scrollbar-slim relative flex flex-1 items-start justify-center overflow-auto bg-[#EDEAE5] p-3 sm:p-5"
      >
        {loading ? (
          <div className="flex h-full flex-col items-center justify-center gap-2.5 text-muted-foreground">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
            <p className="text-xs font-medium">Loading document view…</p>
          </div>
        ) : (
          <div className="relative flex flex-col items-center">
            <div
              className={`relative rounded-sm bg-white shadow-xl transition-all ${
                isEvidencePage
                  ? "ring-2 ring-evidence ring-offset-2 ring-offset-[#EDEAE5] shadow-[0_4px_24px_rgba(161,170,104,0.35)]"
                  : "border border-border/80"
              }`}
            >
              <canvas ref={canvasRef} className="block rounded-xs" />
              {rendering && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xs bg-[#EDEAE5]/40 backdrop-blur-[1px]">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation Bar */}
      <div className="flex items-center justify-between border-t border-border bg-white px-3.5 py-2 text-xs shrink-0">
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentPage <= 1 || loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:bg-secondary hover:border-primary/40 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Previous</span>
        </button>

        {/* Centered Page Indicator & Direct Input */}
        <div className="flex items-center gap-1.5 font-medium">
          <span className="text-muted-foreground text-xs">Page</span>
          <input
            type="text"
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handlePageInputSubmit();
              }
            }}
            onBlur={handlePageInputSubmit}
            disabled={loading}
            className="h-7 w-12 rounded-md border border-border bg-white text-center font-mono text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all shadow-inner"
            title="Type page number and press Enter"
          />
          <span className="text-muted-foreground text-xs">of {totalPages}</span>
        </div>

        <button
          type="button"
          onClick={handleNext}
          disabled={currentPage >= totalPages || loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:bg-secondary hover:border-primary/40 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
        >
          <span>Next</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
