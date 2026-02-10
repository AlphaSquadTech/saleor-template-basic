import React from "react";

function stripScriptsAndIframes(html: string) {
  // Basic safety + SEO: ensure CMS HTML is visible to crawlers, but drop scripts/iframes.
  // This is not a full HTML sanitizer; content is assumed to be authored by trusted admins.
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "");
}

export default function ServerHtmlRenderer({ html }: { html: string }) {
  const safeHtml = stripScriptsAndIframes(html || "");

  return (
    <div
      className="prose prose-neutral max-w-none"
      // CMS HTML is trusted admin content; we strip scripts/iframes above.
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}

