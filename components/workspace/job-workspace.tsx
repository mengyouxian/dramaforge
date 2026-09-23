"use client";

import { useEffect, useState } from "react";
import type { Dictionary, Locale } from "@/lib/i18n";
import type { AdaptMeta } from "@/lib/llm/types";
import { formatCredits, formatWhen } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export type JobView = {
  id: string;
  status: "queued" | "processing" | "succeeded" | "failed";
  sourceFilename: string;
  resultMarkdown: string | null;
  meta: AdaptMeta | null;
  errorMessage: string | null;
  creditsReserved: number;
  creditsCharged: number;
  createdAt: string;
};

const panels = ["script", "outline", "characters", "glossary", "worlds"] as const;
type Panel = (typeof panels)[number];

export function JobWorkspace({ initial, copy, locale }: { initial: JobView; copy: Dictionary["app"]; locale: Locale }) {
  const [job, setJob] = useState(initial);
  const [draft, setDraft] = useState(initial.resultMarkdown ?? "");
  const [panel, setPanel] = useState<Panel>("script");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [exporting, setExporting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (job.status === "succeeded" || job.status === "failed") return;
    const id = window.setInterval(async () => {
      const res = await fetch(`/api/jobs/${job.id}`);
      if (!res.ok) return;
      const data = (await res.json()) as { job: JobView };
      setJob(data.job);
      if (data.job.status === "succeeded") setDraft(data.job.resultMarkdown ?? "");
    }, 1000);
    return () => window.clearInterval(id);
  }, [job.id, job.status]);

  async function save() {
    setSaveState("saving");
    setError(null);
    const res = await fetch(`/api/jobs/${job.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resultMarkdown: draft }),
    });
    setSaveState(res.ok ? "saved" : "idle");
    if (!res.ok) setError(copy.notReady);
  }

  async function exportAs(format: "txt" | "docx" | "pdf") {
    setExporting(format);
    setError(null);
    const res = await fetch(`/api/jobs/${job.id}/export`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ format }),
    });
    const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
    setExporting(null);
    if (!res.ok || !data.url) {
      setError(data.error === "JOB_NOT_READY" ? copy.notReady : copy.errors.INTERNAL);
      return;
    }
    window.location.href = data.url;
  }

  const meta = job.meta;
  const badgeVariant = job.status === "succeeded" ? "ready" : job.status === "failed" ? "warn" : "default";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-serif text-3xl">{job.sourceFilename}</h1>
            <Badge variant={badgeVariant}>{copy.statuses[job.status]}</Badge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {formatWhen(job.createdAt, locale)} · {copy.reserved} {formatCredits(job.creditsReserved, locale)}
          </p>
        </div>
      </div>

      {job.status === "queued" || job.status === "processing" ? (
        <div className="rounded-lg border bg-card p-5">
          <p className="text-sm">{copy.pipeline}</p>
          <p className="mt-2 text-xs text-muted-foreground">{copy.statuses.processing}</p>
        </div>
      ) : null}

      {job.status === "failed" ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm leading-6">
          <p>{job.errorMessage === "TIMEOUT" ? copy.timeout : copy.failedNote}</p>
        </div>
      ) : null}

      {job.status === "succeeded" ? (
        <>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{meta?.provider === "openai_compatible" ? copy.providerModel : copy.providerSeed}</Badge>
            {panels
              .filter((name) => name !== "worlds" || (meta?.worlds && meta.worlds.length > 0))
              .map((name) => (
                <Button key={name} size="sm" variant={panel === name ? "default" : "outline"} onClick={() => setPanel(name)}>
                  {copy[name]}
                </Button>
              ))}
          </div>

          {panel === "script" ? (
            <div className="space-y-3">
              <Textarea value={draft} onChange={(event) => { setDraft(event.target.value); setSaveState("idle"); }} className="min-h-[420px] font-serif leading-7" />
              <div className="flex flex-wrap gap-2">
                <Button onClick={save} disabled={saveState === "saving"}>
                  {saveState === "saving" ? copy.saving : saveState === "saved" ? copy.saved : copy.save}
                </Button>
                <Button variant="outline" onClick={() => exportAs("txt")} disabled={Boolean(exporting)}>
                  {exporting === "txt" ? copy.exporting : copy.exportTxt}
                </Button>
                <Button variant="outline" onClick={() => exportAs("docx")} disabled={Boolean(exporting)}>
                  {exporting === "docx" ? copy.exporting : copy.exportDocx}
                </Button>
                <Button variant="outline" onClick={() => exportAs("pdf")} disabled={Boolean(exporting)}>
                  {exporting === "pdf" ? copy.exporting : copy.exportPdf}
                </Button>
              </div>
            </div>
          ) : null}

          {panel === "outline" ? (
            <ol className="space-y-3">
              {(meta?.outline ?? []).map((beat) => (
                <li key={beat.id} className="rounded-lg border bg-card p-4 text-sm leading-6">
                  <span className="text-xs text-primary">{beat.id}</span>
                  <p className="mt-1">{beat.summary}</p>
                </li>
              ))}
            </ol>
          ) : null}

          {panel === "characters" ? (
            <ul className="space-y-3">
              {(meta?.characters ?? []).map((row) => (
                <li key={`${row.sourceName}-${row.enName}`} className="rounded-lg border bg-card p-4 text-sm">
                  <p className="font-medium">{row.enName}</p>
                  <p className="text-muted-foreground">
                    {row.sourceName} · {row.role}
                  </p>
                </li>
              ))}
            </ul>
          ) : null}

          {panel === "glossary" ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{meta?.marketNote}</p>
              <ul className="space-y-3">
                {(meta?.glossary ?? []).map((row) => (
                  <li key={`${row.source}-${row.en}`} className="rounded-lg border bg-card p-4 text-sm">
                    <p className="font-medium">
                      {row.source} → {row.en}
                    </p>
                    <p className="text-muted-foreground">{row.note}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {panel === "worlds" ? (
            <ul className="space-y-3">
              {(meta?.worlds ?? []).map((world) => (
                <li key={world.id} className="rounded-lg border bg-card p-4 text-sm">
                  <p className="font-medium">{world.title}</p>
                  <p className="text-xs uppercase tracking-wide text-primary">{world.status}</p>
                  <p className="mt-1 text-muted-foreground">{world.summary}</p>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
