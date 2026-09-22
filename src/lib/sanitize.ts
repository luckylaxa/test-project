import sanitizeHtml from "sanitize-html";

/**
 * Cleans rich text before it reaches a visitor's browser.
 *
 * Only admins can write `body_html`, and an admin already controls the site —
 * so this is not a privilege boundary. It is defence in depth: if an admin
 * account is ever compromised, stored HTML would otherwise run on every
 * visitor's browser, on every page view, indefinitely.
 *
 * The allowlist matches what the admin rich-text editor can actually produce.
 * Anything else is dropped rather than escaped, so pasted markup from Word or a
 * web page cannot smuggle in styles or scripts either.
 */
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "strong", "b", "em", "i", "u", "s",
    "h2", "h3", "h4",
    "ul", "ol", "li",
    "blockquote", "hr",
    "a", "figure", "figcaption", "img",
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "width", "height", "loading"],
  },
  // No javascript:, no data: — only real links and images.
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: { img: ["http", "https"] },
  transformTags: {
    // Any link that leaves the site opens safely.
    a: (tagName, attribs) => {
      const href = attribs.href ?? "";
      const external = /^https?:\/\//i.test(href);
      return {
        tagName,
        attribs: external
          ? { ...attribs, target: "_blank", rel: "noopener noreferrer" }
          : attribs,
      };
    },
  },
  disallowedTagsMode: "discard",
};

export function sanitizeRichText(html: string | null | undefined): string {
  if (!html) return "";
  return sanitizeHtml(html, OPTIONS);
}

/**
 * Makes a JSON-LD payload safe to sit inside a <script> tag.
 *
 * Without this, a product name or article title containing "</script>" would
 * close the tag early and everything after it would be parsed as HTML.
 */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}
