"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { formatCredits } from "@/lib/utils";

export function Balance({
  initial,
  label,
  locale,
}: {
  initial: number;
  label: string;
  locale: Locale;
}) {
  const [value, setValue] = useState(initial);

  useEffect(() => {
    setValue(initial);
  }, [initial]);

  useEffect(() => {
    let stop = false;
    async function tick() {
      const res = await fetch("/api/credits");
      if (!res.ok) return;
      const data = (await res.json()) as { balance?: number };
      if (!stop && typeof data.balance === "number") setValue(data.balance);
    }
    const id = window.setInterval(tick, 4000);
    return () => {
      stop = true;
      window.clearInterval(id);
    };
  }, []);

  return (
    <div className="rounded-full border bg-card px-3 py-1 text-sm">
      <span className="text-muted-foreground">{label}</span>{" "}
      <span className="font-medium tabular-nums">{formatCredits(value, locale)}</span>
    </div>
  );
}
