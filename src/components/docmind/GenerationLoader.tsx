import { Loading } from "loading-dev";
import React from "react";

export function GenerationLoader() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="DocMind AI is analyzing document evidence"
      className="flex flex-col items-center justify-center p-6 text-center select-none"
    >
      <div className="flex items-center justify-center text-primary">
        <Loading size={96} color="#731235" />
      </div>

      <div className="mt-5 text-sm font-semibold text-foreground tracking-tight">
        Analyzing document evidence...
      </div>

      <div className="mt-1.5 text-xs text-muted-foreground max-w-xs leading-relaxed">
        Retrieving relevant context and generating a grounded answer
      </div>
    </div>
  );
}
