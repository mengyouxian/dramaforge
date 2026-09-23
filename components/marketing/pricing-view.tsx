import Link from "next/link";
import { PUBLIC_PLANS } from "@/lib/plans";
import type { Dictionary, Locale } from "@/lib/i18n";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { Button } from "@/components/ui/button";
import { formatCredits } from "@/lib/utils";

export function PricingView({ locale, copy }: { locale: Locale; copy: Dictionary }) {
  return (
    <div>
      <SiteHeader locale={locale} copy={copy} />
      <main className="mx-auto max-w-6xl px-5 py-10">
        <p className="text-xs uppercase tracking-[0.22em] text-primary">{copy.pricing.soon}</p>
        <h1 className="mt-3 font-serif text-4xl sm:text-5xl">{copy.pricing.title}</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">{copy.pricing.lede}</p>
        <p className="mt-4 max-w-3xl rounded-md border border-primary/30 bg-primary/5 px-4 py-3 text-sm leading-6">
          {copy.pricing.disclaimer}
        </p>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {PUBLIC_PLANS.map((plan) => {
            const featured = plan.id === "pro";
            return (
              <article
                key={plan.id}
                className={`flex flex-col rounded-lg border bg-card p-6 ${featured ? "ring-2 ring-primary" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-3xl">{copy.pricing.names[plan.id]}</h2>
                  {featured ? <span className="text-xs uppercase tracking-wider text-primary">{copy.pricing.popular}</span> : null}
                </div>
                <p className="mt-4 font-serif text-4xl">
                  {plan.price}
                  <span className="ml-1 text-base text-muted-foreground">
                    {plan.period === "month" ? copy.pricing.perMonth : ""}
                  </span>
                </p>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{copy.pricing.blurbs[plan.id]}</p>
                {plan.credits ? (
                  <p className="mt-2 text-sm">
                    ≈ {formatCredits(plan.credits, locale)} · {plan.period === "once" ? copy.pricing.once : copy.pricing.perMonth}
                  </p>
                ) : null}
                <ul className="mt-5 flex-1 space-y-2 text-sm">
                  {copy.pricing.points[plan.id].map((point) => (
                    <li key={point} className="border-t pt-2">
                      {point}
                    </li>
                  ))}
                </ul>
                <Button asChild className="mt-6" variant={featured ? "default" : "outline"}>
                  <Link href={`/${locale}/register`}>{copy.pricing.cta}</Link>
                </Button>
              </article>
            );
          })}
        </div>
      </main>
      <SiteFooter locale={locale} copy={copy} />
    </div>
  );
}
