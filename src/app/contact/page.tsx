import ContactClient from "./ContactClient";
import { getStoreName } from "@/app/utils/branding";
import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const storeName = getStoreName();
const title = `Contact Us | ${storeName}`;
const description = `Get in touch with ${storeName} for product questions, dealer inquiries, or support.`;
const canonicalUrl = `${baseUrl.replace(/\/$/, "")}/contact`;
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
      { url: ogImageUrl, width: 1200, height: 630, alt: `${storeName} - Contact Us` },
    ],
  },
  twitter: { card: "summary_large_image", title, description, images: [ogImageUrl] },
};

export default function ContactPage() {
  return (
    <main className="min-h-[100dvh]">
      <div className="container mx-auto max-w-[1276px] px-4 md:px-6 pt-12 md:pt-16 lg:pt-24">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-[var(--color-secondary-800)]">
          Contact Us
        </h1>
        <p className="mt-2 text-[var(--color-secondary-600)]">
          Get in touch with {storeName} for product questions, dealer inquiries, or support.
        </p>
      </div>

      <ContactClient />
    </main>
  );
}
