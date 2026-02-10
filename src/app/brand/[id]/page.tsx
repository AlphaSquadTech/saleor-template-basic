import BrandPageClient from "./BrandPageClient";
import {
  generateCollectionPageSchema,
  generateBreadcrumbSchema,
  generateItemListSchema,
} from "@/lib/schema";
import { Metadata } from "next";
import { Suspense } from "react";
import { getStoreName } from "@/app/utils/branding";
import type { PLSearchProductsResponse } from "@/lib/api/shopTypes";

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const storeName = getStoreName();
const defaultOgImageUrl = `${baseUrl.replace(/\/$/, "")}/og-image.png`;

export const revalidate = 300; // Cache for 5 minutes (ISR)

const PARTSLOGIC_URL = process.env.NEXT_PUBLIC_PARTSLOGIC_URL || "";
const INITIAL_ITEMS_PER_PAGE = 10;

async function fetchInitialBrandProducts(
  brandSlug: string,
  perPage: number = INITIAL_ITEMS_PER_PAGE
): Promise<PLSearchProductsResponse | null> {
  if (!PARTSLOGIC_URL) {
    console.warn(
      "PARTSLOGIC_URL not configured, skipping initial brand product fetch"
    );
    return null;
  }

  try {
    const params = new URLSearchParams({
      brand_slug: brandSlug,
      page: "1",
      per_page: String(perPage),
    });

    const response = await fetch(
      `${PARTSLOGIC_URL}/api/search/products?${params.toString()}`,
      {
        next: { revalidate: 300 },
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error(`Failed to fetch brand products: ${response.status}`);
      return null;
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching initial brand products:", error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);
  const brandName = decodedId
    .replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

  const title = `${brandName} Products | ${storeName}`;
  const description = `Browse our ${brandName} collection. Find the best products from ${brandName}.`;
  const canonicalUrl = `${baseUrl.replace(/\/$/, "")}/brand/${id}`;

  return {
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
          url: defaultOgImageUrl,
          width: 1200,
          height: 630,
          alt: `${storeName} - ${brandName}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [defaultOgImageUrl],
    },
  };
}

export default async function BrandPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);
  const brandName = decodedId
    .replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

  const initialData = await fetchInitialBrandProducts(id, INITIAL_ITEMS_PER_PAGE);

  // Generate schema.org structured data
  const collectionSchema = generateCollectionPageSchema(
    brandName,
    `Browse our ${brandName} collection. Find the best products from ${brandName}.`,
    `/brand/${id}`
  );

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Brands", url: "/brand" },
    { name: brandName, url: `/brand/${id}` },
  ]);

  const itemListSchema = initialData?.products?.length
    ? generateItemListSchema(
        initialData.products.map((p) => ({
          id: p.id,
          slug: p.slug,
          name: p.name,
          price: p.price_min || 0,
          currency: "USD",
          image: p.primary_image,
          category: p.category || undefined,
        })),
        `${brandName} Products`
      )
    : null;

  return (
    <>
      <h1 className="container mx-auto px-4 md:px-6 pt-8 text-2xl md:text-3xl lg:text-4xl font-semibold text-[var(--color-secondary-800)]">
        {brandName}
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
      <Suspense>
        <BrandPageClient
          brandSlug={id}
          brandName={brandName}
          initialProducts={initialData?.products || null}
          initialPagination={initialData?.pagination || null}
        />
      </Suspense>
    </>
  );
}
