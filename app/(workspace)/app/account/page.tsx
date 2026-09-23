import { AccountPanel } from "@/components/workspace/account-panel";
import { getCurrentUser } from "@/lib/auth";
import { isDemoMode } from "@/lib/credits";
import { prisma } from "@/lib/db";
import { getDictionary } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/locale";
import type { PlanId } from "@/lib/plans";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const locale = await getRequestLocale();
  const copy = getDictionary(locale).app;
  const user = await getCurrentUser();
  if (!user) return null;
  const ledger = await prisma.creditLedger.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 12,
  });
  const jobs = await prisma.job.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <div className="space-y-10">
      <AccountPanel
        locale={locale}
        copy={copy}
        email={user.email}
        plan={user.plan as PlanId}
        balance={user.creditBalance}
        demoMode={isDemoMode()}
        ledger={ledger.map((row) => ({
          id: row.id,
          delta: row.delta,
          reason: row.reason,
          createdAt: row.createdAt.toISOString(),
        }))}
      />
      <section>
        <h2 className="font-serif text-2xl">{copy.recent}</h2>
        {jobs.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">{copy.empty}</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {jobs.map((job) => (
              <li key={job.id}>
                <a className="underline-offset-4 hover:underline" href={`/app/jobs/${job.id}`}>
                  {job.sourceFilename}
                </a>
                <span className="text-muted-foreground"> · {copy.statuses[job.status]}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
