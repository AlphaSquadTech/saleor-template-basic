import React from "react";
import { Metadata } from "next";
import { fetchDynamicPageBySlug } from "@/graphql/queries/getDynamicPageBySlug";
import { getStoreName } from "@/app/utils/branding";
import { notFound } from "next/navigation";
import DynamicPageRenderer from "../components/dynamicPage/DynamicPageRenderer";

// Force dynamic rendering - don't try to statically generate these pages
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = false;

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const storeName = getStoreName();

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const pageData = await fetchDynamicPageBySlug(slug);

    if (!pageData) {
      return {
        title: `Page Not Found | ${storeName}`,
        description: "The requested page could not be found.",
      };
    }

    const title = pageData.seoTitle || pageData.title || `${slug} | ${storeName}`;
    const description = pageData.seoDescription || pageData.excerpt || `${pageData.title} - ${storeName}`;
    const canonicalUrl = `${baseUrl.replace(/\/$/, "")}/${slug}`;
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
        type: "website",
        url: canonicalUrl,
        siteName: storeName,
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: `${storeName} - ${pageData.title || title}`,
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
  } catch (error) {
    console.error("Error generating metadata for dynamic page:", error);
    return {
      title: `${slug} | ${storeName}`,
      description: `${slug} page at ${storeName}`,
    };
  }
}

export default async function DynamicPage({ params }: PageProps) {
  const { slug } = await params;

  const pageData = await fetchDynamicPageBySlug(slug);
  if (!pageData) {
    notFound();
  }

  return (
    <main className="min-h-screen">
      <DynamicPageRenderer pageData={pageData} />
    </main>
  );
}
