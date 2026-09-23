import { notFound } from "next/navigation";
import { JobWorkspace, type JobView } from "@/components/workspace/job-workspace";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getDictionary } from "@/lib/i18n";
import type { AdaptMeta } from "@/lib/llm/types";
import { getRequestLocale } from "@/lib/locale";

export const dynamic = "force-dynamic";

export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = await getRequestLocale();
  const copy = getDictionary(locale);
  const user = await getCurrentUser();
  if (!user) return null;
  const job = await prisma.job.findFirst({ where: { id, userId: user.id } });
  if (!job) notFound();
  const view: JobView = {
    id: job.id,
    status: job.status,
    sourceFilename: job.sourceFilename,
    resultMarkdown: job.resultMarkdown,
    meta: (job.metaJson as AdaptMeta | null) ?? null,
    errorMessage: job.errorMessage,
    creditsReserved: job.creditsReserved,
    creditsCharged: job.creditsCharged,
    createdAt: job.createdAt.toISOString(),
  };
  return <JobWorkspace initial={view} copy={copy.app} locale={locale} />;
}
