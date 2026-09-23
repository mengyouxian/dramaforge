import type { ReactNode } from "react";
import Link from "next/link";
import { PRODUCT_NAME } from "@/lib/brand";
import type { Dictionary, Locale } from "@/lib/i18n";
import { Mark } from "@/components/mark";
import { Balance } from "@/components/workspace/balance";
import { LogoutButton } from "@/components/workspace/logout-button";

export function Shell({
  locale,
  copy,
  balance,
  children,
}: {
  locale: Locale;
  copy: Dictionary["app"];
  balance: number;
  children: ReactNode;
}) {
  const links = [
    { href: "/app", label: copy.dashboard },
    { href: "/app/jobs/new", label: copy.newJob },
    { href: "/app/account", label: copy.account },
  ];
  return (
    <div className="min-h-screen">
      <header className="border-b bg-card/80">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <Link href="/app" className="mr-2 flex items-center gap-2">
            <Mark className="h-7 w-7" />
            <span className="font-serif text-lg">{PRODUCT_NAME}</span>
          </Link>
          <nav className="flex flex-1 flex-wrap gap-1 text-sm">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="rounded-md px-3 py-2 hover:bg-secondary">
                {link.label}
              </Link>
            ))}
          </nav>
          <Balance initial={balance} label={copy.balance} locale={locale} />
          <LogoutButton label={copy.logout} locale={locale} />
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
    </div>
  );
}
