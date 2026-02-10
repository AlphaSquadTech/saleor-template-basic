import {
  generateOrganizationSchema,
  generateWebsiteSchema,
} from "@/lib/schema";
import type { Metadata } from "next";
import { Suspense } from "react";
import { SkeletonLoader } from "./components/reuseableUI/skeletonLoader";
import { BundleProducts } from "./components/showroom/bundleProducts";
import { CategoryGridServer } from "./components/showroom/categoryGridServer";
import { BrandsSwiperServer } from "./components/showroom/brandsSwiperServer";
import { OffersSwiper } from "./components/showroom/offersSwiper";
import { ProductGrid } from "./components/showroom/productGrid";
import { ShowroomHeroCarousel } from "./components/showroom/showroomHeroCarousel";
import { TestimonialsGrid } from "./components/showroom/testimonialsGrid";
import { getStoreName } from "./utils/branding";
import dynamic from "next/dynamic";
import { FeaturesStrip } from "./components/showroom/featuresStrip";
import {
  LazyInstallationSection,
  LazyIndustriesSection,
} from "./components/showroom/lazySections";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const storeName = getStoreName();
const ogImageUrl = `${baseUrl.replace(/\/$/, "")}/og-image.png`;

export const metadata: Metadata = {
  title: storeName,
  description:
    "Discover featured products, best sellers, and exclusive offers.",
  alternates: {
    canonical: baseUrl.replace(/\/$/, ""),
  },
  openGraph: {
    title: storeName,
    description: "Discover featured products, best sellers, and exclusive offers.",
    type: "website",
    url: baseUrl.replace(/\/$/, ""),
    siteName: storeName,
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: `${storeName} - Storefront`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: storeName,
    description: "Discover featured products, best sellers, and exclusive offers.",
    images: [ogImageUrl],
  },
};

// Revalidate every 1 hour (3600 seconds)
export const revalidate = 3600;
const Promotions = dynamic(
  () =>
    import("./components/showroom/promotion").then((mod) => ({
      default: mod.Promotions,
    })),
  {
    loading: () => (
      <div className="w-full h-[704px] bg-gray-200 animate-pulse" />
    ),
  }
);

export default function Home() {
  const siteUrl = baseUrl.replace(/\/$/, "");

  const organizationSchema = generateOrganizationSchema(
    storeName,
    siteUrl,
    "/logo.png",
    []
  );

  const websiteSchema = generateWebsiteSchema(storeName, siteUrl, "/search");

  return (
    <>
      {/* Schema.org structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />

      <Suspense fallback={<SkeletonLoader type="hero" />}>
        <ShowroomHeroCarousel />
      </Suspense>

      <div className="flex flex-col ">
        {/* Featured Products */}
        <>
          <Suspense
            fallback={
              <div className="container mx-auto m-24 flex flex-col gap-6 lg:gap-16">
                <div className="w-full max-w-[30%] bg-gray-200   animate-pulse rounded h-12" />
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <SkeletonLoader type="product" count={5} />
                </div>
              </div>
            }
          >
            <ProductGrid
              heading={"FEATURED PRODUCTS"}
              collection="featured-products"
              count={5}
            />
          </Suspense>
        </>

        {/* Categories */}
        <>
          <Suspense
            fallback={
              <div className="container mx-auto m-24 flex flex-col gap-16">
                <div className="w-full flex justify-between items-center">
                  <div className="w-full max-w-3xs bg-gray-200   animate-pulse rounded h-12" />
                  <div className="flex gap-2">
                    <div className="rounded-full size-10 bg-gray-200 animate-pulse " />
                    <div className="rounded-full size-10 bg-gray-200 animate-pulse " />
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  <SkeletonLoader type="category" count={5} />
                </div>
              </div>
            }
          >
            <CategoryGridServer />
          </Suspense>
        </>
        {/* Installation Section - Lazy loaded */}
        <LazyInstallationSection />
        <Suspense
          fallback={
            <div className="relative isolate bg-[var(--color-primary)] px-4 md:px-6 lg:px-20 overflow-hidden">
              <div className="relative mx-auto max-w-7xl w-full py-6 md:py-8">
                <div className="flex flex-col md:flex-row items-stretch justify-between">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 py-4 md:py-0 md:px-8"
                    >
                      <div className="rounded-full size-10 bg-[var(--color-primary)] animate-pulse" />
                      <div className="space-y-2">
                        <div className="h-5 w-40 bg-[var(--color-primary)] rounded animate-pulse" />
                        <div className="h-4 w-52 bg-[var(--color-primary)] rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          }
        >
          <FeaturesStrip />
        </Suspense>

        <Promotions />
        <Suspense
          fallback={
            <div className="relative isolate bg-[var(--color-primary)] px-4 md:px-6 lg:px-20 overflow-hidden">
              <div className="relative mx-auto max-w-7xl w-full py-6 md:py-8">
                <div className="flex flex-col md:flex-row items-stretch justify-between">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 py-4 md:py-0 md:px-8"
                    >
                      <div className="rounded-full size-10 bg-[var(--color-primary)] animate-pulse" />
                      <div className="space-y-2">
                        <div className="h-5 w-40 bg-[var(--color-primary)] rounded animate-pulse" />
                        <div className="h-4 w-52 bg-[var(--color-primary)] rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          }
        >
          <FeaturesStrip
            slug="features-strip-2"
            className="!bg-white border-y border-gray-600 [&>div>div>div>div>p]:!text-gray-700"
          />
        </Suspense>

        {/* Industries Section - Lazy loaded */}
        <LazyIndustriesSection />
        {/* Best Sellers */}
        <>
          <Suspense
            fallback={
              <div className="container mx-auto m-24 flex flex-col gap-16">
                <div className="w-full max-w-3xs bg-gray-200   animate-pulse rounded h-12" />
                <div className="grid grid-cols-2 md:grid-cols-3  lg:grid-cols-5 gap-3">
                  <SkeletonLoader type="product" count={5} />
                </div>
              </div>
            }
          >
            <ProductGrid
              heading={"Best Sellers"}
              collection="best-sellers"
              count={5}
            />
          </Suspense>
        </>

        {/* Bundle Products */}
        <>
          <Suspense
            fallback={
              <div className="container mx-auto m-24 flex flex-col gap-16">
                <div className="w-full flex justify-between items-center">
                  <div className="w-full max-w-3xs bg-gray-200   animate-pulse rounded h-12" />
                  <div className="rounded w-28 h-8 bg-gray-200 animate-pulse " />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  <SkeletonLoader type="category" count={5} />
                </div>
              </div>
            }
          >
            <BundleProducts collection="bundle-2" />
          </Suspense>
        </>
        <Suspense
          fallback={
            <div
              className="py-24"
              style={{ backgroundColor: "var(--color-secondary-50)" }}
            >
              <div className="container mx-auto">
                <div className="w-full max-w-3xs bg-gray-200 animate-pulse rounded h-12 mb-16" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="bg-gray-200 rounded-lg p-8 animate-pulse h-64"
                    >
                      <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
                      <div className="space-y-2 mb-6">
                        <div className="h-4 bg-gray-300 rounded"></div>
                        <div className="h-4 bg-gray-300 rounded w-5/6"></div>
                        <div className="h-4 bg-gray-300 rounded w-4/6"></div>
                      </div>
                      <div className="flex items-center gap-3 mt-auto">
                        <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                        <div className="h-4 bg-gray-300 rounded w-24"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          }
        >
          <TestimonialsGrid first={6} />
        </Suspense>

        {/* Brands */}
        <Suspense
          fallback={
            <div
              className="py-12 px-4 md:px-6 md:py-16 lg:py-24 lg:px-0"
              style={{ backgroundColor: "var(--color-secondary-920)" }}
            >
              <div className="container mx-auto">
                <div className="w-full max-w-3xs bg-gray-200 animate-pulse rounded h-12 mb-16" />
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                  {[1, 2, 3, 4, 5].map((item) => (
                    <div
                      key={item}
                      className="bg-gray-200 rounded-lg p-6 animate-pulse h-32"
                    >
                      <div className="h-16 bg-gray-300 rounded mb-4"></div>
                      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          }
        >
          <BrandsSwiperServer />
        </Suspense>
      </div>
    </>
  );
}
