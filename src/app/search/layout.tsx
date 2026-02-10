import type { Metadata } from "next";
import { getStoreName } from "@/app/utils/branding";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const storeName = getStoreName();
const canonicalUrl = `${baseUrl.replace(/\/$/, "")}/search`;

// Search result pages are typically not indexable due to infinite combinations of queries/filters.
export const metadata: Metadata = {
  title: `Search | ${storeName}`,
  description: `Search products at ${storeName}.`,
  alternates: { canonical: canonicalUrl },
  robots: {
    index: false,
    follow: true,
  },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}

