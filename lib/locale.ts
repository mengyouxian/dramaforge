import { cookies } from "next/headers";
import type { Locale } from "@/lib/i18n";
import { LOCALE_COOKIE } from "@/lib/session";

export async function getRequestLocale(): Promise<Locale> {
  const jar = await cookies();
  return jar.get(LOCALE_COOKIE)?.value === "zh" ? "zh" : "en";
}
