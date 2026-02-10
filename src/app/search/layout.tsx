import type { Metadata } from "next"
import { getStoreName } from "@/app/utils/branding"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const storeName = getStoreName();
const title = `Search Results | ${storeName}`;
const description = `Search for products at ${storeName}.`;
const canonicalUrl = `${baseUrl.replace(/\/$/, "")}/search`;
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
        alt: `${storeName} - Search`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [ogImageUrl],
  },
  robots: {
    // E-commerce best practice: keep internal search results out of the index.
    index: false,
    follow: true,
  },
}

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
