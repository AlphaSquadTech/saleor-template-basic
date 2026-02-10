import LocatorClient from "./LocatorClient";
import { Suspense } from "react";
import type { Metadata } from "next";
import { getStoreName } from "@/app/utils/branding";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const storeName = getStoreName();
const title = `Store Locator | ${storeName}`;
const description = `Find a nearby dealer or pickup location for ${storeName}.`;
const canonicalUrl = `${baseUrl.replace(/\/$/, "")}/locator`;
const ogImageUrl = `${baseUrl.replace(/\/$/, "")}/og-image.png`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: canonicalUrl },
  openGraph: {
    title,
    description,
    type: "website",
    url: canonicalUrl,
    siteName: storeName,
    images: [
      { url: ogImageUrl, width: 1200, height: 630, alt: `${storeName} - Store Locator` },
    ],
  },
  twitter: { card: "summary_large_image", title, description, images: [ogImageUrl] },
};

export default function LocatorPage() {
  return (
    <main className="min-h-[100dvh]">
      <div className="container mx-auto px-4 md:px-6 pt-12 md:pt-16 lg:pt-24">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-[var(--color-secondary-800)]">
          Store Locator
        </h1>
      </div>

      <Suspense
        fallback={
          <div className="container mx-auto py-12 px-4 md:px-6 md:py-16 lg:py-24 lg:px-0">
            <p className="text-[var(--color-secondary-600)]">Loading locator…</p>
          </div>
        }
      >
        <LocatorClient />
      </Suspense>
    </main>
  );
}
