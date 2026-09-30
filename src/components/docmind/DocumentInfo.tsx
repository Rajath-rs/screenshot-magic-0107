import { CheckCircle2, FileText, RotateCcw } from "lucide-react";

type Props = {
  fileName: string;
  pageCount: number;
  chunkCount: number;
  emptyPages: number;
  onReset: () => void;
  activePage?: number;
};

export function DocumentInfo({
  fileName,
  pageCount,
  chunkCount,
  emptyPages,
  onReset,
  activePage,
}: Props) {
  return (
    <div className="surface-panel p-4 bg-white border border-border rounded-xl shadow-soft">
      {/* Title & Status */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F4F6ED] border border-[#A1AA68]/45 px-2.5 py-0.5 text-[11px] font-semibold text-[#4E5629]">
              <span className="h-1.5 w-1.5 rounded-full bg-evidence" />
              Indexed
            </span>
            {activePage && (
              <span className="font-mono text-[11px] text-muted-foreground">
                Page {activePage} / {pageCount}
              </span>
            )}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <FileText className="h-4 w-4 shrink-0 text-primary" />
            <p
              className="truncate font-display text-sm font-semibold text-foreground"
              title={fileName}
            >
              {fileName}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs text-foreground transition-all hover:bg-secondary hover:text-primary hover:border-primary/40 cursor-pointer shadow-2xs"
          title="Upload a different document"
        >
          <RotateCcw className="h-3 w-3" />
          <span>New</span>
        </button>
      </div>

      {/* Metrics Grid */}
      <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3">
        <div className="rounded-lg bg-[#FAF9F7] border border-border/60 p-2 text-center">
          <dt className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Pages</dt>
          <dd className="mt-0.5 font-mono text-sm font-bold text-foreground">{pageCount}</dd>
        </div>
        <div className="rounded-lg bg-[#FAF9F7] border border-border/60 p-2 text-center">
          <dt className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Chunks</dt>
          <dd className="mt-0.5 font-mono text-sm font-bold text-primary">{chunkCount}</dd>
        </div>
        <div className="rounded-lg bg-[#FAF9F7] border border-border/60 p-2 text-center">
          <dt className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">No Text</dt>
          <dd
            className={`mt-0.5 font-mono text-sm font-bold ${
              emptyPages > 0 ? "text-warning" : "text-muted-foreground"
            }`}
          >
            {emptyPages}
          </dd>
        </div>
      </dl>

      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <CheckCircle2 className="h-3 w-3 text-evidence" />
        <span>Searchable in-memory vector index ready</span>
      </div>
    </div>
  );
}
