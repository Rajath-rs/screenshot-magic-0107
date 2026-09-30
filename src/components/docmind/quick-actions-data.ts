import {
  AlertTriangle,
  BookmarkCheck,
  FlaskConical,
  Sparkles,
  Target,
} from "lucide-react";
import type { ComponentType } from "react";

export type QuickActionItem = {
  id: string;
  label: string;
  loadingLabel: string;
  icon: ComponentType<{ className?: string }>;
  prompt: string;
  description: string;
  isPrimary?: boolean;
};

export const QUICK_ACTIONS: QuickActionItem[] = [
  {
    id: "summarize",
    label: "Summarize Document",
    loadingLabel: "Summarizing...",
    icon: Sparkles,
    prompt:
      "Provide a comprehensive structured summary of this document covering: 1) Main purpose, 2) Methodology, 3) Major findings, 4) Important results, and 5) Limitations or risks. Cite the supporting page numbers inline like (p. X).",
    description: "Generate a structured summary of the entire document.",
    isPrimary: true,
  },
  {
    id: "objective",
    label: "Main Objective",
    loadingLabel: "Analyzing Objective...",
    icon: Target,
    prompt:
      "What is the main objective or central goal of this document? Cite the supporting page numbers inline like (p. X).",
    description: "Identify the primary purpose and objective of the document.",
    isPrimary: false,
  },
  {
    id: "methodology",
    label: "Methodology",
    loadingLabel: "Examining Methods...",
    icon: FlaskConical,
    prompt:
      "What methodology, technical approach, or procedure was used in this document? Cite the relevant pages.",
    description: "Explain the methods, techniques, or approach described in the document.",
    isPrimary: false,
  },
  {
    id: "findings",
    label: "Key Findings",
    loadingLabel: "Extracting Findings...",
    icon: BookmarkCheck,
    prompt:
      "List the primary key findings, conclusions, and notable data points from this document with page citations.",
    description: "Extract the most important findings and results.",
    isPrimary: false,
  },
  {
    id: "limitations",
    label: "Limitations & Risks",
    loadingLabel: "Assessing Risks...",
    icon: AlertTriangle,
    prompt:
      "What limitations, assumptions, risks, or caveats are mentioned in this document? Cite the pages.",
    description: "Identify limitations, risks, constraints, and weaknesses mentioned in the document.",
    isPrimary: false,
  },
];
