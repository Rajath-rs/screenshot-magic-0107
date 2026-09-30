import { Bot, FileText, Search, Sparkles, User } from "lucide-react";
import React from "react";

import { RelatedQuestions } from "./RelatedQuestions";
import { SourceCard } from "./SourceCard";
import type { Retrieved } from "@/lib/vector-store";

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Retrieved[];
  suggestions?: string[];
  error?: boolean;
  pending?: boolean;
};

type Props = {
  message: Message;
  onOpenPage?: ((page: number) => void) | undefined;
  activePage?: number | undefined;
  suggestions?: string[] | undefined;
  onSelectSuggestion?: ((question: string) => void) | undefined;
  disabledSuggestions?: boolean | undefined;
};

type MarkdownBlock =
  | { type: "heading"; level: number; text: string }
  | { type: "section"; title: string }
  | { type: "paragraph"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "code"; code: string; language?: string | undefined }
  | { type: "hr" };

function parseMarkdownBlocks(rawText: string): MarkdownBlock[] {
  if (!rawText) return [];
  const lines = rawText.split("\n");
  const blocks: MarkdownBlock[] = [];
  let currentList: { type: "ul" | "ol"; items: string[] } | null = null;

  function flushList() {
    if (currentList && currentList.items.length > 0) {
      blocks.push(currentList);
      currentList = null;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const trimmed = line.trim();

    if (!trimmed) {
      // Look ahead to check if an active list continues after an empty line
      let nextNonEmpty: string | null = null;
      for (let j = i + 1; j < lines.length; j++) {
        const nextTrimmed = lines[j]?.trim();
        if (nextTrimmed) {
          nextNonEmpty = nextTrimmed;
          break;
        }
      }

      if (currentList) {
        const continuesUl = currentList.type === "ul" && nextNonEmpty && /^[-*•]\s+/.test(nextNonEmpty);
        const continuesOl = currentList.type === "ol" && nextNonEmpty && /^\d+[\.\)]\s+/.test(nextNonEmpty);
        if (!continuesUl && !continuesOl) {
          flushList();
        }
      }
      continue;
    }

    // 1. Multi-line code fence (```lang ... ```)
    if (trimmed.startsWith("```")) {
      flushList();
      const lang = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i]?.trim().startsWith("```")) {
        const codeLine = lines[i];
        if (codeLine !== undefined) {
          codeLines.push(codeLine);
        }
        i++;
      }
      blocks.push({
        type: "code",
        code: codeLines.join("\n"),
        language: lang ? lang : undefined,
      });
      continue;
    }

    // 2. Horizontal divider (---, ___, ***)
    if (/^(\-{3,}|\_{3,}|\*{3,})$/.test(trimmed)) {
      flushList();
      blocks.push({ type: "hr" });
      continue;
    }

    // 3. Markdown headings (#, ##, ###, ####)
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch && headingMatch[1] && headingMatch[2]) {
      flushList();
      const level = headingMatch[1].length;
      const cleanTitle = headingMatch[2]
        .replace(/\*\*/g, "")
        .replace(/^(\d+[\.\)]\s*)/, "")
        .replace(/[:\-]$/, "")
        .trim();
      blocks.push({
        type: "heading",
        level,
        text: cleanTitle,
      });
      continue;
    }

    // 4. Standalone Bold line with optional colon/dash or numbering (e.g. "**Methodology**", "**Methodology:**", "1. **Methodology**:")
    const standaloneBoldMatch = trimmed.match(
      /^(?:\d+[\.\)]\s*)?\*\*(.+?)\*\*\s*[:\-]?\s*$|^(?:\d+[\.\)]\s*)?\*\*(.+?)[:\-]\*\*\s*$/
    );
    if (standaloneBoldMatch) {
      flushList();
      const rawTitle = standaloneBoldMatch[1] ?? standaloneBoldMatch[2] ?? "";
      const title = rawTitle
        .replace(/^(\d+[\.\)]\s*)/, "")
        .replace(/[:\-]$/, "")
        .trim();
      blocks.push({
        type: "section",
        title,
      });
      continue;
    }

    // 5. Bold Section Headers with colon or dash and body text (e.g. "**Main Purpose**: The document...", "**Main Purpose:** The document...", "1. **Main Purpose**: ...")
    const sectionWithBodyMatch = trimmed.match(
      /^(?:\d+[\.\)]\s*)?\*\*(.+?)\*\*\s*[:\-]\s*(.+)$|^(?:\d+[\.\)]\s*)?\*\*(.+?)[:\-]\*\*\s*(.+)$/
    );
    if (sectionWithBodyMatch) {
      flushList();
      const rawTitle = sectionWithBodyMatch[1] ?? sectionWithBodyMatch[3] ?? "";
      const restText = sectionWithBodyMatch[2] ?? sectionWithBodyMatch[4] ?? "";
      const title = rawTitle
        .replace(/^(\d+[\.\)]\s*)/, "")
        .replace(/[:\-]$/, "")
        .trim();
      blocks.push({
        type: "section",
        title,
      });
      if (restText && restText.trim()) {
        blocks.push({
          type: "paragraph",
          text: restText.trim(),
        });
      }
      continue;
    }

    // 6. Bullet lists (- or * or •)
    const bulletMatch = trimmed.match(/^[-*•]\s+(.+)$/);
    if (bulletMatch && bulletMatch[1]) {
      if (!currentList || currentList.type !== "ul") {
        flushList();
        currentList = { type: "ul", items: [] };
      }
      currentList.items.push(bulletMatch[1].trim());
      continue;
    }

    // 7. Numbered lists (1. or 1))
    const numberMatch = trimmed.match(/^(\d+)[\.\)]\s+(.+)$/);
    if (numberMatch && numberMatch[2]) {
      if (!currentList || currentList.type !== "ol") {
        flushList();
        currentList = { type: "ol", items: [] };
      }
      currentList.items.push(numberMatch[2].trim());
      continue;
    }

    // 8. Regular paragraph line
    flushList();
    blocks.push({
      type: "paragraph",
      text: trimmed,
    });
  }

  flushList();
  return blocks;
}

function renderInlineContent(
  text: string,
  onOpenPage?: ((page: number) => void) | undefined,
  activePage?: number | undefined,
): React.ReactNode[] {
  if (!text) return [];

  const tokenRegex =
    /([\(\[](?:[^)\]]*?\b)?(?:p(?:ages?|\.)?\s*\d+[^)\]]*)[\)\]])|(?:\*\*([^*]+)\*\*)|(?:`([^`]+)`)|(?:\*([^*]+)\*)/gi;

  let lastIndex = 0;
  const elements: React.ReactNode[] = [];
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const rawSlice = text.slice(lastIndex, match.index);
      const clean = rawSlice.replace(/[*#]/g, "");
      if (clean) {
        elements.push(<React.Fragment key={`txt-${lastIndex}`}>{clean}</React.Fragment>);
      }
    }

    const [fullMatch, citationMatch, boldMatch, codeMatch, italicMatch] = match;

    if (citationMatch) {
      const numberMatches = Array.from(citationMatch.matchAll(/\d+/g));
      const pageNumbers = Array.from(
        new Set(
          numberMatches
            .map((m) => parseInt(m[0], 10))
            .filter((n) => !isNaN(n) && n > 0),
        ),
      );

      if (pageNumbers.length > 0 && onOpenPage) {
        elements.push(
          <span
            key={`cite-grp-${match.index}`}
            className="inline-flex items-center gap-1 mx-1 align-baseline"
          >
            {pageNumbers.map((pageNum) => {
              const isCurrentlyActive = activePage === pageNum;
              return (
                <button
                  key={`cite-btn-${match!.index}-${pageNum}`}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onOpenPage(pageNum);
                  }}
                  className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 font-mono text-[11px] font-semibold transition-all cursor-pointer shadow-2xs ${
                    isCurrentlyActive
                      ? "bg-evidence text-white ring-1 ring-evidence font-bold shadow-xs"
                      : "bg-[#F4F6ED] text-[#465324] border border-[#A1AA68]/45 hover:bg-primary hover:text-white hover:border-primary"
                  }`}
                  title={`Click to navigate PDF viewer to Page ${pageNum}`}
                >
                  <span>p. {pageNum}</span>
                </button>
              );
            })}
          </span>,
        );
      } else {
        elements.push(
          <span key={`cite-txt-${match.index}`}>{citationMatch.replace(/[*#]/g, "")}</span>,
        );
      }
    } else if (boldMatch) {
      const cleanBold = boldMatch.replace(/[*#]/g, "").trim();
      if (cleanBold) {
        elements.push(
          <strong key={`bld-${match.index}`} className="font-semibold text-foreground">
            {cleanBold}
          </strong>,
        );
      }
    } else if (codeMatch) {
      elements.push(
        <code
          key={`code-${match.index}`}
          className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-foreground border border-border"
        >
          {codeMatch.trim()}
        </code>,
      );
    } else if (italicMatch) {
      const cleanItalic = italicMatch.replace(/[*#]/g, "").trim();
      if (cleanItalic) {
        elements.push(
          <em key={`em-${match.index}`} className="italic text-foreground/95">
            {cleanItalic}
          </em>,
        );
      }
    }

    lastIndex = match.index + fullMatch.length;
  }

  if (lastIndex < text.length) {
    const rawSlice = text.slice(lastIndex);
    const clean = rawSlice.replace(/[*#]/g, "");
    if (clean) {
      elements.push(<React.Fragment key={`txt-end-${lastIndex}`}>{clean}</React.Fragment>);
    }
  }

  return elements;
}

function renderFormattedAnswer(
  content: string,
  onOpenPage?: ((page: number) => void) | undefined,
  activePage?: number | undefined,
) {
  if (!content) return null;

  const blocks = parseMarkdownBlocks(content);

  return (
    <div className="space-y-3 text-xs sm:text-sm leading-relaxed text-foreground">
      {blocks.map((block, idx) => {
        if (block.type === "heading" || block.type === "section") {
          const title = block.type === "heading" ? block.text : block.title;
          return (
            <h4
              key={`sec-${idx}`}
              className="font-display text-xs sm:text-sm font-bold tracking-tight text-foreground mt-3.5 first:mt-0 mb-1 border-l-2 border-l-primary pl-2"
            >
              {renderInlineContent(title, onOpenPage, activePage)}
            </h4>
          );
        }

        if (block.type === "ul") {
          return (
            <ul key={`ul-${idx}`} className="space-y-1.5 my-2 pl-1">
              {block.items.map((item, itemIdx) => (
                <li
                  key={`li-${itemIdx}`}
                  className="flex items-start gap-2.5 text-foreground leading-relaxed"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <span className="flex-1">
                    {renderInlineContent(item, onOpenPage, activePage)}
                  </span>
                </li>
              ))}
            </ul>
          );
        }

        if (block.type === "ol") {
          return (
            <ol key={`ol-${idx}`} className="space-y-1.5 my-2 pl-1">
              {block.items.map((item, itemIdx) => (
                <li
                  key={`oli-${itemIdx}`}
                  className="flex items-start gap-2.5 text-foreground leading-relaxed"
                >
                  <span className="font-mono text-xs font-semibold text-primary shrink-0 min-w-4 mt-0.5">
                    {itemIdx + 1}.
                  </span>
                  <span className="flex-1">
                    {renderInlineContent(item, onOpenPage, activePage)}
                  </span>
                </li>
              ))}
            </ol>
          );
        }

        if (block.type === "code") {
          return (
            <div
              key={`code-block-${idx}`}
              className="my-2.5 rounded-lg border border-border bg-[#F8F6F2] p-3 overflow-x-auto shadow-2xs"
            >
              {block.language ? (
                <div className="text-[10px] font-mono uppercase text-muted-foreground mb-1.5 font-semibold">
                  {block.language}
                </div>
              ) : null}
              <pre className="font-mono text-xs text-foreground whitespace-pre">
                <code>{block.code}</code>
              </pre>
            </div>
          );
        }

        if (block.type === "hr") {
          return <hr key={`hr-${idx}`} className="border-border my-3" />;
        }

        // Paragraph
        return (
          <p key={`p-${idx}`} className="text-foreground leading-relaxed last:mb-0">
            {renderInlineContent(block.text, onOpenPage, activePage)}
          </p>
        );
      })}
    </div>
  );
}

export function ChatMessage({
  message,
  onOpenPage,
  activePage,
  suggestions,
  onSelectSuggestion,
  disabledSuggestions,
}: Props) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg shadow-2xs ${
          isUser
            ? "bg-secondary text-primary border border-border"
            : "bg-primary text-primary-foreground"
        }`}
      >
        {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
      </div>

      <div className={`max-w-2xl flex-1 ${isUser ? "flex justify-end" : ""}`}>
        <div className="w-full space-y-2.5">
          <div
            className={`inline-block w-fit max-w-full rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-2xs ${
              isUser
                ? "ml-auto rounded-tr-xs bg-[#F3E9ED] border border-border border-l-2 border-l-primary text-[#242124] font-medium whitespace-pre-wrap"
                : message.error
                  ? "rounded-tl-xs border border-destructive/40 bg-destructive/10 text-foreground"
                  : "rounded-tl-xs border border-border bg-white text-[#242124]"
            }`}
          >
            {message.pending && !message.content ? (
              <span className="flex items-center gap-1.5 py-0.5 px-1">
                <Sparkles className="h-3.5 w-3.5 animate-spin text-primary mr-1" />
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="animate-thinking-dot inline-block h-1.5 w-1.5 rounded-full bg-primary"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </span>
            ) : isUser ? (
              <span>{message.content}</span>
            ) : (
              renderFormattedAnswer(message.content, onOpenPage, activePage)
            )}
          </div>

          {!isUser && message.sources && message.sources.length > 0 ? (
            <div className="space-y-2 pt-0.5">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#4E5629]">
                  <FileText className="h-3.5 w-3.5 text-evidence" />
                  <span>Cited Evidence ({message.sources.length})</span>
                </p>
                <span className="font-mono text-[10px] text-muted-foreground">
                  Click to view page
                </span>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {message.sources.map((source) => (
                  <SourceCard
                    key={source.chunk_id}
                    source={source}
                    onOpenPage={onOpenPage}
                    isActivePage={activePage === source.page_number}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {/* Contextual Follow-up Questions (shown on latest completed assistant message) */}
          {!isUser &&
          !message.error &&
          !message.pending &&
          suggestions &&
          suggestions.length === 3 &&
          onSelectSuggestion ? (
            <RelatedQuestions
              questions={suggestions}
              onSelect={onSelectSuggestion}
              disabled={disabledSuggestions}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
