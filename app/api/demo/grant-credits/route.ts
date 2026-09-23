import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/api";
import { DEMO_GRANT_AMOUNT } from "@/lib/credits-math";
import { grantCredits, isDemoMode } from "@/lib/credits";
import { rateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({
  amount: z.number().int().positive().max(2_000_000).optional(),
});

export async function POST(req: Request) {
  if (!isDemoMode()) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  const { user, response } = await requireUser();
  if (!user) return response;
  if (!rateLimit(`grant:${user.id}`, 8, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
  }
  try {
    const json = await req.json().catch(() => ({}));
    const body = bodySchema.parse(json);
    const amount = body.amount ?? DEMO_GRANT_AMOUNT;
    const updated = await grantCredits(user.id, amount, "demo_grant");
    return NextResponse.json({ balance: updated.creditBalance, granted: amount });
  } catch {
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  }
}
