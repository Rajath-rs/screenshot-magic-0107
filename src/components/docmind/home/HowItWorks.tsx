import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, BrainCircuit, CheckCircle2, FileUp, MessageSquareText } from "lucide-react";
import React from "react";

const STEPS = [
  {
    step: "01",
    title: "Upload",
    desc: "Drop your PDF into DocMind. Extraction starts immediately in your browser with exact page tracking.",
    icon: FileUp,
    badge: "Client-side",
    hoverIcon: { y: -3 },
  },
  {
    step: "02",
    title: "Index",
    desc: "Text is partitioned into overlapping chunks, vectorized, and stored in client-side memory.",
    icon: BrainCircuit,
    badge: "Dense Vectors",
    hoverIcon: { rotate: 15 },
  },
  {
    step: "03",
    title: "Ask",
    desc: "Ask questions naturally. DocMind performs cosine search to retrieve the top relevant passages.",
    icon: MessageSquareText,
    badge: "Grounded RAG",
    hoverIcon: { scale: 1.1 },
  },
  {
    step: "04",
    title: "Verify",
    desc: "Click any inline (p. X) citation or evidence card to jump to and highlight the exact PDF page.",
    icon: CheckCircle2,
    badge: "Zero Guesswork",
    hoverIcon: { scale: 1.15, rotate: -5 },
  },
];

export function HowItWorks() {
  const shouldReduceMotion = useReducedMotion();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.12,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 25 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.55, ease: "easeOut" as const },
    },
  };

  return (
    <section id="how-it-works" className="w-full py-16 sm:py-24 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Section Heading */}
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-3.5 py-1 rounded-full">
            Process Architecture
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-3.5">
            How DocMind Works
          </h2>
          <p className="mt-2.5 text-base text-muted-foreground leading-relaxed">
            From raw document to auditable page evidence in four transparent, in-browser steps.
          </p>
        </motion.div>

        {/* Animated Horizontal Connector Line (Desktop only) */}
        <div className="hidden lg:block relative -mb-5 px-12 z-0">
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeInOut" }}
            className="h-[2px] bg-gradient-to-r from-primary/20 via-primary/50 to-primary/20 origin-left"
          />
        </div>

        {/* Steps Grid / Horizontal Flow */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10"
        >
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isLast = idx === STEPS.length - 1;

            return (
              <motion.div
                key={step.step}
                variants={itemVariants}
                className="relative rounded-2xl border border-border bg-white p-5 sm:p-6 shadow-2xs flex flex-col justify-between transition-all duration-200 hover:border-primary/50 hover:shadow-card hover:-translate-y-1 group"
              >
                <div>
                  {/* Step Header */}
                  <div className="flex items-center justify-between mb-4">
                    <motion.div
                      whileHover={shouldReduceMotion ? {} : step.hoverIcon}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white"
                    >
                      <Icon className="h-5 w-5" />
                    </motion.div>
                    <span className="font-mono text-sm font-bold text-muted-foreground/60">
                      {step.step}
                    </span>
                  </div>

                  {/* Title & Tag */}
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-display text-base font-bold text-foreground">
                      {step.title}
                    </h3>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-secondary text-primary">
                      {step.badge}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                {/* Arrow connector indicator on desktop */}
                {!isLast && (
                  <div className="hidden lg:flex items-center justify-end mt-4 pt-2 text-muted-foreground/40 group-hover:text-primary transition-colors">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
