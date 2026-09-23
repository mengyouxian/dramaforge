import { after } from "next/server";
import { NextResponse } from "next/server";
import { errorResponse, requireUser } from "@/lib/api";
import { prisma } from "@/lib/db";
import { createJobForUser, processJob } from "@/lib/jobs";
import { parseOptions } from "@/lib/options";
import { assertUpload } from "@/lib/parse-upload";
import type { PlanId } from "@/lib/plans";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET() {
  const { user, response } = await requireUser();
  if (!user) return response;
  const jobs = await prisma.job.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({
    jobs: jobs.map((job) => ({
      id: job.id,
      status: job.status,
      sourceFilename: job.sourceFilename,
      creditsReserved: job.creditsReserved,
      creditsCharged: job.creditsCharged,
      createdAt: job.createdAt.toISOString(),
      errorMessage: job.errorMessage,
    })),
  });
}

export async function POST(req: Request) {
  const { user, response } = await requireUser();
  if (!user) return response;
  if (!rateLimit(`job:${user.id}`, 8, 60 * 1000)) {
    return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
  }
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "FILE_REQUIRED" }, { status: 400 });
    }
    const ext = assertUpload({ name: file.name, type: file.type, size: file.size });
    const options = parseOptions(JSON.parse(String(form.get("options") || "{}")));
    const bytes = Buffer.from(await file.arrayBuffer());
    const job = await createJobForUser({
      userId: user.id,
      plan: user.plan as PlanId,
      filename: file.name || `upload.${ext}`,
      ext,
      bytes,
      options,
    });
    after(() => processJob(job.id));
    return NextResponse.json({
      job: {
        id: job.id,
        status: job.status,
        creditsReserved: job.creditsReserved,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
