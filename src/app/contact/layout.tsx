import type { Metadata } from "next";
import { getStoreName } from "@/app/utils/branding";

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const storeName = getStoreName();
const title = `Contact Us | ${storeName}`;
const description =
  "Contact us for customer support, product inquiries, or general questions.";
const canonicalUrl = `${baseUrl}/contact`;

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
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
