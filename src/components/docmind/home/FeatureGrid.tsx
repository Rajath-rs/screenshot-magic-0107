import { motion, useReducedMotion } from "framer-motion";
import {
  Compass,
  FileCheck2,
  FileSearch,
  MessageSquareShare,
  Microscope,
  ShieldAlert,
} from "lucide-react";
import React from "react";

const FEATURES = [
  {
    title: "Evidence-Grounded Answers",
    desc: "Every response is anchored in real passages retrieved from your uploaded PDF, rather than speculative model training weights.",
    icon: Microscope,
    highlight: "Grounded RAG",
  },
  {
    title: "Exact Page Citations",
    desc: "Interactive (p. X) badges appear inline alongside generated claims, providing immediate clarity on which pages support each finding.",
    icon: FileCheck2,
    highlight: "Page Auditability",
  },
  {
    title: "Interactive Evidence Jump",
    desc: "One click on any citation or evidence card smoothly navigates the embedded PDF viewer and highlights the relevant passage.",
    icon: Compass,
    highlight: "Instant Navigation",
  },
  {
    title: "Contextual Follow-Ups",
    desc: "Automatically receive three document-grounded follow-up suggestions after each answer to naturally deepen your inquiry.",
    icon: MessageSquareShare,
    highlight: "Smart Exploration",
  },
  {
    title: "Local In-Memory Vector Search",
    desc: "Embeddings and cosine similarity calculations run entirely client-side in browser memory without third-party vector databases.",
    icon: FileSearch,
    highlight: "Zero Database Overhead",
  },
  {
    title: "Hallucination Mitigation",
    desc: "When requested information is absent from the uploaded document, the system explicitly reports it rather than inventing unsupported facts.",
    icon: ShieldAlert,
    highlight: "Trust Boundaries",
  },
];

export function FeatureGrid() {
  const shouldReduceMotion = useReducedMotion();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.08,
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
    <section
      id="features"
      className="w-full py-16 sm:py-24 bg-white/70 border-t border-border relative"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-evidence bg-[#F4F6ED] border border-[#A1AA68]/45 px-3.5 py-1 rounded-full">
            Core Capabilities
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-3.5">
            Why DocMind?
          </h2>
          <p className="mt-2.5 text-base text-muted-foreground leading-relaxed">
            Built specifically for researchers, analysts, and students who demand verifiable
            accuracy over generic chatbots.
          </p>
        </motion.div>

        {/* Feature Cards Grid (3 columns on desktop, 2 on tablet, 1 on mobile) */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {FEATURES.map((feat) => {
            const Icon = feat.icon;

            return (
              <motion.div
                key={feat.title}
                variants={itemVariants}
                className="group relative rounded-2xl border border-border bg-white p-5 sm:p-6 shadow-2xs transition-all duration-200 hover:border-primary/50 hover:shadow-card hover:-translate-y-1 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all duration-150 group-hover:scale-105 group-hover:bg-primary group-hover:text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-mono text-[10px] font-semibold text-muted-foreground/80 bg-secondary px-2.5 py-0.5 rounded-full">
                      {feat.highlight}
                    </span>
                  </div>

                  <h3 className="font-display text-base font-bold text-foreground mb-2">
                    {feat.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
