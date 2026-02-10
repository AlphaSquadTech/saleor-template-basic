import { getStoreName } from "@/app/utils/branding";
import {
  generateBreadcrumbSchema,
  generateCollectionPageSchema,
} from "@/lib/schema";
import type { Metadata } from "next";
import { CategoryListingServer } from "./components/categoryListingServer";

const storeName = getStoreName();

export const metadata: Metadata = {
  title: `Categories - ${storeName}`,
  description:
    "Browse product categories organized by type and application.",
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
