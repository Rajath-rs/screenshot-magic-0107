import { motion, useReducedMotion } from "framer-motion";
import { ArrowUp, ShieldCheck, Sparkles, UploadCloud } from "lucide-react";
import React, { useRef } from "react";

interface FinalCTAProps {
  onFile: (file: File) => void;
  busy?: boolean;
}

export function FinalCTA({ onFile, busy }: FinalCTAProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFile(file);
    }
    e.target.value = "";
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" as const },
    },
  };

  return (
    <section className="relative overflow-hidden py-16 sm:py-24 border-t border-border bg-gradient-to-b from-background via-surface/60 to-surface">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {/* Subtle pill tag */}
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary mb-6"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Instant In-Browser RAG</span>
          </motion.div>

          {/* Heading */}
          <motion.h2
            variants={itemVariants}
            className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground"
          >
            Ready to ask your document a{" "}
            <span className="text-primary underline decoration-primary/30 underline-offset-8">
              question?
            </span>
          </motion.h2>

          {/* Paragraph */}
          <motion.p
            variants={itemVariants}
            className="mx-auto mt-4 max-w-xl text-base text-muted-foreground leading-relaxed"
          >
            Drop any PDF to index it page-by-page in memory. Start receiving grounded answers,
            interactive evidence snippets, and verified citations in seconds.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5"
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="sr-only"
              onChange={handleFileChange}
              disabled={busy}
              aria-label="Upload PDF file"
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary-hover hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 cursor-pointer"
            >
              <UploadCloud className="h-4 w-4" />
              <span>↑ Upload PDF</span>
            </button>

            <button
              type="button"
              onClick={scrollToTop}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-6 py-3.5 text-sm font-medium text-foreground transition-all hover:bg-secondary hover:border-primary/40 shadow-2xs hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <span>Back to top</span>
              <ArrowUp className="h-4 w-4 text-muted-foreground" />
            </button>
          </motion.div>

          {/* Reassurance tags */}
          <motion.div
            variants={itemVariants}
            className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground"
          >
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-evidence" />
              In-browser indexing
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-border" />
              Zero database persistence
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-border" />
              100% Page-level citations
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
