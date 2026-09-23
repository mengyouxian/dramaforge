import { MAX_UPLOAD_BYTES } from "@/lib/credits-math";

export type UploadExt = "pdf" | "docx" | "txt";

const MIME: Record<UploadExt, string[]> = {
  pdf: ["application/pdf"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  txt: ["text/plain"],
};

export class UploadError extends Error {
  constructor(
    public code: string,
    public status: number,
  ) {
    super(code);
  }
}

export function assertUpload(file: { name: string; type: string; size: number }): UploadExt {
  if (file.size <= 0) throw new UploadError("EMPTY_FILE", 400);
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError("FILE_TOO_LARGE", 413);

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext !== "pdf" && ext !== "docx" && ext !== "txt") {
    throw new UploadError("UNSUPPORTED_TYPE", 415);
  }

  const mime = (file.type || "").toLowerCase();
  const loose = mime === "" || mime === "application/octet-stream";
  if (!loose && !MIME[ext].includes(mime)) {
    throw new UploadError("UNSUPPORTED_TYPE", 415);
  }

  return ext;
}

export async function extractText(bytes: Buffer, ext: UploadExt) {
  if (ext === "txt") {
    const text = bytes.toString("utf8").replace(/^\uFEFF/, "");
    return text;
  }
  if (ext === "docx") {
    if (bytes.length < 4 || bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
      throw new UploadError("UNSUPPORTED_TYPE", 415);
    }
    const mammothMod = await import("mammoth");
    const mammoth = (mammothMod.default ?? mammothMod) as typeof mammothMod;
    const result = await mammoth.extractRawText({ buffer: bytes });
    return result.value || "";
  }
  if (bytes.length < 5 || bytes.subarray(0, 5).toString("utf8") !== "%PDF-") {
    throw new UploadError("UNSUPPORTED_TYPE", 415);
  }
  const mod = await import("pdf-parse/lib/pdf-parse.js");
  const pdfParse = (mod.default ?? mod) as (data: Buffer) => Promise<{ text?: string }>;
  const result = await pdfParse(bytes);
  return result.text || "";
}
