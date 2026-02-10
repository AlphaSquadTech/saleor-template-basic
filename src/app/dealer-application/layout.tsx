import type { Metadata } from "next"
import { getStoreName } from "@/app/utils/branding"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const storeName = getStoreName();
const title = `Become a Dealer | ${storeName}`;
const description = `Apply to become an authorized ${storeName} dealer. Join our network of retailers and distributors to offer quality oil drain valves to your customers.`;
const canonicalUrl = `${baseUrl.replace(/\/$/, "")}/dealer-application`;
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
        alt: `${storeName} - Become a Dealer`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [ogImageUrl],
  },
}

export default function DealerApplicationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
