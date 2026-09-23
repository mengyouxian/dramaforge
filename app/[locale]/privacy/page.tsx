import { notFound } from "next/navigation";
import { LegalView } from "@/components/marketing/legal-view";
import { getDictionary, isLocale } from "@/lib/i18n";

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const copy = getDictionary(locale);
  return <LegalView locale={locale} copy={copy} title={copy.legal.privacyTitle} paragraphs={copy.privacy} />;
}
