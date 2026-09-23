import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api";
import { prisma } from "@/lib/db";
import { exportKey } from "@/lib/jobs";
import { getStorage } from "@/lib/storage";

const TYPES: Record<string, string> = {
  txt: "text/plain; charset=utf-8",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pdf: "application/pdf",
};

export const runtime = "nodejs";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireUser();
  if (!user) return response;
  const { id } = await context.params;
  const format = new URL(req.url).searchParams.get("format") || "";
  if (!TYPES[format]) return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  const job = await prisma.job.findFirst({ where: { id, userId: user.id } });
  if (!job) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (job.status !== "succeeded") {
    return NextResponse.json({ error: "JOB_NOT_READY" }, { status: 409 });
  }
  try {
    const bytes = await getStorage().get(exportKey(user.id, job.id, format));
    const filename = `dramaforge-script.${format}`;
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": TYPES[format],
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "JOB_NOT_READY" }, { status: 404 });
  }
}
