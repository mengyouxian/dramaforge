import type { AdaptMeta, AdaptOptions, AdaptResult, LlmProvider } from "@/lib/llm/types";
import { PIPELINE_STEPS, stubWorlds } from "@/lib/llm/types";

type ChatUsage = { inputTokens: number; outputTokens: number };

function parseLooseJson(raw: string): Record<string, unknown> {
  const trimmed = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start < 0 || end <= start) {
    throw new Error("LLM_BAD_JSON");
  }
  return JSON.parse(trimmed.slice(start, end + 1)) as Record<string, unknown>;
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export class OpenAICompatibleProvider implements LlmProvider {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
    private readonly model: string,
  ) {}

  private async chat(system: string, user: string, maxTokens: number): Promise<{ content: string; usage: ChatUsage }> {
    const response = await fetch(`${this.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.4,
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`LLM_HTTP_${response.status}:${detail.slice(0, 300)}`);
    }
    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    return {
      content: data.choices?.[0]?.message?.content ?? "",
      usage: {
        inputTokens: data.usage?.prompt_tokens ?? 0,
        outputTokens: data.usage?.completion_tokens ?? 0,
      },
    };
  }

  async runAdaptPipeline(input: {
    text: string;
    options: AdaptOptions;
    filename: string;
  }): Promise<AdaptResult> {
    const source = input.text.slice(0, 100_000);
    const flags = JSON.stringify(input.options);
    let inputTokens = 0;
    let outputTokens = 0;

    const outlineCall = await this.chat(
      "You are a short-drama story editor. Reply with JSON only: {\"beats\":[{\"id\":\"1\",\"summary\":\"...\"}]}. 4 to 8 beats. No prose outside JSON.",
      `Filename: ${input.filename}\nOptions: ${flags}\n\nSource:\n${source}`,
      900,
    );
    inputTokens += outlineCall.usage.inputTokens;
    outputTokens += outlineCall.usage.outputTokens;
    const outlineJson = parseLooseJson(outlineCall.content);

    const castCall = await this.chat(
      "You map characters and terms for an overseas short drama. Reply with JSON only: {\"characters\":[{\"sourceName\":\"\",\"enName\":\"\",\"role\":\"\"}],\"glossary\":[{\"source\":\"\",\"en\":\"\",\"note\":\"\"}]}.",
      `Options: ${flags}\nOutline JSON:\n${JSON.stringify(outlineJson)}\n\nSource:\n${source}`,
      900,
    );
    inputTokens += castCall.usage.inputTokens;
    outputTokens += castCall.usage.outputTokens;
    const castJson = parseLooseJson(castCall.content);

    const adaptCall = await this.chat(
      "You adapt culture and worldview for an English-language short-drama audience unless options say otherwise. Reply with JSON only: {\"notes\":\"...\",\"glossary\":[{\"source\":\"\",\"en\":\"\",\"note\":\"\"}]}. Do not write the full script.",
      `Options: ${flags}\nGlossary so far:\n${JSON.stringify(castJson.glossary ?? [])}\n\nSource excerpt:\n${source.slice(0, 8000)}`,
      900,
    );
    inputTokens += adaptCall.usage.inputTokens;
    outputTokens += adaptCall.usage.outputTokens;
    const adaptJson = parseLooseJson(adaptCall.content);

    const scriptCall = await this.chat(
      "Write one overseas short-drama script in Markdown. Use sluglines, character cues, and short dialogue. Reply with JSON only: {\"markdown\":\"...\"}. One episode. Do not invent extra full drafts.",
      `Filename: ${input.filename}\nOptions: ${flags}\nOutline: ${JSON.stringify(outlineJson)}\nCharacters: ${JSON.stringify(castJson.characters ?? [])}\nMarket notes: ${String(adaptJson.notes ?? "")}\n\nSource:\n${source}`,
      3500,
    );
    inputTokens += scriptCall.usage.inputTokens;
    outputTokens += scriptCall.usage.outputTokens;

    let markdown = "";
    try {
      const scriptJson = parseLooseJson(scriptCall.content);
      markdown = String(scriptJson.markdown ?? "");
    } catch {
      markdown = scriptCall.content.trim();
    }
    if (!markdown.trim()) {
      throw new Error("LLM_EMPTY_SCRIPT");
    }

    const title = input.filename.replace(/\.[^.]+$/, "") || "Untitled source";
    const glossary = asArray<{ source?: string; en?: string; note?: string }>(
      adaptJson.glossary ?? castJson.glossary,
    ).map((row) => ({
      source: String(row.source ?? ""),
      en: String(row.en ?? ""),
      note: String(row.note ?? ""),
    }));
    const characters = asArray<{ sourceName?: string; enName?: string; role?: string }>(castJson.characters).map(
      (row) => ({
        sourceName: String(row.sourceName ?? ""),
        enName: String(row.enName ?? ""),
        role: String(row.role ?? ""),
      }),
    );
    const outline = asArray<{ id?: string; summary?: string }>(outlineJson.beats).map((beat, index) => ({
      id: String(beat.id ?? index + 1),
      summary: String(beat.summary ?? ""),
    }));

    const usage = { inputTokens, outputTokens };
    const meta: AdaptMeta = {
      provider: "openai_compatible",
      pipeline: [...PIPELINE_STEPS],
      outline,
      characters,
      glossary,
      marketNote: String(adaptJson.notes ?? ""),
      worlds: input.options.multiWorld ? stubWorlds(title) : undefined,
      usage,
    };

    return { markdown, meta, usage };
  }
}
