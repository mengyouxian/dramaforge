import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { PLAN_CREDITS } from "@/lib/plans";
import { readSession, SESSION_COOKIE } from "@/lib/session";

const DUMMY_HASH = "$2a$10$ZOaRW/VZq.cewKxJCoYFMu9WYZ702pZ3zTGmudGj.WSPodlASKYP.";

export async function getCurrentUser() {
  const jar = await cookies();
  const userId = await readSession(jar.get(SESSION_COOKIE)?.value);
  if (!userId) return null;
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      plan: true,
      creditBalance: true,
      createdAt: true,
    },
  });
}

export async function registerUser(email: string, password: string) {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
        plan: "free",
        creditBalance: PLAN_CREDITS.free,
      },
    });
    await tx.creditLedger.create({
      data: {
        userId: user.id,
        delta: PLAN_CREDITS.free,
        reason: "plan_grant",
      },
    });
    return user;
  });
}

export async function verifyLogin(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  const hash = user?.passwordHash || DUMMY_HASH;
  const ok = await bcrypt.compare(password, hash);
  if (!user?.passwordHash || !ok) return null;
  return user;
}
