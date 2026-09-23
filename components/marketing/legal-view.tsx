import type { Dictionary, Locale } from "@/lib/i18n";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";

export function LegalView({
  locale,
  copy,
  title,
  paragraphs,
}: {
  locale: Locale;
  copy: Dictionary;
  title: string;
  paragraphs: string[];
}) {
  return (
    <div>
      <SiteHeader locale={locale} copy={copy} />
      <main className="mx-auto max-w-3xl px-5 py-10">
        <p className="text-xs text-muted-foreground">{copy.legal.updated}</p>
        <h1 className="mt-3 font-serif text-4xl">{title}</h1>
        <div className="mt-6 space-y-4 text-sm leading-7 text-foreground/90">
          {paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </main>
      <SiteFooter locale={locale} copy={copy} />
    </div>
  );
}
