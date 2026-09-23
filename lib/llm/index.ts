import type { LlmProvider } from "@/lib/llm/types";
import { OpenAICompatibleProvider } from "@/lib/llm/openai";
import { SeedProvider } from "@/lib/llm/seed";

export function getLlmProvider(): LlmProvider {
  const mode = (process.env.LLM_PROVIDER || "seed").toLowerCase();
  const apiKey = process.env.LLM_API_KEY?.trim();
  if (mode === "seed" || !apiKey) {
    return new SeedProvider();
  }
  return new OpenAICompatibleProvider(
    process.env.LLM_BASE_URL || "https://api.openai.com/v1",
    apiKey,
    process.env.LLM_MODEL || "gpt-4o-mini",
  );
}
