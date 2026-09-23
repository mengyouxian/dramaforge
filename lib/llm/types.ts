export type TargetLanguage = "en" | "zh" | "de" | "fr" | "es";

export type AdaptOptions = {
  targetLanguage: TargetLanguage;
  characterMapping: boolean;
  culturalAdapt: boolean;
  multiWorld: boolean;
};

export type CharacterRow = {
  sourceName: string;
  enName: string;
  role: string;
};

export type GlossaryRow = {
  source: string;
  en: string;
  note: string;
};

export type OutlineBeat = {
  id: string;
  summary: string;
};

export type WorldSlot = {
  id: string;
  title: string;
  status: "full_draft" | "title_only";
  summary: string;
};

export type AdaptMeta = {
  provider: "seed" | "openai_compatible";
  pipeline: string[];
  outline: OutlineBeat[];
  characters: CharacterRow[];
  glossary: GlossaryRow[];
  marketNote: string;
  worlds?: WorldSlot[];
  usage: { inputTokens: number; outputTokens: number };
};

export type AdaptResult = {
  markdown: string;
  meta: AdaptMeta;
  usage: { inputTokens: number; outputTokens: number };
};

export interface LlmProvider {
  runAdaptPipeline(input: { text: string; options: AdaptOptions; filename: string }): Promise<AdaptResult>;
}

export const PIPELINE_STEPS = [
  "parse_and_outline",
  "characters_and_glossary",
  "cultural_adapt",
  "format_short_drama_script",
] as const;

export function stubWorlds(primaryTitle: string): WorldSlot[] {
  return [
    {
      id: "primary",
      title: primaryTitle,
      status: "full_draft",
      summary: "The full draft is the script on this page.",
    },
    {
      id: "alt-1",
      title: "Neon Contract City",
      status: "title_only",
      summary: "Title slot only. This demo writes one full draft, not four.",
    },
    {
      id: "alt-2",
      title: "Northern Rail Dynasty",
      status: "title_only",
      summary: "Title slot only. Compare drafts land in a later release.",
    },
    {
      id: "alt-3",
      title: "Glass Conservatory",
      status: "title_only",
      summary: "Title slot only. The slot is here so the Business entry is visible.",
    },
  ];
}
