"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { MAX_UPLOAD_BYTES, MIN_JOB_CREDITS } from "@/lib/credits-math";
import type { Dictionary, Locale } from "@/lib/i18n";
import { fill } from "@/lib/i18n";
import { planAllowsMultiWorld, type PlanId } from "@/lib/plans";
import { formatCredits } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function NewJobForm({
  locale,
  copy,
  balance,
  plan,
  per1k,
}: {
  locale: Locale;
  copy: Dictionary["app"];
  balance: number;
  plan: PlanId;
  per1k: number;
}) {
  const router = useRouter();
  const blocked = balance < MIN_JOB_CREDITS;
  const [file, setFile] = useState<File | null>(null);
  const [characterMapping, setCharacterMapping] = useState(true);
  const [culturalAdapt, setCulturalAdapt] = useState(true);
  const [multiWorld, setMultiWorld] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const multiOk = planAllowsMultiWorld(plan);

  const formula = useMemo(
    () => fill(copy.formula, { min: formatCredits(MIN_JOB_CREDITS, locale), per: formatCredits(per1k, locale) }),
    [copy.formula, locale, per1k],
  );

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!file) {
      setError(copy.errors.FILE_REQUIRED);
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError(copy.errors.FILE_TOO_LARGE);
      return;
    }
    setPending(true);
    const body = new FormData();
    body.set("file", file);
    body.set(
      "options",
      JSON.stringify({
        targetLanguage: "en",
        characterMapping,
        culturalAdapt,
        multiWorld: multiOk && multiWorld,
      }),
    );
    const res = await fetch("/api/jobs", { method: "POST", body });
    const data = (await res.json().catch(() => ({}))) as { error?: string; job?: { id: string }; balance?: number; required?: number };
    setPending(false);
    if (!res.ok) {
      const code = data.error ?? "INTERNAL";
      const template = copy.errors[code as keyof typeof copy.errors] ?? copy.errors.INTERNAL;
      setError(fill(template, { balance: data.balance ?? balance, required: data.required ?? "" }));
      return;
    }
    router.push(`/app/jobs/${data.job?.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {blocked ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4">
          <h2 className="font-serif text-2xl">{copy.blockedTitle}</h2>
          <p className="mt-2 text-sm leading-6">
            {fill(copy.blockedBody, {
              balance: formatCredits(balance, locale),
              min: formatCredits(MIN_JOB_CREDITS, locale),
            })}
          </p>
        </div>
      ) : null}
      <p className="text-sm leading-6 text-muted-foreground">{formula}</p>
      <div className="space-y-2">
        <Label htmlFor="file">{copy.file}</Label>
        <input
          id="file"
          name="file"
          type="file"
          accept=".pdf,.docx,.txt,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          disabled={blocked || pending}
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2"
        />
        <p className="text-xs text-muted-foreground">{copy.fileHint}</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="language">{copy.language}</Label>
        <select id="language" disabled className="h-10 w-full rounded-md border bg-card px-3 text-sm" defaultValue="en">
          <option value="en">English</option>
          <option value="de">Deutsch ({copy.coming})</option>
          <option value="fr">Français ({copy.coming})</option>
          <option value="es">Español ({copy.coming})</option>
        </select>
        <p className="text-xs text-muted-foreground">{copy.languageHint}</p>
      </div>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" className="mt-1" checked={characterMapping} onChange={(e) => setCharacterMapping(e.target.checked)} />
        <span>{copy.mapping}</span>
      </label>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" className="mt-1" checked={culturalAdapt} onChange={(e) => setCulturalAdapt(e.target.checked)} />
        <span>{copy.cultural}</span>
      </label>
      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          className="mt-1"
          checked={multiOk && multiWorld}
          disabled={!multiOk}
          onChange={(e) => setMultiWorld(e.target.checked)}
        />
        <span>
          {copy.multi}
          {multiOk ? null : <span className="mt-1 block text-xs text-muted-foreground">{copy.multiLocked}</span>}
        </span>
      </label>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={blocked || pending}>
        {pending ? copy.working : copy.submit}
      </Button>
    </form>
  );
}
