# Handoff: saleor-template-basic

This repo is a cleaned-up template derived from the upstream “Basic Template” codebase:

- Source: `AlphaSquadTech/as-saleor-template-basic`
- Target: `alphasquadtech/saleor-template-basic` (public template repo)

## What This Template Is

A Next.js App Router storefront meant for “request a quote” / lead-gen flows:

- Basic UI retained: homepage, category pages, search, PDP, blog, CMS pages.
- Dealer locator: page always exists; shows a “not configured” empty state when env is missing.
- YMM: Year/Make/Model via PartsLogic (PartsLogic-backed search + fitments).
- Static pages via Saleor CMS Pages:
  - `/terms-and-conditions` -> CMS page slug `terms-and-conditions`
  - `/shipping-returns` -> CMS page slug `shipping-returns`
  - `/privacy-policy` -> CMS page slug `privacy-policy` (optional)
- Newsletter pop-up:
  - Content is pulled from CMS page slug `newsletter`
- Inquiries/forms/applications:
  - Contact: `/contact`
  - Dealer application: `/dealer-application`
  - Product inquiry: PDP “Request a Quote” modal
  - All submit to `POST /api/form-submission`

## SEO Baseline (Implemented)

Scope (per product decision): schema + basic headings is sufficient.

- Exactly one visible `<h1>` on key routes (PDP, category, contact, locator, etc.).
- Filtered/faceted category URLs are canonicalized to the base category URL.
- Schema.org JSON-LD added to key templates (breadcrumbs, blog posting, etc.).
- `/search` is `noindex,follow` and excluded from sitemap.
- Dynamic `/{slug}` pages return 404 (not “soft 404”) when missing.

### SSR vs CSR Policy (SEO)

Rule of thumb:
- Indexable, public-facing pages should render meaningful HTML on the initial response (SSR/ISR).
- Client-side data fetching is allowed as progressive enhancement (filters, accordions, map interactions).
- Explicitly `noindex` pages can be CSR.

Current status:
- SSR/ISR (indexable): `/`, `/products/all`, `/category`, `/category/[slug]`, `/brand/[id]`, `/product/[id]`, `/blog`, `/blog/[slug]`, CMS pages (`/[slug]`), static policy pages.
- CSR allowed: `/search` (noindex), locator map UI (`/locator` body), forms (`/contact`, `/dealer-application` body).

Notes:
- PDP, category detail, and brand detail ship initial data server-side for SEO; client components are used for interaction only.

### SEO Audit Runner (Local)

There is a lightweight automated SEO audit runner:

- Script: `scripts/seo-audit.mjs`
- Writes: `docs/seo-audit-results.json`
- Updates: `docs/SEO_AUDIT_REPORT.md` (replaces the "Automated Checks" section)

Run (example):

```
NEXT_PUBLIC_SITE_URL="http://localhost:3010" SEO_AUDIT_BASE="http://localhost:3010" node scripts/seo-audit.mjs
```

Important: for canonical checks to be accurate, `NEXT_PUBLIC_SITE_URL` should match the dev server origin you are testing.

## What Was Removed (By Design)

- Auth: removed completely (routes + API handlers + header UI).
- Cart/checkout/add-to-cart: removed completely (routes + header/cart UI + PDP actions).
- Payments: removed (payment scripts and related endpoints).
- Redirects: removed:
  - No Next.js redirects config.
  - No metadata-driven “old_slug/redirects” logic for products/categories.
  - Middleware disabled.

## Build Behavior (Template-Friendly)

Template builds must not fail when env vars are missing.

- `yarn build` succeeds even when `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_PARTSLOGIC_URL`, etc. are unset.
- Server-only showroom components that previously fetched Saleor CMS at build time now short-circuit when `NEXT_PUBLIC_API_URL` is missing.
- PartsLogic-backed category/brand fetchers now no-op when `NEXT_PUBLIC_PARTSLOGIC_URL` is missing.
- JSON-LD schema generators no longer assume `NEXT_PUBLIC_SITE_URL` exists.

## Perf / Bundle Notes

To keep client bundles smaller, client components no longer import the large `src/lib/api/shop.ts` module.
Instead they call internal API routes:

- PartsLogic proxy: `GET /api/partslogic-proxy?path=/api/...`
- Saleor global search: `GET /api/saleor/global-search?q=...`
- Saleor products pagination: `POST /api/saleor/products`

The main header navigation is server-rendered (no client-side nav boot required). Category + menu data is cached on the server with `unstable_cache` to avoid refetching on every request.

## Guards / Regression Checks

Main nav must remain server-rendered (no client bailout):

- Script: `scripts/guard-server-nav.mjs`
- Command: `yarn guard:server-nav`

## SMTP (Env-Configurable)

`/api/form-submission` supports SMTP delivery via env variables (optional). If SMTP is not configured, the API returns a clear error.

## Local Dev

1. `yarn install`
2. Copy `.env.example` -> `.env.local`
3. `yarn dev`

## Testing / Verification Done

- `yarn lint` (warnings only).
- `yarn build`:
  - Passes with env vars unset.
  - Passes with a real Saleor + PartsLogic env set.

## Test Env Used (Example)

The following env values have been used successfully for local prod testing:

- `NEXT_PUBLIC_TENANT_NAME='baja-kits'`
- `NEXT_PUBLIC_BRAND_NAME='AutoParts Store'`
- `NEXT_PUBLIC_API_URL='https://api-baja-kits.wsm-dev.com/graphql/'`
- `NEXT_PUBLIC_PARTSLOGIC_URL='https://pl-baja-kits.wsm-dev.com'`
- `NEXT_PUBLIC_SEARCH_URL='https://wsm-migrator-api.alphasquadit.com'`
- `NEXT_PUBLIC_SITE_URL='http://localhost:3010'`

## Known Tech Debt (Non-Blocking)

- ESLint warnings exist (unused vars, hooks deps, `<img>` usage). These don’t break build.
- `next-sitemap` currently runs postbuild; when Saleor/PartsLogic are configured it will fetch dynamic paths.

## Next Steps

- If we want a stricter SEO bar later: add richer on-page copy/content for categories/PDP (beyond “schema + headings”).
- Optional: later, add persistence (DB or Saleor app) if we want “store in Saleor” for form submissions.
