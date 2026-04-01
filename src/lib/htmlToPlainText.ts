/**
 * Convert stored rich-text HTML to plain text for LLM API calls and empty checks.
 * User segments may contain TipTap HTML; AI segments are plain.
 */
export function htmlToPlainText(html: string): string {
  if (!html || typeof html !== "string") return "";
  const trimmed = html.trim();
  if (!trimmed.includes("<")) return trimmed;

  let s = trimmed;
  s = s.replace(/<img[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi, "\n[Image: $1]\n");
  s = s.replace(/<\/(p|div|h[1-6]|blockquote)>/gi, "\n\n");
  s = s.replace(/<br\s*\/?>/gi, "\n");
  s = s.replace(/<li>/gi, "• ");
  s = s.replace(/<\/li>/gi, "\n");
  s = s.replace(/<[^>]+>/g, "");
  s = s.replace(/&nbsp;/g, " ");
  s = s.replace(/&amp;/g, "&");
  s = s.replace(/&lt;/g, "<");
  s = s.replace(/&gt;/g, ">");
  s = s.replace(/&quot;/g, '"');
  s = s.replace(/&#39;/g, "'");
  s = s.replace(/\n{3,}/g, "\n\n");
  return s.replace(/[ \t]+\n/g, "\n").trim();
}

export function isRichInputEmpty(html: string): boolean {
  return htmlToPlainText(html).length === 0;
}
