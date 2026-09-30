import { FileUp, Loader2 } from "lucide-react";
import { useRef, useState } from "react";

import { Progress } from "@/components/ui/progress";

type Props = {
  onFile: (file: File) => void;
  busy: boolean;
  stage: string;
  progress: number;
};

export function UploadZone({ onFile, busy, stage, progress }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const pick = (files: FileList | null) => {
    const file = files?.[0];
    if (file) onFile(file);
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
      className={`surface-panel flex flex-col items-center justify-center gap-4 px-6 py-12 text-center transition-all duration-200 ${
        dragging ? "border-primary/60 shadow-[var(--shadow-glow)]" : ""
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => pick(e.target.files)}
      />

      {busy ? (
        <div className="w-full max-w-sm space-y-3">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-primary" />
          <p className="font-display text-sm text-foreground">{stage}</p>
          <Progress value={progress} className="h-1.5" />
          <p className="text-xs text-muted-foreground">{Math.round(progress)}%</p>
        </div>
      ) : (
        <>
          <div className="rounded-2xl bg-gradient-brand p-3 text-primary-foreground">
            <FileUp className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-display text-lg">Drop a PDF to index it</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Text is extracted page by page, chunked, embedded and searched locally.
            </p>
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-lg bg-gradient-brand px-5 py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02]"
          >
            Choose PDF
          </button>
        </>
      )}
    </div>
  );
}
