import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getDictionary } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/locale";
import { formatCredits, formatWhen } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const locale = await getRequestLocale();
  const copy = getDictionary(locale).app;
  const user = await getCurrentUser();
  if (!user) return null;
  const jobs = await prisma.job.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-4xl">{copy.dashboard}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{user.email}</p>
        </div>
        <Link href="/app/jobs/new" className={cn(buttonVariants())}>
          {copy.newJob}
        </Link>
      </div>
      <h2 className="mt-10 font-serif text-2xl">{copy.recent}</h2>
      {jobs.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{copy.empty}</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-lg border bg-card">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">{copy.filename}</th>
                <th className="px-4 py-3 font-medium">{copy.status}</th>
                <th className="px-4 py-3 font-medium">{copy.reserved}</th>
                <th className="px-4 py-3 font-medium">{copy.created}</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="border-b last:border-0">
                  <td className="px-4 py-3">{job.sourceFilename}</td>
                  <td className="px-4 py-3">
                    <Badge variant={job.status === "succeeded" ? "ready" : job.status === "failed" ? "warn" : "default"}>
                      {copy.statuses[job.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{formatCredits(job.creditsReserved, locale)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatWhen(job.createdAt, locale)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/app/jobs/${job.id}`} className="underline-offset-4 hover:underline">
                      {copy.open}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
