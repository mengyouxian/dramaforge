"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Dictionary, Locale } from "@/lib/i18n";
import type { PlanId } from "@/lib/plans";
import { formatCredits, formatWhen } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type LedgerRow = {
  id: string;
  delta: number;
  reason: string;
  createdAt: string;
};

export function AccountPanel({
  locale,
  copy,
  email,
  plan,
  balance,
  demoMode,
  ledger,
}: {
  locale: Locale;
  copy: Dictionary["app"];
  email: string;
  plan: PlanId;
  balance: number;
  demoMode: boolean;
  ledger: LedgerRow[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  async function post(url: string, body: unknown, ok: string, key: string) {
    setPending(key);
    setMessage(null);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setPending(null);
    if (!res.ok) {
      setMessage(copy.demoOff);
      return;
    }
    setMessage(ok);
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-4xl">{copy.accountTitle}</h1>
        <dl className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border bg-card p-4">
            <dt className="text-xs text-muted-foreground">{copy.email}</dt>
            <dd className="mt-1 break-all text-sm">{email}</dd>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <dt className="text-xs text-muted-foreground">{copy.plan}</dt>
            <dd className="mt-1 text-sm">{copy.plans[plan]}</dd>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <dt className="text-xs text-muted-foreground">{copy.balance}</dt>
            <dd className="mt-1 font-serif text-2xl tabular-nums">{formatCredits(balance, locale)}</dd>
          </div>
        </dl>
      </div>

      <section className="rounded-lg border bg-card p-5">
        <p className="text-sm leading-6">{demoMode ? copy.demoNote : copy.billing}</p>
        <p className="mt-2 text-sm text-muted-foreground">{copy.billing}</p>
        {demoMode ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <Button disabled={pending !== null} onClick={() => post("/api/demo/grant-credits", { amount: 150000 }, copy.granted, "grant")}>
              {pending === "grant" ? copy.working : copy.grant}
            </Button>
            <Button variant="outline" disabled={pending !== null} onClick={() => post("/api/demo/set-plan", { plan: "demo_pro" }, copy.planSet, "pro")}>
              {copy.simPro}
            </Button>
            <Button variant="outline" disabled={pending !== null} onClick={() => post("/api/demo/set-plan", { plan: "demo_business" }, copy.planSet, "business")}>
              {copy.simBusiness}
            </Button>
          </div>
        ) : (
          <p className="mt-3 text-sm">{copy.demoOff}</p>
        )}
        {message ? <p className="mt-3 text-sm">{message}</p> : null}
      </section>

      <section>
        <h2 className="font-serif text-2xl">{copy.ledger}</h2>
        {ledger.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">{copy.noLedger}</p>
        ) : (
          <ul className="mt-3 divide-y rounded-lg border bg-card">
            {ledger.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <div>
                  <p>{copy.reasons[row.reason as keyof typeof copy.reasons] ?? row.reason}</p>
                  <p className="text-xs text-muted-foreground">{formatWhen(row.createdAt, locale)}</p>
                </div>
                <span className="tabular-nums">
                  {row.delta > 0 ? "+" : ""}
                  {formatCredits(row.delta, locale)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
