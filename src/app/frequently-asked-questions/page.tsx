import AncillaryContent from "@/app/components/ancillary/AncillaryContent";
import ContentSkeleton from "@/app/components/skeletons/ContentSkeleton";
import { getStoreName } from "@/app/utils/branding";
import type { Metadata } from "next";
import { Suspense } from "react";
import Breadcrumb from "../components/reuseableUI/breadcrumb";
import Heading from "../components/reuseableUI/heading";

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const storeName = getStoreName();
const title = `Frequently Asked Questions | ${storeName}`;
const description =
  "Find answers to frequently asked questions about products, ordering, shipping, returns, and compatibility.";
const canonicalUrl = `${baseUrl}/frequently-asked-questions`;

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

export default function FAQPage() {
  const derivedTitle = "FAQS";

  return (
    <main className="h-full w-full">
      <div className="container mx-auto max-w-[1276px]">
        <div className="flex flex-col items-start w-full px-4 md:px-6 py-12 md:py-16 lg:py-24">
          <div className="flex flex-col items-start gap-5 mb-6 w-full">
            <Breadcrumb
              items={[
                { text: "Home", link: "/" },
                { text: "FAQS", link: "/frequently-asked-questions" },
              ]}
            />
            <Heading as="h1" content={derivedTitle} />
          </div>
          <section className="w-full">
            <Suspense fallback={<ContentSkeleton />}>
              <AncillaryContent slug="frequently-asked-questions" />
            </Suspense>
          </section>
        </div>
      </div>
    </main>
  );
}
