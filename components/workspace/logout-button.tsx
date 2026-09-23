"use client";

import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export function LogoutButton({ label, locale }: { label: string; locale: Locale }) {
  const router = useRouter();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push(`/${locale}`);
        router.refresh();
      }}
    >
      {label}
    </Button>
  );
}
