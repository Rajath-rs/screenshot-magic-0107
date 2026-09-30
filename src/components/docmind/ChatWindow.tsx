import { CornerDownLeft, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { ChatMessage, type Message } from "./ChatMessage";
import { GenerationLoader } from "./GenerationLoader";

type Props = {
  messages: Message[];
  onAsk: (question: string) => void;
  busy: boolean;
  draft: string;
  onDraftChange: (value: string) => void;
  onOpenPage?: ((page: number) => void) | undefined;
  activePage?: number | undefined;
};

export function ChatWindow({
  messages,
  onAsk,
  busy,
  draft,
  onDraftChange,
  onOpenPage,
  activePage,
}: Props) {
  const endRef = useRef<HTMLDivElement>(null);
  const [rows, setRows] = useState(1);

  // Check if AI generation is active before first meaningful token arrives
  const latestMessage = messages[messages.length - 1];
  const isGenerating =
    busy &&
    Boolean(
      latestMessage &&
      latestMessage.role === "assistant" &&
      latestMessage.pending &&
      !latestMessage.content.trim(),
    );

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const submit = () => {
    const question = draft.trim();
    if (!question || busy) return;
    onAsk(question);
    setRows(1);
  };

  return (
    <div className="surface-panel flex h-full min-h-0 flex-col overflow-hidden bg-white">
      {/* Chat Header */}
      <div className="flex items-center justify-between border-b border-border bg-white px-3.5 py-2 text-xs shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <span className="font-display text-xs font-semibold text-foreground">
            Grounded Document Q&amp;A
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#F4F6ED] border border-[#A1AA68]/45 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#465324] shadow-2xs">
            <Sparkles className="h-3 w-3 text-evidence" />
            Page Evidence Active
          </span>
        </div>
      </div>

      {/* Messages Area & Layered Generation Overlay */}
      <div className="relative flex-1 min-h-0 overflow-hidden">
        {/* Layer 1: ChatContent (blurred & dimmed while generation is preparing) */}
        <div
          className={`scrollbar-slim h-full space-y-4 overflow-y-auto px-4 py-4 transition-all duration-200 ${
            isGenerating
              ? "filter blur-[6px] opacity-40 pointer-events-none select-none"
              : "filter blur-0 opacity-100 pointer-events-auto"
          }`}
          aria-hidden={isGenerating}
        >
          {messages.map((message, index) => {
            const isLatest = index === messages.length - 1;
            return (
              <ChatMessage
                key={message.id}
                message={message}
                onOpenPage={onOpenPage}
                activePage={activePage}
                suggestions={isLatest && !busy ? message.suggestions : undefined}
                onSelectSuggestion={onAsk}
                disabledSuggestions={busy}
              />
            );
          })}
          <div ref={endRef} />
        </div>

        {/* Layer 2: GenerationOverlay (sharp, unblurred GenerationLoader centered above blur) */}
        <div
          className={`absolute inset-0 z-20 flex flex-col items-center justify-center p-4 transition-all duration-200 ${
            isGenerating
              ? "opacity-100 pointer-events-auto backdrop-blur-sm bg-[#F8F6F2]/75"
              : "opacity-0 pointer-events-none backdrop-blur-none bg-transparent"
          }`}
          aria-live="polite"
          aria-busy={isGenerating}
        >
          {isGenerating && (
            <span className="sr-only">DocMind AI is analyzing document evidence</span>
          )}

          <div
            className={`flex flex-col items-center justify-center transition-all duration-200 transform ${
              isGenerating ? "scale-100 opacity-100" : "scale-95 opacity-0"
            }`}
          >
            <GenerationLoader />
          </div>
        </div>
      </div>

      {/* Input Box (Pinned Bottom) */}
      <div
        className={`border-t border-border bg-white p-2.5 shrink-0 transition-opacity duration-200 ${
          busy ? "opacity-75" : "opacity-100"
        }`}
      >
        <div
          className={`flex items-end gap-2 rounded-xl border border-border bg-white p-2 shadow-2xs transition-all ${
            busy
              ? "opacity-80 cursor-not-allowed bg-[#FAF9F7]"
              : "focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/25"
          }`}
        >
          <textarea
            value={draft}
            rows={rows}
            disabled={busy}
            placeholder={
              busy
                ? "DocMind AI is analyzing document evidence…"
                : "Ask anything about this document… (e.g. 'What is the methodology?')"
            }
            onChange={(e) => {
              if (busy) return;
              onDraftChange(e.target.value);
              setRows(Math.min(4, Math.max(1, e.target.value.split("\n").length)));
            }}
            onKeyDown={(e) => {
              if (busy) return;
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            className="max-h-28 flex-1 resize-none bg-transparent px-2.5 py-1 text-xs sm:text-sm leading-relaxed outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed text-foreground"
          />
          <button
            type="button"
            onClick={submit}
            disabled={busy || !draft.trim()}
            className="inline-flex items-center gap-1 rounded-lg bg-primary hover:bg-primary-hover px-3 py-1.5 text-xs font-semibold text-white shadow-2xs transition-all active:scale-95 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer shrink-0"
          >
            <span>Ask</span>
            <CornerDownLeft className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
