import { NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse, requireUser } from "@/lib/api";
import { prisma } from "@/lib/db";
import { failIfTimedOut, scheduleJob } from "@/lib/jobs";
import type { AdaptMeta } from "@/lib/llm/types";

function present(job: {
  id: string;
  status: "queued" | "processing" | "succeeded" | "failed";
  sourceFilename: string;
  resultMarkdown: string | null;
  metaJson: unknown;
  errorMessage: string | null;
  creditsReserved: number;
  creditsCharged: number;
  createdAt: Date;
  optionsJson: unknown;
}) {
  return {
    id: job.id,
    status: job.status,
    sourceFilename: job.sourceFilename,
    resultMarkdown: job.resultMarkdown,
    meta: (job.metaJson as AdaptMeta | null) ?? null,
    errorMessage: job.errorMessage,
    creditsReserved: job.creditsReserved,
    creditsCharged: job.creditsCharged,
    createdAt: job.createdAt.toISOString(),
    options: job.optionsJson,
  };
}

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireUser();
  if (!user) return response;
  const { id } = await context.params;
  const job = await prisma.job.findFirst({ where: { id, userId: user.id } });
  if (!job) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (job.status === "queued") scheduleJob(job.id);
  if (job.status === "processing") await failIfTimedOut(job.id);
  const fresh = await prisma.job.findFirst({ where: { id, userId: user.id } });
  if (!fresh) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ job: present(fresh) });
}

const patchSchema = z.object({
  resultMarkdown: z.string().max(500_000),
});

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireUser();
  if (!user) return response;
  const { id } = await context.params;
  try {
    const body = patchSchema.parse(await req.json());
    const existing = await prisma.job.findFirst({ where: { id, userId: user.id } });
    if (!existing) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    if (existing.status !== "succeeded") {
      return NextResponse.json({ error: "JOB_NOT_READY" }, { status: 409 });
    }
    const job = await prisma.job.update({
      where: { id },
      data: { resultMarkdown: body.resultMarkdown },
    });
    return NextResponse.json({ job: present(job) });
  } catch (error) {
    return errorResponse(error);
  }
}
