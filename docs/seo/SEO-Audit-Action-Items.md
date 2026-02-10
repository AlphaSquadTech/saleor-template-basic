# SEO Audit Action Items (Basic Template)

This list is derived from `docs/seo/SEO-Audit-Checklist-Results.csv`.

## P0 (Fix Before Launch)

1. Fix SSR/no-JS content on core indexable routes (T-001, T-002, T-003)
   - Target routes: `/`, `/products/all`, `/category/{slug}`, `/product/{slug}`, `/blog`, `/blog/{slug}`, `/brand/{slug}`
   - Goal: critical content visible in HTML without running JS (no skeleton-only pages).
   - Starting points:
     - `/` uses multiple Suspense fallbacks in `/Users/arslankhan/Sites/projects/saleor-store-front/saleor-template-basic/src/app/page.tsx`
     - Product/category listing UIs lean heavily on client components (see `.../src/app/products/all/AllProductsClient.tsx`, `.../src/app/category/[slug]/CategoryPageClient.tsx`).

2. Enforce exactly one visible H1 on every indexable page (O-019)
   - Fix pages currently missing H1 (observed in audit run):
     - `/products/all`: `/Users/arslankhan/Sites/projects/saleor-store-front/saleor-template-basic/src/app/products/all/page.tsx`
     - `/product/[id]`: `/Users/arslankhan/Sites/projects/saleor-store-front/saleor-template-basic/src/app/product/[id]/ProductDetailClient.tsx` (ensure server-rendered heading is an `<h1>`)
     - `/contact`: `/Users/arslankhan/Sites/projects/saleor-store-front/saleor-template-basic/src/app/contact/page.tsx` (or adjust shared Heading component usage)
     - `/locator`: `/Users/arslankhan/Sites/projects/saleor-store-front/saleor-template-basic/src/app/locator/page.tsx`
     - `/privacy-policy`: `/Users/arslankhan/Sites/projects/saleor-store-front/saleor-template-basic/src/app/privacy-policy/page.tsx` (ensure `Heading` renders `h1`)

3. Production canonical scheme/host consistency (C-039, C-040)
   - Ensure `NEXT_PUBLIC_SITE_URL` is the canonical `https://` origin (and chosen www/non-www) in production deployments.

## P1 (High Value)

1. Validate structured data with Rich Results Test (S-031)
   - Product schema currently includes `description` that may contain EditorJS JSON. Consider emitting plain-text description for `description` in JSON-LD.
   - File: `/Users/arslankhan/Sites/projects/saleor-store-front/saleor-template-basic/src/lib/schema.ts`

2. Make Organization schema site-wide (S-002)
   - Currently injected on homepage only.
   - Option: inject `Organization` + `WebSite` JSON-LD in the root layout.
   - Files: `/Users/arslankhan/Sites/projects/saleor-store-front/saleor-template-basic/src/app/layout.tsx`, `/Users/arslankhan/Sites/projects/saleor-store-front/saleor-template-basic/src/lib/schema.ts`

3. Reduce `<img>` usage in LCP-critical paths (T-014/P-002)
   - Some components still use raw `<img>`; migrate to `next/image` where appropriate.

4. Decide and implement a definitive faceted URL policy (C-031, C-044, U-019)
   - Options:
     - `noindex,follow` for filter/sort combinations
     - canonicalize filtered URLs to the base category URL

