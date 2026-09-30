import { Quote } from "lucide-react";

import type { Retrieved } from "@/lib/vector-store";

export function SourceCard({ source }: { source: Retrieved }) {
  return (
    <div className="rounded-lg border border-border bg-surface-raised/60 p-3 transition-colors hover:border-evidence/50">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-evidence/15 px-2 py-0.5 text-xs font-medium text-evidence">
          <Quote className="h-3 w-3" />
          Page {source.page_number}
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">
          {(source.score * 100).toFixed(0)}% match
        </span>
      </div>
      <p className="mt-2 line-clamp-4 text-xs leading-relaxed text-muted-foreground">
        {source.text}
      </p>
    </div>
  );
}
