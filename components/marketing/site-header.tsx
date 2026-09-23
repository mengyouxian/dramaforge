import Link from "next/link";
import { PRODUCT_NAME } from "@/lib/brand";
import type { Dictionary, Locale } from "@/lib/i18n";
import { LocaleSwitch } from "@/components/marketing/locale-switch";
import { Mark } from "@/components/mark";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SiteHeader({ locale, copy }: { locale: Locale; copy: Dictionary }) {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-5">
      <Link href={`/${locale}`} className="flex items-center gap-2 text-foreground">
        <Mark className="h-8 w-8" />
        <span className="font-serif text-xl tracking-tight">{PRODUCT_NAME}</span>
      </Link>
      <nav className="flex items-center gap-2 text-sm md:gap-4">
        <Link href={`/${locale}/pricing`} className="hidden text-muted-foreground hover:text-foreground sm:inline">
          {copy.nav.pricing}
        </Link>
        <LocaleSwitch label={copy.nav.language} />
        <Link href={`/${locale}/login`} className="px-2 text-muted-foreground hover:text-foreground">
          {copy.nav.login}
        </Link>
        <Link href={`/${locale}/register`} className={cn(buttonVariants({ size: "sm" }))}>
          {copy.nav.register}
        </Link>
      </nav>
    </header>
  );
}
