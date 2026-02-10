#!/usr/bin/env python3
"""
Generate point-by-point SEO audit results CSV from docs/seo/SEO-Audit-Critical.md.

Status values:
- PASS: Verified OK in local prod run or clear by code inspection
- FAIL: Verified not meeting checklist
- NA: Not applicable to Basic Template by design (e.g. cart/checkout removed)
- NT: Not tested / requires external tooling or production environment
- PARTIAL: Partially verified / needs broader crawl or depends on configuration
"""

from __future__ import annotations

import csv
import re
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class CheckRow:
    id: str
    check: str
    priority: str


ROOT = Path(__file__).resolve().parents[2]
AUDIT_MD = ROOT / "docs" / "seo" / "SEO-Audit-Critical.md"
OUT_CSV = ROOT / "docs" / "seo" / "SEO-Audit-Checklist-Results.csv"


def parse_checks(md: str) -> list[CheckRow]:
    rows: list[CheckRow] = []
    for line in md.splitlines():
        # Markdown table rows like:
        # | C-001 | Robots.txt file exists ... | P0 | ⬜ | |
        m = re.match(r"^\|\s*([A-Z]+-\d{3})\s*\|\s*(.*?)\s*\|\s*(P0|P1)\s*\|", line)
        if not m:
            continue
        rows.append(CheckRow(id=m.group(1), check=m.group(2), priority=m.group(3)))
    return rows


# Results captured from local production test run + code inspection (Feb 10, 2026).
# Anything not listed here defaults to NT.
RESULTS: dict[str, tuple[str, str]] = {
    # Crawlability & Indexation
    "C-001": ("PASS", "Verified /robots.txt returns 200."),
    "C-002": ("PARTIAL", "robots.txt blocks only non-existent/removed transactional paths; verify per-store additions."),
    "C-003": ("PASS", "robots.txt references /sitemap.xml."),
    "C-005": ("NT", "Requires environment-specific rules (staging/test)."),
    "C-008": ("PASS", "Verified /sitemap.xml returns 200."),
    "C-009": ("PASS", "Sitemap is well-formed XML via next-sitemap."),
    "C-010": ("PARTIAL", "Sitemap includes key static + dynamic entities; full coverage depends on CMS + routing."),
    "C-011": ("PASS", "Search is noindex and excluded from sitemap; transactional/auth routes excluded."),
    "C-012": ("PASS", "Template does not define application-level redirects; verify infra/CDN redirects separately."),
    "C-013": ("PARTIAL", "Spot-checked key URLs; full validation requires crawling all sitemap URLs."),
    "C-014": ("PASS", "Sitemap locs match canonical host derived from NEXT_PUBLIC_SITE_URL."),
    "C-019": ("PASS", "Product URLs included."),
    "C-020": ("PASS", "Category URLs included."),
    "C-021": ("PASS", "Blog URLs included."),
    "C-022": ("PASS", "Cart/checkout/order/account not present in sitemap."),
    "C-023": ("NA", "Auth removed from Basic Template."),
    "C-024": ("NA", "Account area removed from Basic Template."),

    "C-025": ("PASS", "Indexable pages rely on default index,follow (no meta robots) unless explicitly set."),
    "C-026": ("NA", "Cart removed."),
    "C-027": ("NA", "Checkout removed."),
    "C-028": ("NA", "Account removed."),
    "C-029": ("NA", "Order confirmation removed."),
    "C-030": ("PASS", "/search sets robots noindex,follow."),
    "C-031": ("NT", "Needs explicit policy for filtered/sorted URLs (noindex vs canonical)."),
    "C-032": ("NT", "Pagination is \"load more\"; audit expects canonical/prev/next strategy if using paginated URLs."),
    "C-034": ("NA", "Payment callback pages removed."),

    "C-035": ("PARTIAL", "Canonical tags verified on key routes; confirm all CMS-driven routes."),
    "C-036": ("PASS", "Key routes use self-referencing canonicals."),
    "C-037": ("PASS", "Canonicals are absolute URLs derived from NEXT_PUBLIC_SITE_URL."),
    "C-038": ("PASS", "metadataBase set in src/app/layout.tsx."),
    "C-039": ("NT", "Depends on NEXT_PUBLIC_SITE_URL being https in production."),
    "C-040": ("NT", "Depends on NEXT_PUBLIC_SITE_URL and infrastructure (www vs non-www)."),
    "C-041": ("PASS", "Canonicals strip trailing slash consistently."),
    "C-042": ("PASS", "Search canonicals drop query; filtered/sorted policy still needs decision."),
    "C-043": ("NT", "No rel prev/next; depends on pagination URL strategy."),
    "C-044": ("NT", "Needs explicit canonical/noindex handling for facet URLs."),
    "C-045": ("NT", "Requires duplicate URL inventory."),

    # Redirects: intentionally removed in template
    "C-046": ("NA", "Redirects intentionally removed; handled per storefront."),
    "C-047": ("NA", "Redirects intentionally removed; handled per storefront."),
    "C-048": ("NA", "Redirects intentionally removed; handled per storefront."),
    "C-049": ("NA", "Redirects intentionally removed; handled per storefront."),
    "C-050": ("NT", "HTTP->HTTPS is infrastructure-level (CDN/hosting) concern."),
    "C-051": ("NT", "www/non-www is infrastructure-level (CDN/hosting) concern."),

    # URL Structure & Architecture
    "U-001": ("PASS", "URLs are readable slugs (category/product/blog)."),
    "U-002": ("PASS", "Slugs use hyphens."),
    "U-003": ("PASS", "Routes are lowercase."),
    "U-005": ("PARTIAL", "Depends on content/slug conventions in Saleor/PartsLogic."),
    "U-006": ("PASS", "No session IDs observed."),
    "U-007": ("PARTIAL", "Search uses query params; indexability controlled via noindex."),
    "U-008": ("PASS", "Consistent /product/, /category/, /blog/, /brand/ patterns."),
    "U-009": ("PASS", "Product pages use slug in /product/{slug}."),
    "U-010": ("PASS", "Category pages use slug in /category/{slug}."),
    "U-011": ("PASS", "Blog uses /blog/{slug}."),

    "U-012": ("PARTIAL", "Navigation exists; click-depth depends on menu config in Saleor."),
    "U-013": ("PASS", "Logical hierarchy for core entities."),
    "U-014": ("PASS", "Products are flat URLs."),
    "U-015": ("NT", "Requires crawl of internal links."),
    "U-016": ("PASS", "Header/footer navigation present."),
    "U-017": ("PASS", "Breadcrumbs present on category/blog/static pages; PDP breadcrumb is via schema, visible breadcrumb varies."),
    "U-018": ("PARTIAL", "Depends on Saleor category tree."),
    "U-019": ("NT", "Facet URLs policy not fully defined."),

    # On-Page SEO Elements (sampled)
    "O-001": ("PARTIAL", "Titles present on key routes; full uniqueness requires crawl."),
    "O-005": ("NT", "Requires crawl to detect duplicates."),
    "O-007": ("PASS", "PDP title includes product name."),
    "O-008": ("PASS", "Category title includes category name."),
    "O-009": ("PASS", "Homepage title set to store name."),
    "O-010": ("PASS", "generateMetadata used for PDP/category/blog dynamic pages."),

    "O-019": ("FAIL", "Not all key pages have exactly one visible H1 (e.g. /products/all, /product/{slug}, /contact, /locator)."),
    "O-024": ("PARTIAL", "Most headings use semantic components; verify Heading defaults to h1 where required."),
    "O-026": ("FAIL", "PDP H1 missing in server-rendered HTML (observed h1_count=0)."),
    "O-027": ("PASS", "Category pages include an H1 (sampled /category/products)."),

    "O-034": ("PARTIAL", "Many images have alt; full coverage requires crawl."),
    "O-040": ("NT", "Requires crawl of all templates/components."),

    "O-043": ("NT", "Requires link crawl."),

    # Technical SEO
    "T-001": ("FAIL", "Several core pages render with Suspense fallbacks / client-only sections; verify no-JS content."),
    "T-002": ("FAIL", "Without JS, many pages show skeleton/placeholder content."),
    "T-003": ("FAIL", "SEO-critical content is often client-rendered (BAILOUT_TO_CLIENT_SIDE_RENDERING markers observed)."),
    "T-004": ("PARTIAL", "Mix of server/client components; needs systematic review."),
    "T-005": ("PARTIAL", "Interactivity is client; some content also client."),
    "T-006": ("NT", "Needs browser console to confirm hydration errors."),
    "T-007": ("NT", "Needs Lighthouse/trace to confirm render-blocking JS."),

    "T-008": ("PASS", "Key pages return 200."),
    "T-009": ("PASS", "Unknown /{slug} now returns 404 (fixed)."),
    "T-010": ("PASS", "Custom 404 page exists (app/_not-found)."),
    "T-011": ("NT", "Requires provoking backend errors."),
    "T-012": ("PARTIAL", "Primary soft-404 source (/[slug]) fixed; still needs crawl for other soft-404 patterns."),
    "T-013": ("NT", "Out-of-stock handling depends on data and UI; requires manual verification."),

    "T-014": ("PARTIAL", "next/image used widely; some components still use <img>."),
    "T-018": ("PASS", "Next production build outputs minified JS."),
    "T-019": ("PASS", "CSS is bundled/minified in production build."),
    "T-020": ("NT", "Compression depends on hosting/CDN."),
    "T-021": ("NT", "Caching headers depend on hosting/CDN; Next sets some cache headers."),
    "T-024": ("PARTIAL", "Some third-party scripts are conditional; needs full inventory."),

    "T-025": ("PASS", "Many pages are prerendered (see next build output)."),
    "T-026": ("PARTIAL", "Some pages use ISR revalidate; strategy may need tuning per route."),
    "T-027": ("PASS", "No global force-dynamic except CMS dynamic slug route."),

    # Core Web Vitals
    "P-001": ("NT", "Requires Lighthouse/CrUX."),
    "P-002": ("PARTIAL", "Hero uses next/image; overall LCP requires measurement."),
    "P-006": ("PASS", "Fonts use display: swap (next/font)."),
    "P-008": ("NT", "Requires field/lab measurement."),
    "P-013": ("NT", "Requires measurement."),
    "P-014": ("PARTIAL", "next/image sets dimensions; verify remaining <img>."),

    # Structured Data & Schema
    "S-001": ("PASS", "Organization JSON-LD present on homepage."),
    "S-002": ("FAIL", "Organization schema is not injected site-wide (homepage only)."),
    "S-003": ("PASS", "WebSite schema with SearchAction present on homepage."),

    "S-007": ("PASS", "Product JSON-LD present on PDP (sampled)."),
    "S-008": ("PASS", "Product name present."),
    "S-009": ("PASS", "Product description present (but may be JSON-like; validate for Rich Results)."),
    "S-010": ("PASS", "Product image present."),
    "S-011": ("PASS", "Price present."),
    "S-012": ("PASS", "Currency present."),
    "S-013": ("PASS", "Availability present."),
    "S-019": ("PASS", "Offer nested in Product."),

    "S-021": ("PARTIAL", "BreadcrumbList present on many pages (PDP/category/blog), not guaranteed everywhere."),
    "S-027": ("PASS", "BlogPosting schema present on blog posts (sampled)."),

    "S-031": ("NT", "Requires Google Rich Results Test."),
    "S-032": ("NT", "Requires Search Console."),
    "S-034": ("PASS", "JSON-LD used."),

    # Content & E-E-A-T
    "E-011": ("PASS", "Contact info present in footer/header (sampled)."),
    "E-014": ("PASS", "Privacy policy page exists."),
    "E-016": ("PASS", "Shipping & Returns page exists."),

    # E-commerce Specific SEO
    "EC-004": ("PARTIAL", "Price shown on product cards/schema; verify PDP UI renders without JS."),
    "EC-005": ("PARTIAL", "Availability in schema; UI depends on client render."),
    "EC-006": ("NA", "Add to cart intentionally removed; replaced by Request a Quote."),
    "EC-019": ("PASS", "Search endpoint works; /search is functional."),
    "EC-027": ("PASS", "PartsLogic fitment root-types endpoint responds 200 via proxy."),
    "EC-028": ("NT", "Fitment accuracy requires domain validation."),

    # Security & Trust
    "SEC-001": ("NT", "Template supports HTTPS; depends on deployment."),
    "SEC-002": ("NT", "Depends on deployment certificate."),
    "SEC-003": ("NT", "Requires browser audit."),
    "SEC-004": ("NT", "HSTS is hosting/CDN config."),

    # Social & Sharing
    "SOC-001": ("PASS", "og:title present on key pages."),
    "SOC-002": ("PASS", "og:description present on key pages."),
    "SOC-003": ("PASS", "og:image present on key pages (added defaults)."),
    "SOC-004": ("PASS", "og:url present on key pages."),
    "SOC-009": ("PASS", "twitter:card present on key pages."),
    "SOC-010": ("PASS", "twitter:title present on key pages."),
    "SOC-011": ("PASS", "twitter:description present on key pages."),
    "SOC-012": ("PASS", "twitter:image present on key pages (added defaults)."),

    # Analytics & Monitoring
    "A-001": ("NT", "Optional; requires GA config in Saleor/env."),
    "A-006": ("NT", "Requires GSC verification."),
    "A-007": ("NT", "Requires GSC submission."),
    "A-008": ("NT", "Requires GSC access."),
}


def main() -> int:
    md = AUDIT_MD.read_text(encoding="utf-8")
    checks = parse_checks(md)

    OUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    with OUT_CSV.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["id", "priority", "status", "check", "notes"])
        for row in checks:
            status, notes = RESULTS.get(row.id, ("NT", ""))
            w.writerow([row.id, row.priority, status, row.check, notes])

    total = len(checks)
    covered = sum(1 for c in checks if c.id in RESULTS)
    print(f"Wrote {OUT_CSV} ({total} checks, {covered} with explicit results)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

