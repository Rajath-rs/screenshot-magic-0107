import { Loader2, Sparkles } from "lucide-react";

import { QUICK_ACTIONS } from "./quick-actions-data";

export function QuickActions({
  onPick,
  disabled,
  activeActionId,
}: {
  onPick: (actionId: string, prompt: string) => void;
  disabled: boolean;
  activeActionId?: string | null | undefined;
}) {
  return (
    <div className="mb-2.5 flex items-center gap-2.5 rounded-xl border border-border bg-white px-3 py-1.5 shrink-0 overflow-hidden shadow-2xs">
      {/* Section Header */}
      <div className="flex items-center gap-1.5 shrink-0 select-none border-r border-border pr-2.5 sm:pr-3">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground hidden sm:inline">
          AI Quick Actions
        </span>
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground sm:hidden">
          Actions
        </span>
      </div>

      {/* Action Buttons Row */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-slim py-0.5 min-w-0 flex-1 flex-nowrap">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          const isActive = disabled && activeActionId === action.id;
          const isPrimary = action.isPrimary;

          return (
            <button
              key={action.id}
              type="button"
              disabled={disabled}
              onClick={() => onPick(action.id, action.prompt)}
              className={`group inline-flex shrink-0 items-center gap-2 rounded-lg h-8 px-3 text-xs transition-all duration-150 cursor-pointer shadow-2xs focus-visible:ring-1 focus-visible:ring-primary/60 outline-none disabled:cursor-not-allowed ${
                isActive
                  ? "border border-primary bg-primary/10 text-primary ring-1 ring-primary/30 font-semibold"
                  : isPrimary
                    ? "border border-primary/30 bg-[#F3E9ED] text-[#731235] hover:bg-primary hover:text-white font-semibold"
                    : "border border-border bg-white text-foreground hover:border-primary hover:bg-[#F3E9ED] hover:text-[#731235] font-medium"
              } ${disabled && !isActive ? "opacity-40" : ""}`}
              title={action.description}
            >
              {isActive ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
              ) : (
                <Icon
                  className={`h-3.5 w-3.5 shrink-0 transition-transform duration-150 group-hover:scale-110 ${
                    isPrimary ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                  }`}
                />
              )}
              <span className="whitespace-nowrap">
                {isActive ? action.loadingLabel : action.label}
              </span>
              {isActive && (
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
