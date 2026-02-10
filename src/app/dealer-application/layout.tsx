import type { Metadata } from "next";
import { getStoreName } from "@/app/utils/branding";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const storeName = getStoreName();
const title = `Dealer Application | ${storeName}`;
const description = `Apply to become an authorized dealer for ${storeName}.`;
const canonicalUrl = `${baseUrl.replace(/\/$/, "")}/dealer-application`;
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
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: `${storeName} - Dealer Application`,
      },
    ],
  },
  twitter: { card: "summary_large_image", title, description, images: [ogImageUrl] },
};

export default function DealerApplicationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Page content is client-rendered (Apollo + forms). Provide a server-rendered, visible H1 for SEO.
  return (
    <>
      <header className="container mx-auto max-w-[1276px] px-4 md:px-6 pt-8">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-[var(--color-secondary-800)]">
          Dealer Application
        </h1>
      </header>
      {children}
    </>
  );
}
