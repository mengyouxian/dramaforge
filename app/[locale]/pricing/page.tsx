import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PricingView } from "@/components/marketing/pricing-view";
import { getDictionary, isLocale } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: getDictionary(locale).pricing.title };
}

export default async function PricingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <PricingView locale={locale} copy={getDictionary(locale)} />;
}
