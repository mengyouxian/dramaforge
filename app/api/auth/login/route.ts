import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyLogin } from "@/lib/auth";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { sessionCookieOptions, signSession, SESSION_COOKIE } from "@/lib/session";

const bodySchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(72),
});

export async function POST(req: Request) {
  if (!rateLimit(clientKey(req, "login"), 30, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
  }
  try {
    const body = bodySchema.parse(await req.json());
    const user = await verifyLogin(body.email.toLowerCase(), body.password);
    if (!user) {
      return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
    }
    const token = await signSession(user.id);
    const jar = await cookies();
    jar.set(SESSION_COOKIE, token, sessionCookieOptions());
    return NextResponse.json({ id: user.id, email: user.email });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
  }
}
