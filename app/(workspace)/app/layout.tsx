import { redirect } from "next/navigation";
import { Shell } from "@/components/workspace/shell";
import { getCurrentUser } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/locale";

export const dynamic = "force-dynamic";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const locale = await getRequestLocale();
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login?next=/app`);
  }
  const copy = getDictionary(locale);
  return (
    <Shell locale={locale} copy={copy.app} balance={user.creditBalance}>
      {children}
    </Shell>
  );
}
