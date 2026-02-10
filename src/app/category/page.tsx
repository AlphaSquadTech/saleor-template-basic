import { getStoreName } from "@/app/utils/branding";
import {
  generateBreadcrumbSchema,
  generateCollectionPageSchema,
} from "@/lib/schema";
import type { Metadata } from "next";
import { CategoryListingServer } from "./components/categoryListingServer";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const storeName = getStoreName();
const title = `Categories | ${storeName}`;
const description = "Browse product categories organized by type and application.";
const canonicalUrl = `${baseUrl.replace(/\/$/, "")}/category`;
const ogImageUrl = `${baseUrl.replace(/\/$/, "")}/og-image.png`;

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
        alt: `${storeName} - Categories`,
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

export default function CategoryPage() {
  // Generate   schema.org structured data
  const collectionSchema = generateCollectionPageSchema(
    "Categories",
    "Browse our product categories. Find products organized by type, category, and performance level.",
    "/category"
  );

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Categories", url: "/category" },
  ]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Schema.org structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <h1 className="text-3xl font-normal font-primary mb-2 uppercase">
        All Categories
      </h1>
      <p className="text-gray-600 mb-6">
        Browse our wide selection of product categories.
      </p>

      <CategoryListingServer />
    </div>
  );
}
