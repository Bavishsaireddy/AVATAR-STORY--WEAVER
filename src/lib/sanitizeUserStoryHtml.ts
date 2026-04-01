import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "s",
  "strike",
  "del",
  "u",
  "ul",
  "ol",
  "li",
  "blockquote",
  "img",
];

/** Drop <img> tags that are not https (XSS / mixed-content safe). */
function stripUnsafeImages(html: string): string {
  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    const m = /\bsrc=["']([^"']+)["']/i.exec(tag);
    if (!m || !/^https:\/\//i.test(m[1].trim())) return "";
    return tag;
  });
}

export function sanitizeUserStoryHtml(dirty: string): string {
  const stripped = stripUnsafeImages(dirty);
  return DOMPurify.sanitize(stripped, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ["src", "alt"],
  });
}
