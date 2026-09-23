/** Single source for the product name. Import this instead of hard-coding the brand. */
export const PRODUCT_NAME = "DramaForge";

export const TAGLINE_EN =
  "DramaForge helps you adapt Chinese stories into overseas short-drama scripts—upload, adapt, edit, export.";

export const TAGLINE_ZH =
  "DramaForge：把中文故事，锻成海外短剧剧本。上传、改编、编辑、导出。";

export function tagline(locale: "en" | "zh") {
  return locale === "zh" ? TAGLINE_ZH : TAGLINE_EN;
}
