import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
import { AuthForm } from "@/components/auth-form";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { getDictionary, isLocale } from "@/lib/i18n";
import { safeNextPath } from "@/lib/api";

export default async function RegisterPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  if (!isLocale(locale)) notFound();
  const copy = getDictionary(locale);
  return (
    <div>
      <SiteHeader locale={locale} copy={copy} />
      <main className="mx-auto max-w-md px-5 py-12">
        <h1 className="font-serif text-4xl">{copy.auth.registerTitle}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{copy.auth.lede}</p>
        <AuthForm locale={locale} copy={copy} mode="register" nextPath={safeNextPath(query.next)} />
      </main>
      <SiteFooter locale={locale} copy={copy} />
    </div>
  );
}
