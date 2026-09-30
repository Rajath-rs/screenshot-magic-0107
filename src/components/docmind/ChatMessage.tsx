import { Bot, User } from "lucide-react";

import { SourceCard } from "./SourceCard";
import type { Retrieved } from "@/lib/vector-store";

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Retrieved[];
  error?: boolean;
  pending?: boolean;
};

export function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          isUser
            ? "bg-secondary text-secondary-foreground"
            : "bg-gradient-brand text-primary-foreground"
        }`}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      <div className={`max-w-2xl flex-1 ${isUser ? "flex justify-end" : ""}`}>
        <div className="w-full space-y-3">
          <div
            className={`inline-block w-fit max-w-full rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
              isUser
                ? "ml-auto bg-secondary text-secondary-foreground"
                : message.error
                  ? "border border-destructive/40 bg-destructive/10 text-foreground"
                  : "border border-border bg-surface text-foreground"
            }`}
          >
            {message.pending && !message.content ? (
              <span className="flex items-center gap-1 py-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="animate-thinking-dot inline-block h-1.5 w-1.5 rounded-full bg-primary"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </span>
            ) : (
              message.content
            )}
          </div>

          {!isUser && message.sources && message.sources.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wider text-evidence">
                Evidence from the document
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {message.sources.map((source) => (
                  <SourceCard key={source.chunk_id} source={source} />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
