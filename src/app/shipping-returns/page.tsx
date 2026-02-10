import { Suspense } from "react";
import type { Metadata } from "next";
import AncillaryContent from "@/app/components/ancillary/AncillaryContent";
import ContentSkeleton from "@/app/components/skeletons/ContentSkeleton";
import { getStoreName } from "@/app/utils/branding";
import Breadcrumb from "@/app/components/reuseableUI/breadcrumb";
import Heading from "@/app/components/reuseableUI/heading";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const storeName = getStoreName();
const title = `Shipping & Returns | ${storeName}`;
const description = `Learn about ${storeName} shipping options, delivery times, return policy, and how to process returns for your products.`;
const canonicalUrl = `${baseUrl.replace(/\/$/, "")}/shipping-returns`;

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

export default function ShippingAndReturnsPage() {
  const pageTitle = "Shipping & Returns";

  return (
    <main className="h-full w-full">
      <div className="container mx-auto max-w-[1276px]">
        <div className="flex flex-col items-start w-full px-4 md:px-6 gap-8 py-12 md:py-16 lg:py-24">
          <div className="flex flex-col items-start gap-5 w-full">
            <Breadcrumb
              items={[
                { text: "Home", link: "/" },
                { text: "Shipping & Returns", link: "/shipping-returns" },
              ]}
            />
            <Heading content={pageTitle} as="h1" />
          </div>

          <section className="w-full">
            <Suspense fallback={<ContentSkeleton />}>
              <AncillaryContent slug="shipping-returns" />
            </Suspense>
          </section>
        </div>
      </div>
    </main>
  );
}
