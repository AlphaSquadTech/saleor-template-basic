# saleor-template-basic

Basic Saleor storefront template (Next.js App Router) with:

- Product browsing (homepage, category/search, PDP)
- YMM (Year/Make/Model) via PartsLogic
- Dealer locator (always reachable; shows a "not configured" state if missing env)
- Static CMS pages (Saleor Pages)
- Newsletter pop-up (CMS-backed)
- Inquiries and applications (forms post to `/api/form-submission`)
- No auth, no cart, no checkout, no payments

## Requirements

- Node.js 20+
- Yarn
- A Saleor instance (GraphQL endpoint)
- PartsLogic (for YMM + search)

## Setup

1. Copy `.env.example` to `.env.local` and fill in values.
2. Install and run:

```bash
yarn install
yarn dev
```

## Saleor CMS Page Slugs (Expected)

These routes render content from Saleor Pages by `slug`:

- `/terms-and-conditions` -> `terms-and-conditions`
- `/shipping-returns` -> `shipping-returns`
- `/privacy-policy` -> `privacy-policy` (optional, but included)

Newsletter:

- Newsletter is a pop-up that pulls content from the Saleor Page slug `newsletter`.

These slugs power the form UIs (metadata-driven fields):

- Contact page uses a Saleor Page with slug `contact`
- Dealer application uses slug `dealer-application`
- Product inquiry modal uses slug `item-inquiry`

Form submissions post to `/api/form-submission`. By default it only logs and can optionally forward to a webhook (see `ALLOWED_WEBHOOK_DOMAINS`).

SMTP (optional):

- If `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`, and `SMTP_TO` are set, submissions will also be emailed via SMTP.

## Notes

- `NEXT_PUBLIC_API_URL` should be a full Saleor GraphQL endpoint (ending in `/graphql/`).
- If you use remote images (logo/media), set `NEXT_PUBLIC_IMAGE_HOSTS` so `next/image` can load them.
