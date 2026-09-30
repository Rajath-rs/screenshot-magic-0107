import { motion, useReducedMotion } from "framer-motion";
import { BrainCircuit } from "lucide-react";
import React from "react";

export function HomeFooter() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <footer className="border-t border-border bg-surface/50 py-8 px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4"
      >
        {/* Left: Brand info */}
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg bg-primary/10 p-1.5 text-primary">
            <BrainCircuit className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-sm font-bold text-foreground">DocMind AI</span>
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                v1.0
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Grounded Document Intelligence with Page Evidence
            </p>
          </div>
        </div>

        {/* Center / Right: Capabilities statement */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground text-center sm:text-right">
          <span>Page-aware extraction</span>
          <span className="hidden sm:inline text-border">•</span>
          <span>Local vector search</span>
          <span className="hidden sm:inline text-border">•</span>
          <span>Evidence-grounded answers</span>
        </div>
      </motion.div>
    </footer>
  );
}
