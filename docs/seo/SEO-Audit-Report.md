# SEO Audit Report (Basic Template)

Date: 2026-02-10

This report validates the checklist in `docs/seo/SEO-Audit-Critical.md` against the `saleor-template-basic` template.

## Environment Used For Testing

- App: Next.js 15 production build (`yarn build` + `yarn start`)
- Base URL: `http://localhost:3105`
- Env values used (high-level):
  - `NEXT_PUBLIC_API_URL=https://api.ezoildrainvalve.com/graphql/`
  - `NEXT_PUBLIC_PARTSLOGIC_URL=https://pl-ez-oil-drain-valve.wsm-dev.com`
  - `NEXT_PUBLIC_SEARCH_URL=https://wsm-migrator-api.alphasquadit.com`
  - `NEXT_PUBLIC_SITE_URL=http://localhost:3105`

## Where The Full Point-By-Point Results Live

- Checklist source: `docs/seo/SEO-Audit-Critical.md`
- Point-by-point results (236 rows): `docs/seo/SEO-Audit-Checklist-Results.csv`
- Generator: `scripts/seo-audit/generate_results.py`

## Key Verified Outcomes (High Impact)

- `/robots.txt` exists and references `/sitemap.xml` (C-001, C-003).
- `/sitemap.xml` exists, is valid XML, and includes products/categories/blog posts (C-008, C-009, C-019, C-020, C-021).
- Transactional + auth/account URLs are excluded (C-022, C-023, C-024) because cart/checkout/auth are removed by design.
- Search strategy implemented: `/search` is `noindex,follow` and excluded from sitemap (C-030, C-011).
- 404s are real 404s (no soft-404): unknown `/{slug}` now returns `404 Not Found` (T-009, T-012).
- Canonicals are present and absolute on key routes (C-036, C-037).
- `metadataBase` is configured (C-038).
- OpenGraph/Twitter images now render on key routes (SOC-003, SOC-012).
- PartsLogic fitment root-types works through proxy (EC-027).

## Critical Gaps (P0)

1. **SSR/no-JS content**
   - Multiple key pages render major content behind client components and Suspense fallbacks (T-001, T-002, T-003 = FAIL in results CSV).
   - Practical impact: bots/users without JS see skeletons; content discoverability and indexing quality can degrade.

2. **Heading structure (H1)**
   - Not all key pages have exactly one visible `<h1>` (O-019 = FAIL).
   - Examples observed during test run:
     - `/products/all` had `h1_count=0`
     - `/product/{slug}` had `h1_count=0`
     - `/contact` had `h1_count=0`
     - `/locator` had `h1_count=0`

3. **Production canonical host/scheme consistency**
   - Canonicals are derived from `NEXT_PUBLIC_SITE_URL`. If a deployment sets `http://...` (or has mismatched www), canonicals will reflect that (C-039/C-040 = NT/config-dependent).

## Reproduce The Audit Locally

1. Build + generate sitemap:
   - `NEXT_PUBLIC_SITE_URL=http://localhost:3105 ... yarn build`
2. Start:
   - `yarn start -p 3105`
3. Generate the checklist CSV:
   - `python3 scripts/seo-audit/generate_results.py`

