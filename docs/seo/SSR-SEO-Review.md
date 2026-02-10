# SSR vs CSR Review (SEO)

This document classifies public-facing routes by what should be rendered as HTML on the server (SSR/RSC) for SEO, vs what can be client-rendered (CSR) without harming SEO.

## Guiding Rule

If a route is intended to be indexed and rank in search (Products, Categories, Blog posts, Home), the critical content should be present in the initial HTML:

- `<title>`, meta description, canonical
- exactly one visible `<h1>`
- primary content: product name/price/images, category product list, blog body, etc.

Client-side interactivity is fine as progressive enhancement, but should not be required for first paint content.

If a route is not intended to be indexed (site search, filter utilities), it can be CSR and should generally be `noindex,follow`.

## Current Route Rendering (Codebase State)

Routes with `page.tsx` as a **client component**:

- `/dealer-application` (CSR)
- `/search` (CSR and already `noindex,follow`)

Most other routes use **server** `page.tsx`, but may still include client islands inside (which is fine as long as HTML contains real content).

## Recommended SSR/CSR Policy

Must SSR (indexable):

- `/` (home)
- `/products/all` (shop)
- `/category/[slug]` (category pages, including paginated/faceted variants)
- `/product/[id]` (PDP)
- `/blog` and `/blog/[slug]`
- CMS pages that are intended to rank:
  - `/shipping-returns`
  - `/terms-and-conditions`
  - `/privacy-policy`
  - `/frequently-asked-questions`
  - `/site-map`

May be SSR but SEO impact is lower (lead-gen/support pages):

- `/contact`
- `/dealer-application` (depends on whether you want it indexed; usually yes if it's a marketing entry point)
- `/locator` (indexable if “Where to buy” is a discovery page; at minimum SSR the headings + empty state)

Can be CSR (non-indexable):

- `/search` (site search; keep `noindex,follow`)

## Notes / Follow-Ups

- Filter/facet URLs under `/category/[slug]?...` are canonicalized to the base category URL (by decision). This is compatible with SSR: you can SSR filtered content for UX while canonical consolidates ranking signals to the base category.
- If we later decide to SSR *filtered* content, we should ensure the canonical remains the base category URL and that the filtered URLs are not in the sitemap.

