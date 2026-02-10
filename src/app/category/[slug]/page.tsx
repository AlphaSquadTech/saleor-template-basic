import CategoryPageClient from "./CategoryPageClient";
import {
  generateProductCategoryPageSchema,
  generateBreadcrumbSchema,
  generateItemListSchema,
} from "@/lib/schema";
import { Metadata } from "next";
import { Suspense } from "react";
import { getStoreName } from "@/app/utils/branding";
import { PLSearchProduct, PLSearchProductsResponse } from "@/lib/api/shop";

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const storeName = getStoreName();
const defaultOgImageUrl = `${baseUrl.replace(/\/$/, "")}/og-image.png`;

export const revalidate = 300; // Cache for 5 minutes (ISR)

const PARTSLOGIC_URL = process.env.NEXT_PUBLIC_PARTSLOGIC_URL || "";
const INITIAL_ITEMS_PER_PAGE = 10;

// Server-side function to fetch initial products for SSR
async function fetchInitialProducts(
  slug: string,
  perPage: number = INITIAL_ITEMS_PER_PAGE
): Promise<PLSearchProductsResponse | null> {
  if (!PARTSLOGIC_URL) {
    console.warn("PARTSLOGIC_URL not configured, skipping initial product fetch");
    return null;
  }

  try {
    const params = new URLSearchParams({
      category_slug: slug,
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

// Helper function to normalize GraphQL URL
// Redirect support intentionally removed in this template.

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const categoryName = decodedSlug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

  const title = `${categoryName} | ${storeName}`;
  const description = `Browse our ${categoryName} collection. Find the best products in ${categoryName} category.`;
  const canonicalUrl = `${baseUrl.replace(/\/$/, "")}/category/${slug}`;

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
          alt: `${storeName} - ${categoryName}`,
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

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // SEO policy: filtered/sorted URLs canonicalize to the base category URL.
  // We intentionally ignore query params for canonical generation.
  void searchParams;
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const categoryName = decodedSlug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

  // Fetch initial products server-side for SSR (critical for SEO)
  const initialData = await fetchInitialProducts(slug, INITIAL_ITEMS_PER_PAGE);

  // Generate schema.org structured data
  const categoryPageSchema = generateProductCategoryPageSchema(
    categoryName,
    `Browse our ${categoryName} collection. Find the best products in ${categoryName} category.`,
    `/category/${slug}`
  );

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Categories", url: "/category" },
    { name: categoryName, url: `/category/${slug}` },
  ]);

  // Generate ItemList schema for products (SEO)
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
        `${categoryName} Products`
      )
    : null;

  return (
    <>
      <h1 className="container mx-auto px-4 md:px-6 pt-8 text-2xl md:text-3xl lg:text-4xl font-semibold text-[var(--color-secondary-800)]">
        {categoryName}
      </h1>
      {/* Schema.org structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(categoryPageSchema) }}
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
        <CategoryPageClient
          slug={slug}
          initialProducts={initialData?.products || null}
          initialPagination={initialData?.pagination || null}
          initialCategoryName={categoryName}
        />
      </Suspense>
    </>
  );
}
