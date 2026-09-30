import { Sparkles } from "lucide-react";

const PRESETS = [
  "Summarize this document in 5 bullet points",
  "What is the main objective?",
  "What methodology was used?",
  "List the key findings and their pages",
  "What are the limitations or risks mentioned?",
];

export function QuickActions({
  onPick,
  disabled,
}: {
  onPick: (prompt: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="surface-panel p-4">
      <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        Quick questions
      </p>
      <div className="mt-3 flex flex-col gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            disabled={disabled}
            onClick={() => onPick(preset)}
            className="rounded-lg border border-border bg-surface-raised/50 px-3 py-2 text-left text-xs leading-snug text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            {preset}
          </button>
        ))}
      </div>
    </div>
  );
}
