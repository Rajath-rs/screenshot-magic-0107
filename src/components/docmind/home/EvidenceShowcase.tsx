import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown, Check, ExternalLink, FileText, Sparkles, User } from "lucide-react";
import React from "react";

export function EvidenceShowcase() {
  const shouldReduceMotion = useReducedMotion();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.15,
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
    <section id="showcase" className="w-full py-16 sm:py-24 border-t border-border relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-3.5 py-1 rounded-full">
            Traceable AI
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-3.5">
            From Question to Evidence
          </h2>
          <p className="mt-2.5 text-base text-muted-foreground leading-relaxed">
            Never wonder where an answer came from. DocMind AI establishes a direct, verifiable
            chain of custody for every generated claim.
          </p>
        </motion.div>

        {/* 3-Step Verification Chain with Sequential Motion */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="mx-auto max-w-3xl space-y-4"
        >
          {/* Step 1: User Question */}
          <motion.div
            variants={itemVariants}
            className="flex items-start gap-3.5 rounded-2xl border border-border bg-white p-4 sm:p-5 shadow-2xs hover:shadow-card transition-shadow"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary border border-border">
              <User className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="font-display text-xs font-bold text-foreground">
                  1. User Query
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  Natural Language
                </span>
              </div>
              <p className="text-sm font-medium text-foreground">
                "What is the training methodology and optimizer setup described in the paper?"
              </p>
            </div>
          </motion.div>

          {/* Visual Step Connector 1 */}
          <motion.div variants={itemVariants} className="flex justify-center text-primary/70">
            <div className="inline-flex items-center gap-1 rounded-full bg-white border border-border px-3 py-0.5 text-[10px] font-mono shadow-2xs">
              <ArrowDown className="h-3.5 w-3.5 text-primary animate-bounce" />
              <span>Cosine Vector Search</span>
            </div>
          </motion.div>

          {/* Step 2: Grounded AI Response with Interactive Citation */}
          <motion.div
            variants={itemVariants}
            className="flex items-start gap-3.5 rounded-2xl border border-border bg-white p-4 sm:p-5 shadow-2xs hover:shadow-card transition-shadow"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-2xs">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-display text-xs font-bold text-foreground">
                  2. Grounded AI Response
                </span>
                <span className="font-mono text-[10px] text-evidence font-semibold bg-[#F4F6ED] px-2 py-0.5 rounded-full border border-[#A1AA68]/30">
                  Strictly Context-Bound
                </span>
              </div>
              <p className="text-sm text-[#242124] leading-relaxed">
                The authors used the Adam optimizer with β₁ = 0.9, β₂ = 0.98 and ε = 10⁻⁹. The
                learning rate was varied throughout training according to a warm-up schedule over
                the first 4,000 steps{" "}
                <span className="inline-flex items-center rounded-md border border-[#A1AA68] bg-[#F4F6ED] px-2 py-0.5 text-xs font-mono font-bold text-[#465324] shadow-2xs">
                  (p. 7)
                </span>
                .
              </p>
            </div>
          </motion.div>

          {/* Visual Step Connector 2 */}
          <motion.div variants={itemVariants} className="flex justify-center text-evidence">
            <div className="inline-flex items-center gap-1 rounded-full bg-white border border-[#A1AA68]/40 px-3 py-0.5 text-[10px] font-mono text-[#465324] shadow-2xs">
              <ArrowDown className="h-3.5 w-3.5 text-evidence animate-bounce" />
              <span>Inspect Source Evidence</span>
            </div>
          </motion.div>

          {/* Step 3: Verified Source Evidence Card connected to PDF Page */}
          <motion.div
            variants={itemVariants}
            className="rounded-2xl border-2 border-evidence bg-[#FAFBF7] p-5 sm:p-6 shadow-card ring-1 ring-evidence/30 transition-all hover:shadow-md"
          >
            <div className="flex items-center justify-between border-b border-[#A1AA68]/30 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-evidence text-white">
                  <Check className="h-3 w-3 stroke-[3]" />
                </span>
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#4E5629]">
                  3. Verified Source Evidence · Page 7
                </span>
              </div>
              <span className="font-mono text-xs font-bold text-[#4E5629] bg-[#F4F6ED] px-2.5 py-0.5 rounded-full border border-[#A1AA68]/40">
                98% Similarity Match
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 items-center">
              <div className="sm:col-span-2 space-y-2">
                <p className="text-xs text-muted-foreground uppercase font-mono tracking-wider">
                  Retrieved Chunk [p7_chunk_02]
                </p>
                <p className="text-xs sm:text-sm text-[#242124] leading-relaxed italic border-l-2 border-evidence pl-3">
                  "We trained the models on one machine with 8 NVIDIA P100 GPUs... We used the Adam
                  optimizer with β1 = 0.9, β2 = 0.98 and eps = 10-9. We varied the learning rate
                  over the course of training with 4,000 warmup steps."
                </p>
              </div>

              <div className="rounded-xl border border-border bg-white p-3.5 flex flex-col justify-between text-xs space-y-2.5 shadow-2xs">
                <div>
                  <div className="flex items-center gap-1.5 font-semibold text-foreground mb-1">
                    <FileText className="h-3.5 w-3.5 text-primary" />
                    <span>Target PDF Canvas</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Clicking citation instantly centers the viewer on page 7.
                  </p>
                </div>

                <button
                  type="button"
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white px-3 py-1.5 font-semibold text-xs transition-all shadow-xs cursor-pointer hover:-translate-y-0.5"
                >
                  <span>Open Page 7</span>
                  <ExternalLink className="h-3 w-3" />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
