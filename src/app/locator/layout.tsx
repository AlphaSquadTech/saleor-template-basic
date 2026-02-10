import type { Metadata } from "next"
import { getStoreName } from "@/app/utils/branding"
import { Suspense } from "react"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const storeName = getStoreName();
const title = `Store Locator | ${storeName}`;
const description = `Find ${storeName} locations near you. Get directions, hours, and contact information for our retail partners and distributors.`;
const canonicalUrl = `${baseUrl.replace(/\/$/, "")}/locator`;

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
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
}

export default function LocatorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <Suspense>{children}</Suspense>
}
