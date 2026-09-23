import { pinyin } from "pinyin-pro";
import type { AdaptOptions, AdaptResult, CharacterRow, GlossaryRow, LlmProvider, OutlineBeat } from "@/lib/llm/types";
import { PIPELINE_STEPS, stubWorlds } from "@/lib/llm/types";

const STOP = new Set([
  "一个", "我们", "他们", "她们", "自己", "什么", "没有", "不是", "这个", "那个",
  "可以", "因为", "所以", "如果", "但是", "然后", "已经", "还是", "就是", "这样",
  "怎么", "知道", "时候", "现在", "开始", "一样", "出来", "看到", "听到", "觉得",
  "心里", "眼前", "突然", "终于", "原来", "虽然", "不过", "而且", "只是", "不能",
  "不会", "不要", "一起", "一直", "一下", "今天", "明天", "昨天", "这里", "那里",
  "为什么", "怎么会", "不知道", "一个人", "的时候", "以后", "之前", "里面", "外面",
]);

const TERM_BOOK: GlossaryRow[] = [
  { source: "修仙", en: "cultivation", note: "Gloss once. Show the cost, skip the manual." },
  { source: "灵气", en: "ambient qi", note: "Keep qi. Explain it with weather or breath." },
  { source: "师父", en: "mentor", note: "Soften the kinship ladder unless the plot turns on it." },
  { source: "师兄", en: "senior", note: "Use a personal name after the first address." },
  { source: "师妹", en: "junior", note: "Same as senior: name first, rank second." },
  { source: "宗门", en: "sect", note: "An academy or a house also reads cleanly in English." },
  { source: "丹药", en: "elixir", note: "A prop. Do not write it like medicine advertising." },
  { source: "法宝", en: "relic", note: "Name the object. Avoid a catalogue tone." },
  { source: "渡劫", en: "tribulation", note: "Stage the ordeal. Do not pause to define it." },
  { source: "江湖", en: "the circuit", note: "The traveling world of favors, debts, and fights." },
  { source: "丞相", en: "chancellor", note: "A court job. Keep the politics in the scene." },
  { source: "陛下", en: "Your Majesty", note: "Use it rarely, then switch to the name." },
  { source: "公子", en: "young lord", note: "Prefer the personal name after the introduction." },
  { source: "小姐", en: "miss", note: "Use only if the status gap matters." },
  { source: "内力", en: "inner force", note: "Show it as breath, balance, or a blow." },
  { source: "轻功", en: "lightness", note: "Footwork, roofs, and silence. Skip the textbook." },
];

const ROOMS = [
  "INT. UNMARKED ROOM — DAY",
  "EXT. RAIN ALLEY — NIGHT",
  "INT. HARBOR TEAHOUSE — EVENING",
  "INT. STAIRWELL — NIGHT",
  "EXT. ROOFTOP — DAWN",
  "INT. NIGHT TRAIN — CONTINUOUS",
  "EXT. COURTYARD GATE — DAY",
  "INT. BACK OFFICE — NIGHT",
];

function romanize(han: string) {
  const parts = pinyin(han, { toneType: "none", type: "array" });
  return parts.map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function paragraphs(text: string) {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .slice(0, 8);
}

function extractNames(text: string): string[] {
  const counts = new Map<string, number>();
  const re = /[\u4e00-\u9fff]{2,3}/g;
  for (const match of text.matchAll(re)) {
    const token = match[0];
    if (STOP.has(token)) continue;
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name]) => name);
}

function titleFrom(filename: string) {
  const base = filename.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
  return base || "Untitled source";
}

function dialogueBits(paragraph: string) {
  const bits = [...paragraph.matchAll(/[「“"]([^」”"]{1,80})[」”"]/g)].map((m) => m[1].trim());
  return bits.slice(0, 2);
}

export class SeedProvider implements LlmProvider {
  async runAdaptPipeline(input: {
    text: string;
    options: AdaptOptions;
    filename: string;
  }): Promise<AdaptResult> {
    await new Promise((resolve) => setTimeout(resolve, 600));

    const beats = paragraphs(input.text);
    const outline: OutlineBeat[] = (beats.length ? beats : ["(empty beat)"]).map((summary, index) => ({
      id: String(index + 1),
      summary: summary.slice(0, 180),
    }));

    const names = extractNames(input.text);
    const characters: CharacterRow[] = (
      names.length
        ? names
        : []
    ).map((sourceName, index) => ({
      sourceName,
      enName: input.options.characterMapping ? romanize(sourceName) : sourceName,
      role: index === 0 ? "Lead" : index === 1 ? "Pressure" : "Supporting",
    }));

    if (characters.length === 0) {
      characters.push(
        { sourceName: "叙述者", enName: "NARRATOR", role: "Lead" },
        { sourceName: "对手", enName: "RIVAL", role: "Pressure" },
      );
    }

    const glossary = TERM_BOOK.filter((row) => input.text.includes(row.source));
    const marketNote = input.options.culturalAdapt
      ? "English-market pass: keep the power shift, name people early, and let objects carry the world. Honorifics are softened."
      : "Cultural adaptation was turned off. Names and terms stay closer to the source.";

    const title = titleFrom(input.filename);
    const lead = characters[0];
    const worlds = input.options.multiWorld ? stubWorlds(title) : undefined;

    const sceneBlocks = outline.map((beat, index) => {
      const speaker = characters[index % characters.length];
      const quotes = dialogueBits(beat.summary);
      const lines = [
        `### Scene ${index + 1} — ${ROOMS[index % ROOMS.length]}`,
        "",
        `Action: ${speaker.enName} enters the beat. Keep the turn; rewrite the prose into playable action.`,
        "",
      ];
      if (quotes.length) {
        for (const quote of quotes) {
          lines.push(speaker.enName.toUpperCase(), quote, "");
        }
      } else {
        lines.push(
          speaker.enName.toUpperCase(),
          "Hold the source line below. Give me a line I can say in one breath.",
          "",
        );
      }
      lines.push(`> Source beat ${beat.id}: ${beat.summary}`, "");
      return lines.join("\n");
    });

    const glossaryTable = glossary.length
      ? ["| Source | English | Note |", "| --- | --- | --- |", ...glossary.map((row) => `| ${row.source} | ${row.en} | ${row.note} |`)].join("\n")
      : "_No listed terms found in this upload. Add your own in the editor._";

    const characterLines = characters
      .map((row) => `- **${row.enName.toUpperCase()}** — source ${row.sourceName}. ${row.role}.`)
      .join("\n");

    const markdown = [
      `# ${title}`,
      "",
      "_Seed draft. No live model was called. Target language: English._",
      "",
      "## Logline",
      `${lead.enName} is pushed through ${outline.length} short-drama beats adapted from “${title}”. The draft keeps the source turns and leaves the English lines ready to rewrite.`,
      "",
      "## Characters",
      characterLines,
      "",
      "## Glossary",
      glossaryTable,
      "",
      "## Market pass",
      marketNote,
      "",
      worlds
        ? [
            "## Worldview slots",
            ...worlds.map((world) => `- **${world.title}** (${world.status}) — ${world.summary}`),
            "",
          ].join("\n")
        : "",
      "## Episode 1",
      "",
      sceneBlocks.join("\n"),
    ]
      .filter((part) => part !== "")
      .join("\n");

    const usage = {
      inputTokens: Math.ceil(input.text.length / 2),
      outputTokens: Math.ceil(markdown.length / 2),
    };

    return {
      markdown,
      usage,
      meta: {
        provider: "seed",
        pipeline: [...PIPELINE_STEPS],
        outline,
        characters,
        glossary,
        marketNote,
        worlds,
        usage,
      },
    };
  }
}
