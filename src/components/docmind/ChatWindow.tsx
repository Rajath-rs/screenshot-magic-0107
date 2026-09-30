import { CornerDownLeft, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { ChatMessage, type Message } from "./ChatMessage";

type Props = {
  messages: Message[];
  onAsk: (question: string) => void;
  busy: boolean;
  draft: string;
  onDraftChange: (value: string) => void;
};

export function ChatWindow({ messages, onAsk, busy, draft, onDraftChange }: Props) {
  const endRef = useRef<HTMLDivElement>(null);
  const [rows, setRows] = useState(1);

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
    <div className="surface-panel flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 border-b border-border px-5 py-3">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <p className="font-display text-sm">Grounded Q&amp;A</p>
        <span className="ml-auto text-xs text-muted-foreground">
          Answers cite page evidence
        </span>
      </div>

      <div className="scrollbar-slim flex-1 space-y-6 overflow-y-auto px-5 py-6">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        <div ref={endRef} />
      </div>

      <div className="border-t border-border p-3">
        <div className="flex items-end gap-2 rounded-xl border border-input bg-surface-raised/60 p-2 focus-within:border-primary/50">
          <textarea
            value={draft}
            rows={rows}
            placeholder="Ask anything about this document…"
            onChange={(e) => {
              onDraftChange(e.target.value);
              setRows(Math.min(4, e.target.value.split("\n").length));
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            className="max-h-32 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={submit}
            disabled={busy || !draft.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-brand px-3 py-2 text-xs font-medium text-primary-foreground transition-opacity disabled:opacity-40"
          >
            Ask
            <CornerDownLeft className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
