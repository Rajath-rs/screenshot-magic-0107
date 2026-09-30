import { ArrowRight, Sparkles } from "lucide-react";
import React from "react";

export interface RelatedQuestionsProps {
  questions: string[];
  onSelect: (question: string) => void;
  disabled?: boolean | undefined;
}

export function RelatedQuestions({
  questions,
  onSelect,
  disabled = false,
}: RelatedQuestionsProps) {
  // Enforce strictly 3 questions
  if (!questions || questions.length !== 3) {
    return null;
  }

  return (
    <div className="mt-3 pt-2.5 border-t border-[#E5E0E1]/80 w-full animate-in fade-in-50 duration-200">
      {/* Section Label */}
      <div className="flex items-center gap-1.5 mb-2 select-none">
        <Sparkles className="h-3 w-3 text-primary shrink-0" />
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Related Questions
        </span>
      </div>

      {/* 3 Question Cards: 3 columns on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {questions.map((question, index) => (
          <button
            key={`${index}-${question}`}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(question)}
            className="group relative flex items-center justify-between gap-2 rounded-xl border border-border bg-white px-3 py-2 text-left text-xs font-medium text-foreground transition-all duration-150 hover:border-primary hover:bg-[#F3E9ED] hover:text-[#731235] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
            title={`Ask: "${question}"`}
          >
            <span className="line-clamp-2 leading-relaxed flex-1 text-xs">
              {question}
            </span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-primary" />
          </button>
        ))}
      </div>
    </div>
  );
}
