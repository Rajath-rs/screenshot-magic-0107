import { FileUp, Loader2, UploadCloud } from "lucide-react";
import React, { useRef, useState } from "react";

import { Progress } from "@/components/ui/progress";

type Props = {
  onFile: (file: File) => void;
  busy: boolean;
  stage: string;
  progress: number;
  className?: string | undefined;
};

export function UploadZone({ onFile, busy, stage, progress, className = "" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const pick = (files: FileList | null) => {
    const file = files?.[0];
    if (file) onFile(file);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      inputRef.current?.click();
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (!busy) pick(e.dataTransfer.files);
      }}
      className={`relative flex flex-col items-center justify-center text-center transition-all duration-200 rounded-2xl border-2 border-dashed bg-white p-6 sm:p-8 shadow-card ${
        dragging
          ? "border-primary bg-[#F3E9ED]/40 ring-4 ring-primary/10 scale-[1.01]"
          : "border-border hover:border-primary/50 hover:bg-[#FAF9F7]"
      } ${className}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => pick(e.target.files)}
        aria-label="Upload PDF file"
      />

      {busy ? (
        /* Active Indexing Loading State */
        <div className="w-full max-w-sm py-4 space-y-4 animate-in fade-in-50 duration-200">
          <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
          <div>
            <h3 className="font-display text-sm sm:text-base font-bold text-foreground">
              Indexing Document…
            </h3>
            <p className="mt-1 text-xs text-muted-foreground font-medium">{stage}</p>
          </div>
          <div className="space-y-1.5 pt-1">
            <Progress value={progress} className="h-2 rounded-full" />
            <div className="flex justify-between items-center text-[11px] font-mono text-muted-foreground">
              <span>Client-side RAG pipeline</span>
              <span className="font-semibold text-primary">{Math.round(progress)}%</span>
            </div>
          </div>
        </div>
      ) : (
        /* Default Dropzone State */
        <div className="flex flex-col items-center gap-3.5 w-full">
          {/* Upload Icon */}
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-200 shadow-xs ${
              dragging
                ? "bg-primary text-white scale-110"
                : "bg-primary/10 text-primary group-hover:scale-105"
            }`}
          >
            <UploadCloud className="h-6 w-6 stroke-[2.2]" />
          </div>

          {/* Copy */}
          <div>
            <h3 className="font-display text-base sm:text-lg font-bold text-foreground">
              {dragging ? "Drop your PDF to start" : "Drop your PDF here"}
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-xs mx-auto">
              or choose a document from your computer
            </p>
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onKeyDown={handleKeyDown}
            className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary-hover px-6 py-2.5 text-xs sm:text-sm font-semibold text-white transition-all shadow-xs active:scale-98 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
          >
            <FileUp className="h-4 w-4" />
            <span>Choose PDF</span>
          </button>

          {/* Trust Meta Tag */}
          <p className="text-[11px] text-muted-foreground/80 font-mono pt-1">
            PDF · Secure · In-browser indexing
          </p>
        </div>
      )}
    </div>
  );
}
