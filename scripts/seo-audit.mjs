#!/usr/bin/env node
/**
 * Lightweight SEO audit runner for local verification.
 *
 * Usage:
 *   SEO_AUDIT_BASE="http://localhost:3010" node scripts/seo-audit.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUDIT_BASE = process.env.SEO_AUDIT_BASE || "http://localhost:3010";
const SITEMAP_PATH = process.env.SEO_AUDIT_SITEMAP_PATH || "/sitemap.xml";
const ROBOTS_PATH = process.env.SEO_AUDIT_ROBOTS_PATH || "/robots.txt";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const MAX_SAMPLE = Number(process.env.SEO_AUDIT_MAX_SAMPLE || "60");

function nowIso() {
  return new Date().toISOString();
}

function stripTrailingSlash(u) {
  return u.replace(/\/$/, "");
}

function toPathname(url) {
  try {
    return new URL(url).pathname + (new URL(url).search || "");
  } catch {
    return null;
  }
}

function extractTag(html, re) {
  const m = html.match(re);
  return m ? m[1] : null;
}

function extractCanonical(html) {
  const tag = html.match(/<link[^>]+rel=["']canonical["'][^>]*>/i)?.[0] || null;
  if (!tag) return null;
  return extractTag(tag, /href=["']([^"']+)["']/i);
}

function extractRobots(html) {
  const tag = html.match(/<meta[^>]+name=["']robots["'][^>]*>/i)?.[0] || null;
  if (!tag) return null;
  return extractTag(tag, /content=["']([^"']+)["']/i);
}

function extractTitle(html) {
  const title = extractTag(html, /<title[^>]*>([^<]*)<\/title>/i);
  return title ? String(title).trim() : null;
}

function extractMetaDescription(html) {
  const tag =
    html.match(/<meta[^>]+name=["']description["'][^>]*>/i)?.[0] ||
    html.match(/<meta[^>]+property=["']description["'][^>]*>/i)?.[0] ||
    null;
  if (!tag) return null;
  const desc = extractTag(tag, /content=["']([^"']+)["']/i);
  return desc ? String(desc).trim() : null;
}

function countH1(html) {
  return (html.match(/<h1(\s|>)/gi) || []).length;
}

function extractJsonLdTypes(html) {
  const scripts = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) || [];
  const types = new Set();
  for (const s of scripts) {
    const jsonText = s.replace(/^<script[^>]*>/i, "").replace(/<\/script>$/i, "");
    try {
      const parsed = JSON.parse(jsonText);
      const visit = (v) => {
        if (!v) return;
        if (Array.isArray(v)) return v.forEach(visit);
        if (typeof v !== "object") return;
        if (typeof v["@type"] === "string") types.add(v["@type"]);
        for (const k of Object.keys(v)) visit(v[k]);
      };
      visit(parsed);
    } catch {
      // ignore invalid JSON-LD blocks for this lightweight audit
    }
  }
  return Array.from(types).sort();
}

async function getText(pathname, opts) {
  const res = await fetch(stripTrailingSlash(AUDIT_BASE) + pathname, opts);
  const text = await res.text();
  return { res, text };
}

function parseSitemapLocs(xml) {
  // Not a full XML parser; sufficient for Next Sitemap output.
  return Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1]);
}

function sampleUrls(locs) {
  const seen = new Set();
  const out = [];

  function add(url) {
    if (!url || seen.has(url)) return;
    seen.add(url);
    out.push(url);
  }

  // Always include key paths if present.
  const mustHave = [
    `${stripTrailingSlash(SITE_URL)}/`,
    `${stripTrailingSlash(SITE_URL)}/products/all`,
    `${stripTrailingSlash(SITE_URL)}/category`,
    `${stripTrailingSlash(SITE_URL)}/blog`,
    `${stripTrailingSlash(SITE_URL)}/contact`,
    `${stripTrailingSlash(SITE_URL)}/dealer-application`,
    `${stripTrailingSlash(SITE_URL)}/locator`,
    `${stripTrailingSlash(SITE_URL)}/privacy-policy`,
    `${stripTrailingSlash(SITE_URL)}/terms-and-conditions`,
    `${stripTrailingSlash(SITE_URL)}/shipping-returns`,
    `${stripTrailingSlash(SITE_URL)}/search`,
  ];
  mustHave.forEach((u) => {
    const match = locs.find((l) => l === u || l === u.replace(/\/$/, ""));
    if (match) add(match);
  });

  // Ensure at least one product/category/blog detail page.
  const pick = (prefix) => locs.find((l) => l.includes(prefix));
  add(pick("/product/"));
  add(pick("/category/"));
  add(pick("/blog/"));

  // Fill with first N URLs.
  for (const loc of locs) {
    if (out.length >= MAX_SAMPLE) break;
    add(loc);
  }
  return out.slice(0, MAX_SAMPLE);
}

function checkSitemapExclusions(locs) {
  const bad = locs.filter((l) => ["/search", "/checkout", "/cart", "/account", "/api/"].some((x) => l.includes(x)));
  return { badCount: bad.length, badSample: bad.slice(0, 10) };
}

async function main() {
  const startedAt = nowIso();
  const results = {
    startedAt,
    auditBase: AUDIT_BASE,
    siteUrl: SITE_URL,
    robots: null,
    sitemap: null,
    urlChecks: [],
    summary: {
      urlCount: 0,
      sampled: 0,
      non200: 0,
      redirects: 0,
      missingCanonical: 0,
      canonicalNotAbsolute: 0,
      missingTitle: 0,
      missingDescription: 0,
      duplicateTitles: 0,
      duplicateDescriptions: 0,
      missingH1: 0,
      multipleH1: 0,
      missingSchemaProductOnPdp: 0,
      missingSchemaOrgOnHome: 0,
      missingSchemaBreadcrumb: 0,
      searchNotNoindex: 0,
    },
  };

  // robots.txt
  try {
    const { res, text } = await getText(ROBOTS_PATH);
    results.robots = { status: res.status, contentType: res.headers.get("content-type"), body: text };
  } catch (e) {
    results.robots = { status: "ERR", error: String(e?.message || e) };
  }

  // sitemap.xml
  let sitemapXml = null;
  try {
    const { res, text } = await getText(SITEMAP_PATH);
    sitemapXml = text;
    results.sitemap = { status: res.status, contentType: res.headers.get("content-type"), bodyHead: text.slice(0, 200) };
  } catch (e) {
    results.sitemap = { status: "ERR", error: String(e?.message || e) };
  }

  if (!sitemapXml) {
    console.error("No sitemap.xml fetched; cannot continue.");
    process.exitCode = 1;
    return results;
  }

  const locs = parseSitemapLocs(sitemapXml);
  results.summary.urlCount = locs.length;
  results.sitemap.exclusions = checkSitemapExclusions(locs);

  const sampled = sampleUrls(locs);
  results.summary.sampled = sampled.length;

  for (const loc of sampled) {
    const pathname = toPathname(loc);
    if (!pathname) continue;

    let status = null;
    let redirectLocation = null;
    let contentType = null;
    let canonical = null;
    let robots = null;
    let title = null;
    let description = null;
    let h1Count = null;
    let schemaTypes = [];

    try {
      const { res, text } = await getText(pathname, { redirect: "manual" });
      status = res.status;
      contentType = res.headers.get("content-type") || "";
      if (status >= 300 && status < 400) {
        redirectLocation = res.headers.get("location") || null;
      }

      if (contentType.includes("text/html")) {
        canonical = extractCanonical(text);
        robots = extractRobots(text);
        title = extractTitle(text);
        description = extractMetaDescription(text);
        h1Count = countH1(text);
        schemaTypes = extractJsonLdTypes(text);
      }
    } catch (e) {
      status = "ERR";
    }

    const row = {
      loc,
      pathname,
      status,
      redirectLocation,
      contentType,
      canonical,
      robots,
      title,
      description,
      h1Count,
      schemaTypes,
    };
    results.urlChecks.push(row);

    if (status !== 200) results.summary.non200 += 1;
    if (redirectLocation) results.summary.redirects += 1;
    if (contentType?.includes("text/html")) {
      if (!canonical) results.summary.missingCanonical += 1;
      else {
        const isAbsolute = /^https?:\/\//i.test(canonical);
        if (!isAbsolute) results.summary.canonicalNotAbsolute += 1;
      }
      if (!title) results.summary.missingTitle += 1;
      if (!description) results.summary.missingDescription += 1;
      if (h1Count === 0) results.summary.missingH1 += 1;
      if (h1Count && h1Count > 1) results.summary.multipleH1 += 1;
    }

    // Specific checks
    if (pathname === "/" && contentType?.includes("text/html")) {
      if (!schemaTypes.includes("Organization") || !schemaTypes.includes("WebSite")) {
        results.summary.missingSchemaOrgOnHome += 1;
      }
    }
    if (pathname.startsWith("/product/") && contentType?.includes("text/html")) {
      if (!schemaTypes.includes("Product")) results.summary.missingSchemaProductOnPdp += 1;
      if (!schemaTypes.includes("BreadcrumbList")) results.summary.missingSchemaBreadcrumb += 1;
    }
    if (pathname.startsWith("/category/") && contentType?.includes("text/html")) {
      if (!schemaTypes.includes("BreadcrumbList")) results.summary.missingSchemaBreadcrumb += 1;
    }
    if (pathname.startsWith("/blog/") && pathname !== "/blog" && contentType?.includes("text/html")) {
      if (!schemaTypes.includes("BlogPosting")) {
        // not tracked as summary counter; informational
      }
      if (!schemaTypes.includes("BreadcrumbList")) results.summary.missingSchemaBreadcrumb += 1;
    }
    if (pathname.startsWith("/search") && contentType?.includes("text/html")) {
      const v = (robots || "").toLowerCase();
      const ok = v.includes("noindex") && v.includes("follow");
      if (!ok) results.summary.searchNotNoindex += 1;
    }
  }

  // Duplicate title/description detection on sampled HTML pages.
  const countDupe = (vals) => {
    const m = new Map();
    for (const v of vals) {
      const key = String(v || "").trim();
      if (!key) continue;
      m.set(key, (m.get(key) || 0) + 1);
    }
    let dupes = 0;
    for (const c of m.values()) if (c > 1) dupes += 1;
    return dupes;
  };

  results.summary.duplicateTitles = countDupe(
    results.urlChecks.filter((r) => r.contentType?.includes("text/html")).map((r) => r.title)
  );
  results.summary.duplicateDescriptions = countDupe(
    results.urlChecks.filter((r) => r.contentType?.includes("text/html")).map((r) => r.description)
  );

  return results;
}

function toMarkdown(results) {
  const lines = [];
  lines.push(`## Automated Checks (${results.startedAt})`);
  lines.push("");
  lines.push(`- Audit base (dev server): \`${results.auditBase}\``);
  lines.push(`- Canonical base (NEXT_PUBLIC_SITE_URL): \`${results.siteUrl}\``);
  lines.push("");

  lines.push("### Robots.txt");
  if (results.robots?.status === "ERR") {
    lines.push(`- FAIL: could not fetch robots.txt (${results.robots.error})`);
  } else {
    lines.push(`- Status: ${results.robots.status}`);
    const body = String(results.robots.body || "");
    const hasSitemap = /sitemap:/i.test(body);
    lines.push(`- Has sitemap reference: ${hasSitemap ? "PASS" : "FAIL"}`);
    const disallowAll = /disallow:\s*\/\s*$/im.test(body);
    lines.push(`- Disallow all: ${disallowAll ? "YES" : "NO"}`);
  }
  lines.push("");

  lines.push("### Sitemap.xml");
  if (results.sitemap?.status === "ERR") {
    lines.push(`- FAIL: could not fetch sitemap.xml (${results.sitemap.error})`);
  } else {
    lines.push(`- Status: ${results.sitemap.status}`);
    lines.push(`- URL count: ${results.summary.urlCount}`);
    const ex = results.sitemap.exclusions;
    lines.push(`- Excluded path violations (search/cart/checkout/account/api): ${ex.badCount === 0 ? "PASS" : "FAIL"}`);
    if (ex.badCount) {
      lines.push(`- Sample violations: ${ex.badSample.join(", ")}`);
    }
  }
  lines.push("");

  lines.push("### Sampled URL Checks");
  lines.push(`- Sample size: ${results.summary.sampled}`);
  lines.push(`- Non-200 responses: ${results.summary.non200}`);
  lines.push(`- Redirects: ${results.summary.redirects}`);
  lines.push(`- Missing canonical: ${results.summary.missingCanonical}`);
  lines.push(`- Canonical not absolute: ${results.summary.canonicalNotAbsolute}`);
  lines.push(`- Missing title tag: ${results.summary.missingTitle}`);
  lines.push(`- Missing meta description: ${results.summary.missingDescription}`);
  lines.push(`- Duplicate titles (sampled pages): ${results.summary.duplicateTitles}`);
  lines.push(`- Duplicate meta descriptions (sampled pages): ${results.summary.duplicateDescriptions}`);
  lines.push(`- Missing H1: ${results.summary.missingH1}`);
  lines.push(`- Multiple H1: ${results.summary.multipleH1}`);
  lines.push(`- Home missing Organization/WebSite schema: ${results.summary.missingSchemaOrgOnHome}`);
  lines.push(`- PDP missing Product schema: ${results.summary.missingSchemaProductOnPdp}`);
  lines.push(`- Breadcrumb schema missing (sampled pages): ${results.summary.missingSchemaBreadcrumb}`);
  lines.push(`- Search missing noindex,follow: ${results.summary.searchNotNoindex}`);
  lines.push("");

  const bad = results.urlChecks.filter((r) => r.status !== 200 || r.redirectLocation);
  if (bad.length) {
    lines.push("### Non-200 / Redirect Sample");
    for (const r of bad.slice(0, 20)) {
      lines.push(`- ${r.pathname}: ${r.status}${r.redirectLocation ? ` -> ${r.redirectLocation}` : ""}`);
    }
    lines.push("");
  }

  const canonicalBad = results.urlChecks.filter((r) => r.contentType?.includes("text/html") && !r.canonical);
  if (canonicalBad.length) {
    lines.push("### Missing Canonical (Sample)");
    for (const r of canonicalBad.slice(0, 20)) {
      lines.push(`- ${r.pathname}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

async function writeOutputs(results) {
  const docsDir = path.join(__dirname, "..", "docs");
  const outJson = path.join(docsDir, "seo-audit-results.json");
  fs.writeFileSync(outJson, JSON.stringify(results, null, 2));

  const reportPath = path.join(docsDir, "SEO_AUDIT_REPORT.md");
  const marker = "\n## Automated Checks";
  const existing = fs.readFileSync(reportPath, "utf8");
  const trimmed = existing.split(marker)[0].trimEnd();
  const updated = `${trimmed}\n\n${toMarkdown(results)}\n`;
  fs.writeFileSync(reportPath, updated);
}

const results = await main();
await writeOutputs(results);

// Exit non-zero if we found critical failures.
if (results.summary.non200 > 0 || results.summary.redirects > 0) {
  process.exitCode = 2;
}
