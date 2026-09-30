import { motion, useReducedMotion } from "framer-motion";
import { BookmarkCheck, Database, FileSearch, ShieldCheck } from "lucide-react";
import React from "react";

const VALUES = [
  {
    num: "01",
    tag: "PAGE-AWARE",
    title: "Exact Page Tracking",
    desc: "Every chunk retains its original PDF page number for direct navigation.",
    icon: FileSearch,
  },
  {
    num: "02",
    tag: "GROUNDED",
    title: "Context-Bound Answers",
    desc: "Answers are generated strictly from retrieved passages, never generic assumptions.",
    icon: ShieldCheck,
  },
  {
    num: "03",
    tag: "VERIFIABLE",
    title: "Traceable Evidence",
    desc: "Click any inline citation to view the underlying passage with match confidence.",
    icon: BookmarkCheck,
  },
  {
    num: "04",
    tag: "LOCAL SEARCH",
    title: "In-Browser Vectors",
    desc: "Embeddings and cosine vector similarity run client-side in memory.",
    icon: Database,
  },
];

export function ValueStrip() {
  const shouldReduceMotion = useReducedMotion();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" as const },
    },
  };

  return (
    <section className="w-full py-8 border-y border-border bg-white/60 backdrop-blur-xs">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {VALUES.map((item) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.num}
                variants={cardVariants}
                className="group relative rounded-xl border border-border bg-white p-4 transition-all duration-150 hover:border-primary/40 hover:shadow-2xs hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-primary">{item.num}</span>
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 bg-secondary/60 px-2 py-0.5 rounded-full">
                    {item.tag}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon className="h-4 w-4 text-primary shrink-0" />
                  <h4 className="font-display text-sm font-bold text-foreground">{item.title}</h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
