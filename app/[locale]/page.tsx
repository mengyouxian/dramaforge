import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HomeView } from "@/components/marketing/home-view";
import { PRODUCT_NAME, tagline } from "@/lib/brand";
import { getDictionary, isLocale } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return {
    title: PRODUCT_NAME,
    description: tagline(locale),
  };
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <HomeView locale={locale} copy={getDictionary(locale)} />;
}
