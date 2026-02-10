import AllProductsClient from "./AllProductsClient";
import {
  generateCollectionPageSchema,
  generateBreadcrumbSchema,
  generateItemListSchema,
} from "@/lib/schema";
import { Metadata } from "next";
import { Suspense } from "react";
import { getStoreName } from "@/app/utils/branding";

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const storeName = getStoreName();
const title = `All Products | ${storeName}`;
const description =
  `Browse the complete collection of ${storeName} products.`;
const canonicalUrl = `${baseUrl.replace(/\/$/, "")}/products/all`;

const PARTSLOGIC_URL = process.env.NEXT_PUBLIC_PARTSLOGIC_URL || "";
const INITIAL_ITEMS_PER_PAGE = 20;

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
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export const revalidate = 300; // Cache for 5 minutes (ISR)

// Server-side function to fetch initial products for SSR
async function fetchInitialProducts(perPage: number = INITIAL_ITEMS_PER_PAGE) {
  if (!PARTSLOGIC_URL) {
    console.warn("PARTSLOGIC_URL not configured, skipping initial product fetch");
    return null;
  }

  try {
    const params = new URLSearchParams({
      page: "1",
      per_page: String(perPage),
    });

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

export default async function ProductsPage() {
  // Fetch initial products server-side for SSR (critical for SEO)
  const initialData = await fetchInitialProducts(INITIAL_ITEMS_PER_PAGE);

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
      <Suspense
        fallback={
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
            <div className="w-8 h-8 border-4 border-[var(--color-secondary-300)] border-t-[var(--color-primary-500)] rounded-full animate-spin" />
          </div>
        }
      >
        <AllProductsClient
          initialProducts={initialData?.products || null}
          initialPagination={initialData?.pagination || null}
          initialFacets={initialData?.facets || null}
        />
      </Suspense>
    </>
  );
}
