import AllProductsClient from "./AllProductsClient";
import {
  generateCollectionPageSchema,
  generateBreadcrumbSchema,
  generateItemListSchema,
} from "@/lib/schema";
import { Metadata } from "next";
import { Suspense } from "react";
import { getStoreName } from "@/app/utils/branding";
import { ProductCardServer } from "@/app/components/reuseableUI/productCardServer";

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const storeName = getStoreName();
const title = `All Products | ${storeName}`;
const description =
  `Browse the complete collection of ${storeName} products.`;
const canonicalUrl = `${baseUrl.replace(/\/$/, "")}/products/all`;
const ogImageUrl = `${baseUrl.replace(/\/$/, "")}/og-image.png`;

const PARTSLOGIC_URL = process.env.NEXT_PUBLIC_PARTSLOGIC_URL || "";
const INITIAL_ITEMS_PER_PAGE = 20;

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parsePositiveInt(
  value: string | undefined,
  fallback: number,
  opts?: { min?: number; max?: number }
) {
  const n = value ? Number.parseInt(value, 10) : Number.NaN;
  const min = opts?.min ?? 1;
  const max = opts?.max ?? 100;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: canonicalUrl,
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: canonicalUrl,
    siteName: storeName,
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: `${storeName} - All Products`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [ogImageUrl],
  },
};

export const revalidate = 300; // Cache for 5 minutes (ISR)

// Server-side function to fetch initial products for SSR
async function fetchInitialProducts(args: {
  page: number;
  perPage: number;
  q?: string;
  fitmentPairs?: string;
  categorySlugs?: string[];
  brandSlugs?: string[];
  sortBy?: string;
}) {
  if (!PARTSLOGIC_URL) {
    console.warn("PARTSLOGIC_URL not configured, skipping initial product fetch");
    return null;
  }

  try {
    const params = new URLSearchParams({
      page: String(args.page),
      per_page: String(args.perPage),
    });

    if (args.q) params.set("q", args.q);
    if (args.fitmentPairs) params.set("fitment_pairs", args.fitmentPairs);
    if (args.sortBy) params.set("sort_by", args.sortBy);

    args.categorySlugs?.forEach((slug) => params.append("category_slug", slug));
    args.brandSlugs?.forEach((slug) => params.append("brand_slug", slug));

    const response = await fetch(
      `${PARTSLOGIC_URL}/api/search/products?${params.toString()}`,
      {
        next: { revalidate: 300 }, // Cache for 5 minutes
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error(`Failed to fetch products: ${response.status}`);
      return null;
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching initial products:", error);
    return null;
  }
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const page = parsePositiveInt(firstParam(sp.page), 1, { min: 1 });
  const perPage = parsePositiveInt(
    firstParam(sp.per_page),
    INITIAL_ITEMS_PER_PAGE,
    { min: 1, max: 100 }
  );
  const q = firstParam(sp.q)?.trim() || undefined;
  const fitmentPairs =
    firstParam(sp.fitment_pairs)?.trim() || undefined;
  const sortBy = firstParam(sp.sort_by)?.trim() || undefined;

  const categorySlugsRaw = sp.category_slug;
  const brandSlugsRaw = sp.brand_slug;
  const categorySlugs = Array.isArray(categorySlugsRaw)
    ? categorySlugsRaw
    : categorySlugsRaw
      ? [categorySlugsRaw]
      : undefined;
  const brandSlugs = Array.isArray(brandSlugsRaw)
    ? brandSlugsRaw
    : brandSlugsRaw
      ? [brandSlugsRaw]
      : undefined;

  // Fetch initial products server-side for SSR (critical for SEO)
  const initialData = await fetchInitialProducts({
    page,
    perPage,
    q,
    fitmentPairs,
    sortBy,
    categorySlugs,
    brandSlugs,
  });

  // Generate schema.org structured data
  const collectionSchema = generateCollectionPageSchema(
    "All Products",
    "Browse our complete collection of products. Find the best products across all categories.",
    "/products/all"
  );

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Products", url: "/products/all" },
  ]);

  // Generate ItemList schema for products (SEO)
  const itemListSchema = initialData?.products?.length
    ? generateItemListSchema(
        initialData.products.map((p: { slug?: string; id: string; name: string; price_min?: number; media?: Array<{ url: string }>; category?: { id: string; name: string } }) => ({
          id: p.id,
          slug: p.slug,
          name: p.name,
          price: p.price_min || 0,
          currency: "USD",
          image: p.media?.[0]?.url,
          category: p.category || undefined,
        })),
        "All Products"
      )
    : null;

  return (
    <>
      <h1 className="container mx-auto px-4 md:px-6 pt-8 text-2xl md:text-3xl lg:text-4xl font-semibold text-[var(--color-secondary-800)]">
        All Products
      </h1>
      {/* Schema.org structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {itemListSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
        />
      )}

      {/* SSR baseline product grid for SEO/no-JS. Hidden once JS is available. */}
      {Array.isArray(initialData?.products) && (
        <section className="container mx-auto mt-8 px-4 md:px-6 ssr-only-grid">
          {initialData.products.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold text-[var(--color-secondary-800)]">
                No products found
              </h2>
              <p className="mt-2 text-[var(--color-secondary-600)]">
                Try adjusting your filters or search criteria.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {initialData.products.map(
                (p: {
                  id: string;
                  name: string;
                  slug?: string;
                  media?: Array<{ url: string }>;
                  category?: { name: string } | null;
                  price_min?: number | null;
                  price_max?: number | null;
                  skus?: Array<string> | string;
                }) => {
                  const href = `/product/${encodeURIComponent(p.slug || "")}`;
                  const imageUrl = p.media?.[0]?.url || "";
                  const price = p.price_min || 0;
                  return (
                    <ProductCardServer
                      key={p.id}
                      id={p.id}
                      name={p.name}
                      image={imageUrl}
                      href={href}
                      price={price}
                      category={p.category?.name || ""}
                      onSale={(p.price_max || 0) > (p.price_min || 0)}
                      skus={p.skus}
                    />
                  );
                }
              )}
            </div>
          )}
        </section>
      )}

      <Suspense
        fallback={
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
            <div className="w-8 h-8 border-4 border-[var(--color-secondary-300)] border-t-[var(--color-primary-500)] rounded-full animate-spin" />
          </div>
        }
      >
        <AllProductsClient
          initialProducts={initialData?.products ?? null}
          initialPagination={initialData?.pagination ?? null}
          initialFacets={initialData?.facets ?? null}
        />
      </Suspense>
    </>
  );
}
