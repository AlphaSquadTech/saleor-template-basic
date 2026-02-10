# Progress / Handoff Notes

This file exists so work can continue in a fresh session with minimal context.

## Last Completed

### URL-driven SSR for listing pages
- `/products/all` now reads query params on the server and SSR-fetches PartsLogic results for:
  - `?page=`, `?per_page=`, `?q=`
  - also supports (SSR) `?fitment_pairs=`, `?category_slug=`, `?brand_slug=`, `?sort_by=`
  - file: `src/app/products/all/page.tsx`
- `/category/[slug]` now reads query params on the server and SSR-fetches PartsLogic results for:
  - `?page=`, `?per_page=`, `?q=`
  - file: `src/app/category/[slug]/page.tsx`

### SSR product grids (real HTML links)
Because the existing `ProductCard` is a client component, the listing grids were not present as plain HTML anchors in the initial response.

To satisfy SEO SSR requirements without breaking the current client UX:
- Added a server component `ProductCardServer`:
  - file: `src/app/components/reuseableUI/productCardServer.tsx`
- Both `/products/all` and `/category/[slug]` render an SSR-only grid using `ProductCardServer`:
  - file: `src/app/products/all/page.tsx`
  - file: `src/app/category/[slug]/page.tsx`
- The SSR-only grids are hidden as soon as JS is available to avoid duplicated on-screen content:
  - adds `document.documentElement.classList.add('js')` in `src/app/layout.tsx`
  - CSS rule: `.js .ssr-only-grid { display: none; }` in `src/app/globals.css`

### Client-side progressive enhancement updates
- `/products/all` client logic updated to:
  - treat SSR empty results as “real SSR” (no forced refetch)
  - keep URL keys aligned with PartsLogic (`category_slug`, `brand_slug`, `sort_by`, `per_page`)
  - file: `src/app/products/all/AllProductsClient.tsx`
- `/category/[slug]` client now:
  - keeps state driven by the URL (`page`, `per_page`, `q`)
  - updates URL via `router.replace` for pagination/search so server SSR matches the URL
  - file: `src/app/category/[slug]/CategoryPageClient.tsx`

### Bundle safety: prevent client imports of server shop module
- Added `import "server-only";` to `src/lib/api/shop.ts` so any accidental client-side value import fails fast.
- Added `src/lib/api/shopTypes.ts` for type-only imports in client components (prevents any temptation to import from `shop.ts`).

## Verified Locally
- `yarn build` succeeds.
- `curl` of listing pages includes real product links in the HTML via the SSR-only grid.
- Canonical policy retained:
  - `/category/[slug]?...` canonicalizes to `/category/[slug]` (query params ignored for canonical).

## Remaining / Next Steps

### SEO/SSR follow-ups
- Decide whether `/products/all` should canonicalize filtered URLs to the base or self-canonicalize when `?q=` is present (currently canonical stays base).
- Consider `noindex` policy for internal search-like URLs if required (not implemented).

### Bundle-size and code-splitting P0 (requested earlier)
- `src/lib/api/shop.ts` is still a large “kitchen sink” file.
  - The previously suggested P0 is to split it and introduce thin route-handler wrappers to avoid importing all shop code into client or into routes that only need small pieces.
  - This should be done carefully to avoid breaking YMM/search/PDP.

## Open Questions
- For “page 2” URLs on category/product listings:
  - Should SSR show only that page, or should it accumulate results (“load more” style)? Current behavior is standard pagination (page shows that page’s results).
