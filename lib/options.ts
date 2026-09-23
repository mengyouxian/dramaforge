import { z } from "zod";
import type { AdaptOptions } from "@/lib/llm/types";

const schema = z.object({
  targetLanguage: z.enum(["en", "zh", "de", "fr", "es"]).default("en"),
  characterMapping: z.boolean().default(true),
  culturalAdapt: z.boolean().default(true),
  multiWorld: z.boolean().default(false),
});

export function parseOptions(input: unknown): AdaptOptions {
  const parsed = schema.parse(input ?? {});
  return parsed;
}
