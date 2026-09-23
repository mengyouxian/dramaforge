"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function LocaleSwitch({ label }: { label: string }) {
  const pathname = usePathname() || "/en";
  const next = pathname.startsWith("/zh") ? pathname.replace(/^\/zh/, "/en") : pathname.replace(/^\/en/, "/zh");
  return (
    <Link href={next} className="px-2 text-muted-foreground hover:text-foreground">
      {label}
    </Link>
  );
}
