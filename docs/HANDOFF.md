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

## Local Dev

1. `yarn install`
2. Copy `.env.example` -> `.env.local`
3. `yarn dev`

## Testing / Verification Done

- `yarn lint` (warnings only).
- `yarn build`:
  - Passes with env vars unset.
  - Passes with a real Saleor + PartsLogic env set.

## Known Tech Debt (Non-Blocking)

- ESLint warnings exist (unused vars, hooks deps, `<img>` usage). These don’t break build.
- `next-sitemap` currently runs postbuild; when Saleor/PartsLogic are configured it will fetch dynamic paths.

## Next Steps (Decisions Needed)

Decisions (confirmed):

- Keep blog.
- Newsletter is a pop-up (CMS-backed), not a page route.
- Dealer locator should show the empty state when not configured.
- Form delivery should support SMTP (env-configurable).

Remaining:

- Optional: later, add persistence (DB or Saleor app) if we want “store in Saleor”.
