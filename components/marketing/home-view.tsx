import Link from "next/link";
import { tagline } from "@/lib/brand";
import type { Dictionary, Locale } from "@/lib/i18n";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { Button } from "@/components/ui/button";

export function HomeView({ locale, copy }: { locale: Locale; copy: Dictionary }) {
  return (
    <div>
      <SiteHeader locale={locale} copy={copy} />
      <main>
        <section className="mx-auto grid max-w-6xl items-end gap-10 px-5 pb-8 pt-8 md:grid-cols-[1.15fr_0.85fr] md:pt-16">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-primary">{copy.hero.kicker}</p>
            <h1 className="mt-4 max-w-xl text-balance font-serif text-4xl leading-[1.15] text-foreground sm:text-6xl">
              {copy.hero.title}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">{tagline(locale)}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href={`/${locale}/register`}>{copy.hero.primary}</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href={`/${locale}/pricing`}>{copy.hero.secondary}</Link>
              </Button>
            </div>
          </div>
          <figure className="rounded-lg border bg-card p-6 shadow-stamp">
            <figcaption className="mb-3 flex items-baseline justify-between gap-3">
              <span className="font-serif text-xl">{copy.sketchTitle}</span>
              <span className="text-xs text-muted-foreground">{copy.sketchCaption}</span>
            </figcaption>
            <pre className="whitespace-pre-wrap font-serif text-sm leading-7 text-foreground">{copy.sketch}</pre>
          </figure>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-12">
          <h2 className="font-serif text-3xl">{copy.stepsTitle}</h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {copy.steps.map((step) => (
              <li key={step.n} className="rounded-lg border bg-card p-5">
                <p className="text-xs tracking-[0.18em] text-primary">{step.n}</p>
                <h3 className="mt-3 font-serif text-2xl">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-6">
          <h2 className="font-serif text-3xl">{copy.featuresTitle}</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {copy.features.map((feature) => (
              <article key={feature.title} className="rounded-lg border bg-card/70 p-5">
                <h3 className="font-serif text-2xl">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-12">
          <div className="flex flex-col items-start justify-between gap-4 rounded-lg bg-accent px-6 py-8 text-accent-foreground md:flex-row md:items-center">
            <div>
              <h2 className="font-serif text-3xl">{copy.teaserTitle}</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-accent-foreground/80">{copy.teaserBody}</p>
            </div>
            <Button asChild variant="secondary" size="lg">
              <Link href={`/${locale}/pricing`}>{copy.teaserCta}</Link>
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter locale={locale} copy={copy} />
    </div>
  );
}
