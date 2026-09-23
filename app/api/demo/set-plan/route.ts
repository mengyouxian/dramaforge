import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/api";
import { isDemoMode, setDemoPlan } from "@/lib/credits";
import { rateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({
  plan: z.enum(["demo_pro", "demo_business"]),
});

export async function POST(req: Request) {
  if (!isDemoMode()) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  const { user, response } = await requireUser();
  if (!user) return response;
  if (!rateLimit(`plan:${user.id}`, 10, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
  }
  try {
    const body = bodySchema.parse(await req.json());
    const updated = await setDemoPlan(user.id, body.plan);
    return NextResponse.json({ plan: updated.plan, balance: updated.creditBalance });
  } catch {
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  }
}
