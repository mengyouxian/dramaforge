import { NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse, requireUser } from "@/lib/api";
import { prisma } from "@/lib/db";
import { markdownToDocx, markdownToPdf, markdownToTxt } from "@/lib/export-doc";
import { exportKey } from "@/lib/jobs";
import { getStorage } from "@/lib/storage";

const bodySchema = z.object({
  format: z.enum(["txt", "docx", "pdf"]),
});

export const runtime = "nodejs";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireUser();
  if (!user) return response;
  const { id } = await context.params;
  try {
    const body = bodySchema.parse(await req.json());
    const job = await prisma.job.findFirst({ where: { id, userId: user.id } });
    if (!job) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    if (job.status !== "succeeded" || !job.resultMarkdown) {
      return NextResponse.json({ error: "JOB_NOT_READY" }, { status: 409 });
    }
    const markdown = job.resultMarkdown;
    const bytes =
      body.format === "txt"
        ? markdownToTxt(markdown)
        : body.format === "docx"
          ? await markdownToDocx(markdown)
          : await markdownToPdf(markdown);
    const key = exportKey(user.id, job.id, body.format);
    await getStorage().put(key, bytes);
    return NextResponse.json({
      url: `/api/jobs/${job.id}/download?format=${body.format}`,
      format: body.format,
      credits: 0,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
