import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api";

export async function GET() {
  const { user, response } = await requireUser();
  if (!user) return response;
  return NextResponse.json({
    id: user.id,
    email: user.email,
    plan: user.plan,
    creditBalance: user.creditBalance,
  });
}
