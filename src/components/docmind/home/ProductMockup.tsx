import { Check, ExternalLink, FileText, Quote, Sparkles } from "lucide-react";
import React from "react";

export function ProductMockup() {
  return (
    <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
      {/* Decorative backdrop glow */}
      <div
        className="absolute -inset-4 rounded-3xl opacity-40 blur-2xl pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(115, 18, 53, 0.12) 0%, rgba(161, 170, 104, 0.1) 60%, transparent 80%)",
        }}
      />

      {/* Main Mockup Card Container */}
      <div className="relative rounded-2xl border border-border bg-white p-4 sm:p-5 shadow-soft overflow-hidden">
        {/* Document Header Bar */}
        <div className="flex items-center justify-between border-b border-border pb-3 mb-3.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-foreground font-display">
                Attention_Is_All_You_Need.pdf
              </p>
              <p className="text-[10px] text-muted-foreground font-mono">15 Pages · 48 Chunks</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F4F6ED] border border-[#A1AA68]/50 px-2.5 py-0.5 text-[10px] font-semibold text-[#465324]">
            <span className="h-1.5 w-1.5 rounded-full bg-evidence animate-pulse" />
            Indexed
          </span>
        </div>

        {/* Two-Column Mockup View: Mini PDF Page & AI Grounded Answer */}
        <div className="grid gap-3 sm:grid-cols-2">
          {/* Left Column: Simulated PDF Page View */}
          <div className="rounded-xl border border-border bg-[#EDEAE5] p-3 flex flex-col justify-between relative overflow-hidden min-h-[220px]">
            <div className="flex items-center justify-between border-b border-border/60 pb-1.5 mb-2 text-[10px] font-mono text-muted-foreground">
              <span>PAGE 4 / 15</span>
              <span className="text-[9px] uppercase tracking-wider bg-white/80 px-1.5 py-0.5 rounded border border-border/60">
                100% Fit
              </span>
            </div>

            {/* Document Text Mockup with Cited Highlight */}
            <div className="space-y-1.5 text-[9px] leading-relaxed text-[#242124]/80">
              <p className="font-semibold text-foreground text-[10px]">3.2 Multi-Head Attention</p>
              <p className="line-clamp-2">
                Multi-head attention allows the model to jointly attend to information from
                different representation subspaces at different positions.
              </p>
              {/* Highlighted Cited Passage in Olive Moss */}
              <div className="rounded-md bg-[#F4F6ED] border border-[#A1AA68] p-1.5 text-[#3D4620] ring-2 ring-evidence/30 shadow-2xs">
                <p className="font-medium text-[9px]">
                  "In this work we employ h = 8 parallel attention layers, or heads. For each of
                  these we use d_k = d_v = 64."
                </p>
                <div className="mt-1 flex items-center justify-between text-[8px] font-mono text-evidence">
                  <span>Cited by AI</span>
                  <span>§3.2 · p. 4</span>
                </div>
              </div>
              <p className="line-clamp-2 opacity-60">
                Due to the reduced dimension of each head, the total computational cost is similar
                to that of single-head attention.
              </p>
            </div>

            <div className="mt-2 pt-1.5 border-t border-border/60 flex items-center justify-between text-[9px] text-muted-foreground">
              <span>Document Canvas</span>
              <span className="font-mono text-primary font-semibold">Active Anchor</span>
            </div>
          </div>

          {/* Right Column: AI Response & Evidence Card */}
          <div className="flex flex-col justify-between space-y-2.5">
            {/* User Question Bubble */}
            <div className="ml-auto w-fit max-w-[90%] rounded-xl rounded-tr-xs bg-[#F3E9ED] border border-border border-l-2 border-l-primary px-3 py-1.5 text-[11px] font-medium text-foreground">
              How many attention heads are used?
            </div>

            {/* AI Response Card */}
            <div className="rounded-xl border border-border bg-white p-2.5 text-[11px] leading-relaxed shadow-2xs">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Sparkles className="h-3 w-3 text-primary" />
                <span className="font-display text-[10px] font-bold text-foreground">
                  DocMind AI
                </span>
              </div>
              <p className="text-[#242124] text-[11px] leading-normal">
                The architecture employs <strong>8 parallel attention heads</strong> with projection
                dimensions d_k = d_v = 64{" "}
                <span className="inline-flex items-center rounded border border-[#A1AA68] bg-[#F4F6ED] px-1 py-0 text-[10px] font-mono font-semibold text-[#465324]">
                  (p. 4)
                </span>
                .
              </p>
            </div>

            {/* Verified Evidence Card */}
            <div className="rounded-xl border border-[#A1AA68] bg-[#FAFBF7] p-2.5 text-[10px] shadow-2xs">
              <div className="flex items-center justify-between border-b border-[#A1AA68]/20 pb-1 mb-1.5">
                <span className="flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-wider text-[#4E5629]">
                  <Check className="h-2.5 w-2.5 text-evidence stroke-[3]" />
                  <span>Document Evidence</span>
                </span>
                <span className="font-mono text-[9px] font-semibold text-muted-foreground">
                  96%
                </span>
              </div>
              <p className="line-clamp-2 text-[10px] leading-relaxed text-foreground/90 italic">
                "...we employ h = 8 parallel attention layers... d_k = d_v = 64..."
              </p>
              <div className="mt-1.5 flex items-center justify-between pt-1 border-t border-[#A1AA68]/20 text-[9px]">
                <span className="font-mono font-semibold text-[#4E5629]">Page 4</span>
                <span className="inline-flex items-center gap-0.5 text-primary font-semibold">
                  <span>View Page</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
