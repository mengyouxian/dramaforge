import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api";
import {
  DEFAULT_CREDITS_PER_1K,
  EXPORT_CREDITS,
  FAILURE_REFUND_RATIO,
  MIN_JOB_CREDITS,
} from "@/lib/credits-math";
import { creditsPer1k } from "@/lib/credits";
import { prisma } from "@/lib/db";

export async function GET() {
  const { user, response } = await requireUser();
  if (!user) return response;
  const ledger = await prisma.creditLedger.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return NextResponse.json({
    balance: user.creditBalance,
    plan: user.plan,
    ledger: ledger.map((row) => ({
      id: row.id,
      delta: row.delta,
      reason: row.reason,
      jobId: row.jobId,
      createdAt: row.createdAt.toISOString(),
    })),
    pricing: {
      per1kChars: creditsPer1k(),
      defaultPer1kChars: DEFAULT_CREDITS_PER_1K,
      minimum: MIN_JOB_CREDITS,
      failureRefundRatio: FAILURE_REFUND_RATIO,
      exportCredits: EXPORT_CREDITS,
      placeholder: true,
    },
  });
}
