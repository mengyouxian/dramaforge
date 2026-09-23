import { prisma } from "@/lib/db";
import {
  DEFAULT_CREDITS_PER_1K,
  estimateCredits,
  type EstimateOptions,
} from "@/lib/credits-math";
import { PLAN_CREDITS, type PlanId } from "@/lib/plans";

export function creditsPer1k() {
  const raw = Number(process.env.CREDITS_PER_1K_INPUT_CHARS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_CREDITS_PER_1K;
}

export function quoteJob(inputChars: number, options: EstimateOptions) {
  return estimateCredits(inputChars, options, creditsPer1k());
}

export async function grantCredits(userId: string, amount: number, reason: string) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("INVALID_AMOUNT");
  }
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: userId },
      data: { creditBalance: { increment: amount } },
    });
    await tx.creditLedger.create({
      data: { userId, delta: amount, reason },
    });
    return user;
  });
}

export async function setDemoPlan(userId: string, plan: "demo_pro" | "demo_business") {
  const target = PLAN_CREDITS[plan];
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("NOT_FOUND");
    const delta = Math.max(0, target - user.creditBalance);
    const updated = await tx.user.update({
      where: { id: userId },
      data: {
        plan,
        ...(delta > 0 ? { creditBalance: { increment: delta } } : {}),
      },
    });
    if (delta > 0) {
      await tx.creditLedger.create({
        data: { userId, delta, reason: "plan_grant" },
      });
    }
    return updated;
  });
}

export function isDemoMode() {
  return process.env.DEMO_MODE === "true";
}

export type { PlanId };
