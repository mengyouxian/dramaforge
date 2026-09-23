import { randomUUID } from "crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { FAILURE_REFUND_RATIO, MAX_SOURCE_CHARS } from "@/lib/credits-math";
import { quoteJob } from "@/lib/credits";
import { getLlmProvider } from "@/lib/llm";
import type { AdaptOptions } from "@/lib/llm/types";
import { planAllowsMultiWorld, type PlanId } from "@/lib/plans";
import { extractText, type UploadExt } from "@/lib/parse-upload";
import { getStorage } from "@/lib/storage";

export class JobError extends Error {
  constructor(
    public code: string,
    public status: number,
    public extra?: Record<string, unknown>,
  ) {
    super(code);
  }
}

const TIMEOUT_MS = 10 * 60 * 1000;

function sourceKey(userId: string, jobId: string, ext: UploadExt) {
  return `uploads/${userId}/${jobId}/source.${ext}`;
}

function textKey(userId: string, jobId: string) {
  return `uploads/${userId}/${jobId}/extracted.txt`;
}

export function exportKey(userId: string, jobId: string, ext: string) {
  return `exports/${userId}/${jobId}/script.${ext}`;
}

export async function createJobForUser(input: {
  userId: string;
  plan: PlanId;
  filename: string;
  ext: UploadExt;
  bytes: Buffer;
  options: AdaptOptions;
}) {
  if (input.options.targetLanguage !== "en") {
    throw new JobError("LANGUAGE_NOT_AVAILABLE", 400);
  }
  if (input.options.multiWorld && !planAllowsMultiWorld(input.plan)) {
    throw new JobError("PLAN_REQUIRED", 403);
  }

  let text = "";
  try {
    text = (await extractText(input.bytes, input.ext)).replace(/\u0000/g, "").trim();
  } catch (error) {
    if (error instanceof Error && "code" in error) throw error;
    throw new JobError("PARSE_FAILED", 400);
  }
  if (!text) throw new JobError("EMPTY_TEXT", 400);
  if (text.length > MAX_SOURCE_CHARS) {
    throw new JobError("TEXT_TOO_LONG", 400, { limit: MAX_SOURCE_CHARS, length: text.length });
  }

  const cost = quoteJob(text.length, { multiWorld: input.options.multiWorld });
  const jobId = randomUUID();
  const storage = getStorage();
  const fileKey = sourceKey(input.userId, jobId, input.ext);
  const extractedKey = textKey(input.userId, jobId);

  await storage.put(fileKey, input.bytes);
  await storage.put(extractedKey, Buffer.from(text, "utf8"));

  try {
    const job = await prisma.$transaction(async (tx) => {
      const reserved = await tx.user.updateMany({
        where: { id: input.userId, creditBalance: { gte: cost } },
        data: { creditBalance: { decrement: cost } },
      });
      if (reserved.count !== 1) {
        const user = await tx.user.findUnique({ where: { id: input.userId } });
        throw new JobError("INSUFFICIENT_CREDITS", 402, {
          balance: user?.creditBalance ?? 0,
          required: cost,
        });
      }
      await tx.creditLedger.create({
        data: {
          userId: input.userId,
          delta: -cost,
          reason: "job_reserve",
          jobId,
        },
      });
      return tx.job.create({
        data: {
          id: jobId,
          userId: input.userId,
          status: "queued",
          sourceFilename: input.filename.slice(0, 200),
          sourceKey: fileKey,
          optionsJson: input.options as unknown as Prisma.InputJsonValue,
          creditsReserved: cost,
        },
      });
    });
    return job;
  } catch (error) {
    await storage.delete(fileKey).catch(() => undefined);
    await storage.delete(extractedKey).catch(() => undefined);
    throw error;
  }
}

async function refundFailed(job: { id: string; userId: string; creditsReserved: number }, code: string) {
  const refund = Math.floor(job.creditsReserved * FAILURE_REFUND_RATIO);
  await prisma.$transaction(async (tx) => {
    const flipped = await tx.job.updateMany({
      where: { id: job.id, status: "processing" },
      data: {
        status: "failed",
        errorMessage: code,
        creditsCharged: job.creditsReserved - refund,
      },
    });
    if (flipped.count !== 1 || refund <= 0) return;
    await tx.user.update({
      where: { id: job.userId },
      data: { creditBalance: { increment: refund } },
    });
    await tx.creditLedger.create({
      data: {
        userId: job.userId,
        delta: refund,
        reason: "job_refund",
        jobId: job.id,
      },
    });
  });
}

export async function processJob(jobId: string) {
  const claimed = await prisma.job.updateMany({
    where: { id: jobId, status: "queued" },
    data: { status: "processing" },
  });
  if (claimed.count !== 1) return;

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) return;

  try {
    const storage = getStorage();
    const raw = await storage.get(textKey(job.userId, job.id));
    const text = raw.toString("utf8");
    const options = job.optionsJson as AdaptOptions;
    const provider = getLlmProvider();
    const result = await provider.runAdaptPipeline({
      text,
      options,
      filename: job.sourceFilename,
    });

    await prisma.$transaction(async (tx) => {
      const flipped = await tx.job.updateMany({
        where: { id: job.id, status: "processing" },
        data: {
          status: "succeeded",
          resultMarkdown: result.markdown,
          metaJson: result.meta as unknown as Prisma.InputJsonValue,
          creditsCharged: job.creditsReserved,
          errorMessage: null,
        },
      });
      if (flipped.count !== 1) return;
      await tx.creditLedger.create({
        data: {
          userId: job.userId,
          delta: 0,
          reason: "job_settle",
          jobId: job.id,
        },
      });
    });
  } catch (error) {
    console.error("job pipeline failed", jobId, error);
    await refundFailed(job, "PIPELINE_FAILED");
  }
}

export async function failIfTimedOut(jobId: string) {
  const cutoff = new Date(Date.now() - TIMEOUT_MS);
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job || job.status !== "processing" || job.updatedAt > cutoff) return;
  await refundFailed(job, "TIMEOUT");
}

export function scheduleJob(jobId: string) {
  void processJob(jobId).catch((error) => {
    console.error("processJob", jobId, error);
  });
}
