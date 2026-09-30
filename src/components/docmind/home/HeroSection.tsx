import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowDown, CheckCircle2, FileUp, ShieldCheck, Sparkles, UploadCloud } from "lucide-react";
import React, { useRef, useState } from "react";

import { HeroProductVisual } from "./HeroProductVisual";
import { Progress } from "@/components/ui/progress";

interface HeroSectionProps {
  onFile: (file: File) => void;
  busy: boolean;
  stage: string;
  progress: number;
}

export function HeroSection({ onFile, busy, stage, progress }: HeroSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  // Subtle parallax effect on hero right visual: 15-20px maximum
  const { scrollY } = useScroll();
  const visualParallaxY = useTransform(scrollY, [0, 400], [0, shouldReduceMotion ? 0 : 20]);

  const handlePick = (files: FileList | null) => {
    const file = files?.[0];
    if (file) {
      onFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handlePick(e.target.files);
    // Reset value so re-uploading the same file still fires
    e.target.value = "";
  };

  const scrollToHowItWorks = () => {
    const section = document.getElementById("how-it-works");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Entrance motion parameters (disabled if reduced motion requested)
  const fadeUp = (delay: number, distance = 15) =>
    shouldReduceMotion
      ? {
          initial: { opacity: 1, y: 0 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0 },
        }
      : {
          initial: { opacity: 0, y: distance },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, delay, ease: "easeOut" as const },
        };

  return (
    <section
      ref={containerRef}
      className="relative pt-6 pb-12 sm:pt-10 sm:pb-16 lg:pt-14 lg:pb-20 overflow-hidden"
    >
      {/* Background ambient radial tints */}
      <div
        className="absolute top-0 left-1/4 -z-10 h-[380px] w-[380px] rounded-full opacity-25 blur-3xl pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(115, 18, 53, 0.16) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute top-1/3 right-8 -z-10 h-[320px] w-[320px] rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(161, 170, 104, 0.22) 0%, transparent 70%)",
        }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12 xl:gap-16">
          {/* ======================================================== */}
          {/* LEFT COLUMN: Badge, Headline, Subtitle, CTA, Trust, Drop */}
          {/* ======================================================== */}
          <div className="lg:col-span-7 flex flex-col space-y-6 text-left">
            {/* 1. Small Product Badge */}
            <motion.div {...fadeUp(0.0, 15)} className="w-fit">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-[#F3E9ED] px-3.5 py-1 text-xs font-semibold text-[#731235] shadow-2xs">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>✦ EVIDENCE-GROUNDED AI</span>
              </div>
            </motion.div>

            {/* 2. Large Headline */}
            <motion.h1
              {...fadeUp(0.1, 20)}
              className="font-display text-4xl sm:text-5xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight text-foreground leading-[1.08]"
            >
              ASK YOUR DOCUMENTS{" "}
              <span className="text-primary block sm:inline">REAL QUESTIONS.</span>
            </motion.h1>

            {/* 3. Subtitle / Description */}
            <motion.p
              {...fadeUp(0.2, 15)}
              className="max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed"
            >
              Upload a PDF and explore it conversationally with evidence-grounded AI answers, exact
              page citations, and clickable source evidence.
            </motion.p>

            {/* Hidden native file input shared by CTAs and dropzone */}
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              onChange={handleFileChange}
              disabled={busy}
              aria-label="Upload PDF file"
            />

            {/* 4. CTA Buttons: Primary [ ↑ Upload PDF ] + Secondary [ See How It Works ↓ ] */}
            <motion.div
              {...fadeUp(0.3, 15)}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1"
            >
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={busy}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary-hover hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 cursor-pointer"
              >
                <UploadCloud className="h-4 w-4 stroke-[2.2]" />
                <span>↑ Upload PDF</span>
              </button>

              <button
                type="button"
                onClick={scrollToHowItWorks}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-6 py-3.5 text-sm font-medium text-foreground transition-all hover:bg-secondary hover:border-primary/40 shadow-2xs hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <span>See How It Works</span>
                <ArrowDown className="h-4 w-4 text-muted-foreground" />
              </button>
            </motion.div>

            {/* Compact Refined Dropzone Surface */}
            <motion.div
              {...fadeUp(0.35, 15)}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (!busy) handlePick(e.dataTransfer.files);
              }}
              onClick={() => {
                if (!busy) fileInputRef.current?.click();
              }}
              className={`group relative rounded-2xl border-2 border-dashed p-4 sm:p-5 transition-all duration-200 cursor-pointer text-center ${
                isDragging
                  ? "border-primary bg-[#F3E9ED]/50 ring-4 ring-primary/10 scale-[1.01]"
                  : "border-border bg-white/70 hover:border-primary/50 hover:bg-white hover:shadow-xs"
              }`}
            >
              {busy ? (
                /* Active Indexing State */
                <div className="py-2 space-y-3 animate-in fade-in-50 duration-200">
                  <div className="flex items-center justify-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
                    <span className="font-display text-sm font-bold text-foreground">
                      Indexing Document…
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{stage}</p>
                  <div className="max-w-xs mx-auto space-y-1">
                    <Progress value={progress} className="h-1.5 rounded-full" />
                    <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                      <span>In-memory extraction</span>
                      <span className="font-semibold text-primary">{Math.round(progress)}%</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Ready State */
                <div className="flex items-center justify-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-150 ${
                      isDragging
                        ? "bg-primary text-white scale-110"
                        : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white"
                    }`}
                  >
                    <FileUp className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-foreground">
                      {isDragging
                        ? "Drop your PDF to start indexing"
                        : "Or drag and drop your PDF here"}
                    </p>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      PDF · Secure · In-browser vector search
                    </p>
                  </div>
                </div>
              )}
            </motion.div>

            {/* 5. Trust Indicators */}
            <motion.div {...fadeUp(0.4, 10)} className="space-y-2 pt-0.5">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-evidence shrink-0" />
                <span className="font-medium text-foreground/80">
                  Your document stays in your browser while it's indexed.
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                  Page-aware extraction
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-evidence" />
                  Evidence citations
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                  Local vector search
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-evidence" />
                  Grounded responses
                </span>
              </div>
            </motion.div>
          </div>

          {/* ======================================================== */}
          {/* RIGHT COLUMN: Document Intelligence Visual with Parallax */}
          {/* ======================================================== */}
          <motion.div
            style={{ y: visualParallaxY }}
            className="lg:col-span-5 flex justify-center w-full"
          >
            <HeroProductVisual />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
