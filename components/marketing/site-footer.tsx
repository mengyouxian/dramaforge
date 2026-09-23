import Link from "next/link";
import { PRODUCT_NAME } from "@/lib/brand";
import type { Dictionary, Locale } from "@/lib/i18n";

export function SiteFooter({ locale, copy }: { locale: Locale; copy: Dictionary }) {
  return (
    <footer className="mx-auto mt-16 w-full max-w-6xl px-5 pb-10">
      <div className="flex flex-col gap-3 border-t pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          {PRODUCT_NAME} · {copy.footer.note}
        </p>
        <div className="flex gap-4">
          <Link href={`/${locale}/terms`} className="hover:text-foreground">
            {copy.footer.terms}
          </Link>
          <Link href={`/${locale}/privacy`} className="hover:text-foreground">
            {copy.footer.privacy}
          </Link>
          <Link href={`/${locale}/acceptable-use`} className="hover:text-foreground">
            {copy.footer.aup}
          </Link>
        </div>
      </div>
    </footer>
  );
}
