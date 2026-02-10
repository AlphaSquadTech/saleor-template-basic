import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumb from "@/app/components/reuseableUI/breadcrumb";
import Heading from "@/app/components/reuseableUI/heading";
import EditorRenderer from "@/app/components/richText/EditorRenderer";
import { fetchBlogBySlug } from "@/graphql/queries/getBlogs";
import { getStoreName } from "@/app/utils/branding";
import {
  generateBlogPostingSchema,
  generateBreadcrumbSchema,
} from "@/lib/schema";
import { notFound } from "next/navigation";

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const storeName = getStoreName();

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchBlogBySlug(slug);

  if (!post || !post.title) {
    return {
      title: `Blog Post Not Found | ${storeName}`,
    };
  }

  const title = `${post.title} | ${storeName}`;
  const description = post.title;
  const canonicalUrl = `${baseUrl.replace(/\/$/, "")}/blog/${slug}`;
  const ogImageUrl = `${baseUrl.replace(/\/$/, "")}/og-image.png`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      type: "article",
      url: canonicalUrl,
      siteName: storeName,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${storeName} - ${post.title}`,
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
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await fetchBlogBySlug(slug);

  if (!post || !post.title) {
    notFound();
  }

  // Format date if available
  const formattedDate = post.created
    ? new Date(post.created).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  // Generate schema.org structured data
  const blogSchema = generateBlogPostingSchema(
    post.title,
    post.title,
    `/blog/${slug}`,
    post.created || new Date().toISOString(),
    post.created || new Date().toISOString()
  );

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Blog", url: "/blog" },
    { name: post.title, url: `/blog/${slug}` },
  ]);

  return (
    <main className="h-full w-full">
      {/* Schema.org structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <div className="container mx-auto max-w-[1276px]">
        <div className="flex flex-col items-start w-full gap-8 px-4 md:px-6 py-12 md:py-16 lg:py-24">
          <div className="flex flex-col items-start gap-5 w-full">
            <Breadcrumb
              items={[
                { text: "Home", link: "/" },
                { text: "BLOG", link: "/blog" },
                { text: post.title, link: `/blog/${post.slug}` },
              ]}
            />
            <Heading as="h1" content={post.title} />
          </div>

          <div className="w-full flex flex-col items-start gap-6">
            {/* Blog Content */}
            <div className="w-full">
              <EditorRenderer content={post.content} />
            </div>

            {/* Back to Blog Link */}
            <div className="w-full pt-8 border-t border-[var(--color-secondary-200)]">
              <Link
                href="/blog"
                className="text-[var(--color-primary-600)] hover:underline inline-flex items-center gap-2"
              >
                ← Back to all blogs
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
