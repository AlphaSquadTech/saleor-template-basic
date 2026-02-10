import React, { Suspense } from "react";
import type { Metadata } from "next";
import Heading from "../components/reuseableUI/heading";
import Breadcrumb from "../components/reuseableUI/breadcrumb";
import BlogList from "../components/blog/BlogList";
import { fetchBlogPages } from "@/graphql/queries/getBlogs";
import { getStoreName } from "@/app/utils/branding";
import {
  generateCollectionPageSchema,
  generateBreadcrumbSchema,
} from "@/lib/schema";

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const storeName = getStoreName();
const title = `Blog | ${storeName}`;
const description =
  "Read the latest articles, guides, and tips.";
const canonicalUrl = `${baseUrl.replace(/\/$/, "")}/blog`;
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
        alt: `${storeName} - Blog`,
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

export default async function BlogPage() {
  // Fetch blog posts from CMS
  const blogs = await fetchBlogPages();

  // Generate schema.org structured data
  const collectionSchema = generateCollectionPageSchema(
    "Blog",
    "Read our latest articles, news, and insights about our products and services.",
    "/blog"
  );

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Blog", url: "/blog" },
  ]);

  return (
    <main className="h-full w-full">
      {/* Schema.org structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <div className="container mx-auto max-w-[1276px]">
        <div className="flex flex-col items-start w-full gap-16 px-4 md:px-6 py-12 md:py-16 lg:py-24">
          <div className="flex flex-col items-start gap-5 w-full">
            <Breadcrumb
              items={[
                { text: "Home", link: "/" },
                { text: "BLOG", link: "/blog" },
              ]}
            />
            <Heading as="h1" content="Blog" />
          </div>

          <Suspense fallback={<div>Loading blogs...</div>}>
            <BlogList blogs={blogs} pageSize={9} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
