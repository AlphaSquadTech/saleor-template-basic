import BrandPageClient from "./BrandPageClient";
import {
  generateCollectionPageSchema,
  generateBreadcrumbSchema,
} from "@/lib/schema";
import { Metadata } from "next";
import { Suspense } from "react";
import { getStoreName } from "@/app/utils/branding";

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const storeName = getStoreName();
const defaultOgImageUrl = `${baseUrl.replace(/\/$/, "")}/og-image.png`;

export const revalidate = 300; // Cache for 5 minutes (ISR)

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
      <Suspense>
        <BrandPageClient />
      </Suspense>
    </>
  );
}
