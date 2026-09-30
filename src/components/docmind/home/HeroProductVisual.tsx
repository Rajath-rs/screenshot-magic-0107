import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowDown,
  Check,
  ExternalLink,
  FileSearch,
  FileText,
  Search,
  Sparkles,
} from "lucide-react";
import React from "react";

export function HeroProductVisual() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" as const }}
      className="relative mx-auto w-full max-w-lg lg:max-w-none select-none"
    >
      {/* Subtle ambient backdrop radial glow */}
      <div
        className="absolute -inset-4 rounded-3xl opacity-35 blur-2xl pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(115, 18, 53, 0.12) 0%, rgba(161, 170, 104, 0.12) 55%, transparent 75%)",
        }}
      />

      {/* Main Composition Wrapper */}
      <div className="relative flex flex-col space-y-3 p-1">
        {/* Floating Mini Badge Top Right */}
        <motion.div
          animate={shouldReduceMotion ? { y: 0 } : { y: [0, -4, 0] }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: 3.5, repeat: Infinity, ease: "easeInOut" as const }
          }
          className="absolute -top-3.5 right-4 z-20 hidden sm:inline-flex items-center gap-1.5 rounded-full border border-[#A1AA68]/50 bg-white/95 px-3 py-1 text-[11px] font-mono font-semibold text-[#465324] shadow-md backdrop-blur-md"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-evidence animate-pulse" />
          <span>98% Cosine Similarity</span>
        </motion.div>

        {/* 1. PDF DOCUMENT CARD (Layer 1) */}
        <motion.div
          animate={shouldReduceMotion ? { y: 0 } : { y: [0, -7, 0] }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: 4.2, repeat: Infinity, ease: "easeInOut" as const }
          }
          className="relative rounded-2xl border border-border bg-white p-4 shadow-soft transition-shadow hover:shadow-card"
        >
          {/* Card Top Header */}
          <div className="flex items-center justify-between border-b border-border pb-2.5 mb-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-foreground font-display">
                  Research_Paper.pdf
                </p>
                <p className="text-[10px] text-muted-foreground font-mono">
                  15 Pages · Page 7 of 15
                </p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1 rounded-full bg-[#F4F6ED] border border-[#A1AA68]/45 px-2 py-0.5 text-[10px] font-mono font-semibold text-[#465324]">
              <FileSearch className="h-3 w-3 text-evidence" />
              In-Memory Canvas
            </span>
          </div>

          {/* Document Content Simulation with Cited Highlight */}
          <div className="rounded-xl border border-border/80 bg-[#FAF8F5] p-3 space-y-1.5 text-[10px] leading-relaxed text-[#242124]/80">
            <div className="flex items-center justify-between text-[9px] font-mono text-muted-foreground pb-1 border-b border-border/50">
              <span>SECTION 3.2 · ARCHITECTURE</span>
              <span className="text-primary font-semibold">Active Anchor</span>
            </div>
            <p className="line-clamp-1 opacity-70">
              The model relies entirely on self-attention mechanisms without recurrent connections.
            </p>
            {/* Cited Passage Highlighted in Olive Moss */}
            <div className="rounded-lg bg-[#F4F6ED] border border-[#A1AA68] p-2 text-[#3D4620] ring-2 ring-evidence/25 shadow-2xs">
              <p className="font-medium text-[10px]">
                "In this work we employ h = 8 parallel attention layers, or heads. For each of these
                we use d_k = d_v = 64."
              </p>
              <div className="mt-1.5 flex items-center justify-between text-[9px] font-mono text-evidence">
                <span className="font-semibold">Cited by DocMind AI</span>
                <span className="bg-white/80 px-1.5 py-0.5 rounded border border-[#A1AA68]/40">
                  p. 7
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Dynamic Animated Connector: PDF -> AI */}
        <div className="flex justify-center -my-1 z-10">
          <div className="inline-flex items-center gap-1 rounded-full bg-white border border-border px-2.5 py-0.5 text-[9px] font-mono text-muted-foreground shadow-2xs">
            <ArrowDown className="h-3 w-3 text-primary animate-bounce" />
            <span>Retrieved Vector Context</span>
          </div>
        </div>

        {/* 2. GROUNDED AI ANSWER CARD (Layer 2) */}
        <motion.div
          animate={shouldReduceMotion ? { y: 0 } : { y: [0, 6, 0] }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: 5.1, repeat: Infinity, ease: "easeInOut" as const }
          }
          className="relative rounded-2xl border border-border bg-white p-4 shadow-soft transition-shadow hover:shadow-card"
        >
          {/* User Question */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="font-display text-[11px] font-bold text-foreground">
                DocMind Response
              </span>
            </div>
            <span className="text-[9px] font-mono text-evidence font-semibold bg-[#F4F6ED] px-2 py-0.5 rounded-full border border-[#A1AA68]/30">
              Strictly Grounded
            </span>
          </div>

          <div className="rounded-xl bg-[#F8F6F2] p-2.5 border border-border/70 mb-2.5">
            <p className="text-[10px] text-muted-foreground font-mono mb-0.5">User Query:</p>
            <p className="text-xs font-semibold text-foreground">
              "How many attention heads are used and what are their dimensions?"
            </p>
          </div>

          <p className="text-xs text-[#242124] leading-relaxed">
            The architecture utilizes exactly <strong>8 parallel attention heads</strong> with
            projection dimensions d_k = d_v = 64{" "}
            <span className="inline-flex items-center rounded-md border border-[#A1AA68] bg-[#F4F6ED] px-1.5 py-0.5 text-[11px] font-mono font-bold text-[#465324] shadow-2xs hover:bg-primary hover:text-white transition-colors cursor-pointer">
              (p. 7)
            </span>
            .
          </p>
        </motion.div>

        {/* Dynamic Animated Connector: AI -> Evidence */}
        <div className="flex justify-center -my-1 z-10">
          <div className="inline-flex items-center gap-1 rounded-full bg-white border border-[#A1AA68]/40 px-2.5 py-0.5 text-[9px] font-mono text-[#465324] shadow-2xs">
            <ArrowDown className="h-3 w-3 text-evidence animate-bounce" />
            <span>Verifiable Source Chain</span>
          </div>
        </div>

        {/* 3. VERIFIED EVIDENCE CARD (Layer 3) */}
        <motion.div
          animate={shouldReduceMotion ? { y: 0 } : { y: [0, -5, 0] }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: 4.6, repeat: Infinity, ease: "easeInOut" as const }
          }
          className="relative rounded-2xl border-2 border-evidence bg-[#FAFBF7] p-3.5 shadow-card transition-shadow hover:shadow-md"
        >
          <div className="flex items-center justify-between border-b border-[#A1AA68]/30 pb-2 mb-2">
            <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#4E5629]">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-evidence text-white">
                <Check className="h-2.5 w-2.5 stroke-[3]" />
              </span>
              <span>Document Evidence · Page 7</span>
            </div>
            <span className="font-mono text-[10px] font-bold text-[#4E5629] bg-[#F4F6ED] px-2 py-0.5 rounded-full border border-[#A1AA68]/40">
              Score: 0.98
            </span>
          </div>

          <p className="text-[11px] text-[#242124]/90 italic border-l-2 border-evidence pl-2.5 my-1.5 line-clamp-2">
            "In this work we employ h = 8 parallel attention layers, or heads... For each of these
            we use d_k = d_v = 64."
          </p>

          <div className="flex items-center justify-between pt-2 border-t border-[#A1AA68]/20 text-[10px]">
            <span className="font-mono text-muted-foreground">Chunk ID: page7_chunk2</span>
            <div className="inline-flex items-center gap-1 rounded-md bg-white border border-border px-2 py-1 font-semibold text-foreground shadow-2xs hover:bg-primary hover:text-white transition-colors cursor-pointer">
              <span>View Page 7</span>
              <ExternalLink className="h-2.5 w-2.5" />
            </div>
          </div>
        </motion.div>

        {/* Floating Mini Badge Bottom Left */}
        <motion.div
          animate={shouldReduceMotion ? { y: 0 } : { y: [0, 4, 0] }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: 3.8, repeat: Infinity, ease: "easeInOut" as const }
          }
          className="absolute -bottom-3 left-4 z-20 hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border bg-white/95 px-3 py-1 text-[11px] font-mono font-medium text-foreground shadow-md backdrop-blur-md"
        >
          <Search className="h-3 w-3 text-primary" />
          <span>Local Vector Search · No Hallucinations</span>
        </motion.div>
      </div>
    </motion.div>
  );
}
