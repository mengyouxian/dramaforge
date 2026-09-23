import { NewJobForm } from "@/components/workspace/new-job-form";
import { getCurrentUser } from "@/lib/auth";
import { creditsPer1k } from "@/lib/credits";
import { getDictionary } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/locale";
import type { PlanId } from "@/lib/plans";

export const dynamic = "force-dynamic";

export default async function NewJobPage() {
  const locale = await getRequestLocale();
  const copy = getDictionary(locale).app;
  const user = await getCurrentUser();
  if (!user) return null;
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-serif text-4xl">{copy.newTitle}</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{copy.newLede}</p>
      <div className="mt-8">
        <NewJobForm
          locale={locale}
          copy={copy}
          balance={user.creditBalance}
          plan={user.plan as PlanId}
          per1k={creditsPer1k()}
        />
      </div>
    </div>
  );
}
