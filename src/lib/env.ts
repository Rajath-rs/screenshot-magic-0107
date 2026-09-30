// Centralized environment and AI configuration helper

try {
  if (typeof process !== "undefined" && typeof process.loadEnvFile === "function") {
    process.loadEnvFile();
  }
} catch {
  // .env is optional or loaded externally
}

export type AiProvider = "openrouter" | "lovable";

export interface AiConfig {
  provider: AiProvider;
  apiKey: string;
  embeddingModel: string;
  chatModel: string;
}

export function getAiConfig(): AiConfig | null {
  const openRouterKey = process.env["OPENROUTER_API_KEY"]?.trim();
  if (openRouterKey) {
    return {
      provider: "openrouter",
      apiKey: openRouterKey,
      embeddingModel:
        process.env["OPENROUTER_EMBEDDING_MODEL"]?.trim() ||
        "openai/text-embedding-3-small",
      chatModel:
        process.env["OPENROUTER_CHAT_MODEL"]?.trim() || "openai/gpt-4o-mini",
    };
  }

  const lovableKey = process.env["LOVABLE_API_KEY"]?.trim();
  if (lovableKey) {
    return {
      provider: "lovable",
      apiKey: lovableKey,
      embeddingModel: "google/gemini-embedding-2",
      chatModel: "openai/gpt-6-astra",
    };
  }

  return null;
}
