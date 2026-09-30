import { FileText, Layers, RotateCcw, ScanLine } from "lucide-react";

type Props = {
  fileName: string;
  pageCount: number;
  chunkCount: number;
  emptyPages: number;
  onReset: () => void;
};

export function DocumentInfo({
  fileName,
  pageCount,
  chunkCount,
  emptyPages,
  onReset,
}: Props) {
  const stats = [
    { icon: FileText, label: "Pages", value: pageCount },
    { icon: Layers, label: "Chunks indexed", value: chunkCount },
    { icon: ScanLine, label: "Pages without text", value: emptyPages },
  ];

  return (
    <div className="surface-panel p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Active document
          </p>
          <p className="truncate font-display text-sm text-foreground" title={fileName}>
            {fileName}
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <RotateCcw className="h-3 w-3" />
          New
        </button>
      </div>

      <dl className="mt-4 space-y-2">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center justify-between text-sm">
            <dt className="flex items-center gap-2 text-muted-foreground">
              <stat.icon className="h-3.5 w-3.5" />
              {stat.label}
            </dt>
            <dd className="font-mono text-foreground">{stat.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
