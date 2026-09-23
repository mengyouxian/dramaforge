import fs from "fs";
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import PDFDocument from "pdfkit";
import { PRODUCT_NAME } from "@/lib/brand";

const FONT_CANDIDATES = [
  process.env.PDF_FONT_PATH,
  "/usr/share/fonts/truetype/droid/DroidSansFallbackFull.ttf",
  "/usr/share/fonts/truetype/wqy/wqy-microhei.ttc",
].filter((value): value is string => Boolean(value));

function resolvePdfFont() {
  for (const candidate of FONT_CANDIDATES) {
    if (candidate.endsWith(".ttc")) continue;
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function heading(line: string) {
  if (line.startsWith("### ")) return { level: HeadingLevel.HEADING_3, text: line.slice(4) };
  if (line.startsWith("## ")) return { level: HeadingLevel.HEADING_2, text: line.slice(3) };
  if (line.startsWith("# ")) return { level: HeadingLevel.HEADING_1, text: line.slice(2) };
  return null;
}

export async function markdownToDocx(markdown: string) {
  const children = markdown.split(/\r?\n/).map((line) => {
    const head = heading(line);
    if (head) {
      return new Paragraph({ text: head.text, heading: head.level });
    }
    return new Paragraph({
      children: [new TextRun(line.replace(/\*\*/g, ""))],
    });
  });
  const doc = new Document({
    sections: [{ children: children.length ? children : [new Paragraph("")] }],
  });
  return Packer.toBuffer(doc);
}

function pdfBuffer(doc: PDFKit.PDFDocument) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}

export async function markdownToPdf(markdown: string) {
  const font = resolvePdfFont();
  const doc = new PDFDocument({ margin: 56, size: "A4" });
  const done = pdfBuffer(doc);
  if (font) {
    doc.font(font);
  } else {
    doc.font("Times-Roman");
  }
  const body = font ? markdown : markdown.replace(/[^\n\r\t\x20-\x7E]/g, "□");
  doc.fontSize(10).fillColor("#666666").text(`${PRODUCT_NAME} export`, { align: "right" });
  doc.moveDown(0.6);
  doc.fontSize(11).fillColor("#1c1915").text(body, { lineGap: 3 });
  doc.end();
  return done;
}

export function markdownToTxt(markdown: string) {
  return Buffer.from(markdown, "utf8");
}
