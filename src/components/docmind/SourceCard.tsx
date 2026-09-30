import { Check, ExternalLink, FileText } from "lucide-react";
import React from "react";

import type { Retrieved } from "@/lib/vector-store";

export function SourceCard({
  source,
  onOpenPage,
  isActivePage,
}: {
  source: Retrieved;
  onOpenPage?: ((page: number) => void) | undefined;
  isActivePage?: boolean | undefined;
}) {
  const matchPercent = Math.min(100, Math.round(source.score * 100));

  const triggerNavigation = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onOpenPage && source.page_number != null) {
      const page =
        typeof source.page_number === "number"
          ? Math.floor(source.page_number)
          : parseInt(String(source.page_number), 10);
      if (!isNaN(page) && page >= 1) {
        onOpenPage(page);
      }
    }
  };

  return (
    <div
      onClick={triggerNavigation}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          triggerNavigation(e as unknown as React.MouseEvent);
        }
      }}
      className={`group relative flex flex-col justify-between rounded-xl border p-3 transition-all duration-150 cursor-pointer shadow-2xs ${
        isActivePage
          ? "border-evidence bg-[#F4F6ED] ring-1 ring-evidence/60 shadow-xs"
          : "border-[#A1AA68]/40 bg-[#FAFBF7] hover:border-evidence hover:bg-[#F4F6ED] hover:shadow-xs"
      }`}
    >
      <div>
        {/* Header: ✓ DOCUMENT EVIDENCE & Match Score */}
        <div className="flex items-center justify-between gap-2 border-b border-[#A1AA68]/20 pb-1.5 mb-2">
          <span className="flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[#4E5629]">
            <Check className="h-3 w-3 text-evidence stroke-[3]" />
            <span>Document Evidence</span>
          </span>
          <span className="font-mono text-[10px] font-semibold text-muted-foreground">
            {matchPercent}%
          </span>
        </div>

        {/* Page Badge & Chunk ID */}
        <div className="flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold transition-colors ${
              isActivePage
                ? "bg-evidence text-white"
                : "bg-evidence/15 text-[#3D4620]"
            }`}
          >
            <FileText className="h-3 w-3" />
            Page {source.page_number}
          </span>
          <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/70">
            {source.chunk_id}
          </span>
        </div>

        {/* Relevant document excerpt */}
        <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-[#242124]/90 group-hover:text-[#242124] transition-colors">
          "{source.text}"
        </p>
      </div>

      {/* Footer: [ View Page ↗ ] Button */}
      <div className="mt-2.5 flex items-center justify-end border-t border-[#A1AA68]/20 pt-2 text-[10px]">
        <button
          type="button"
          onClick={triggerNavigation}
          className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all shadow-2xs cursor-pointer ${
            isActivePage
              ? "bg-evidence text-white shadow-xs"
              : "bg-white border border-border text-[#242124] hover:bg-primary hover:text-white hover:border-primary"
          }`}
          title={`View Page ${source.page_number} in document viewer`}
        >
          <span>View Page</span>
          <ExternalLink className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
