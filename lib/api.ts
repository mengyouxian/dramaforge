import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { JobError } from "@/lib/jobs";
import { UploadError } from "@/lib/parse-upload";

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) return { user: null, response: NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 }) };
  return { user, response: null };
}

export function errorResponse(error: unknown) {
  if (error instanceof JobError) {
    return NextResponse.json({ error: error.code, ...error.extra }, { status: error.status });
  }
  if (error instanceof UploadError) {
    return NextResponse.json({ error: error.code }, { status: error.status });
  }
  if (error instanceof ZodError) {
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  }
  console.error(error);
  return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
}

export function safeNextPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/app") || value.startsWith("//")) return "/app";
  return value;
}
