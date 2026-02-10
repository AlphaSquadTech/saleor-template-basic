import type { Metadata } from "next";
import { getProductBySlug } from "./actions";
import { ProductDetailClient } from "./ProductDetailClient";
import { getStoreName } from "@/app/utils/branding";
import {
  generateProductSchema,
  generateBreadcrumbSchema,
} from "@/lib/schema";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const slug = decodeURIComponent(id);
  const product = await getProductBySlug(slug);
  const storeName = getStoreName();
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  if (!product) {
    return {
      title: `Product Not Found - ${storeName}`,
      description: "The requested product could not be found.",
    };
  }

  const normalize = (s: string) =>
    s
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/gi, " ")
      .replace(/\s+/g, " ")
      .trim();

  // Parse description for meta - strip HTML and limit length
  let metaDescription = "";
  try {
    const parsed = JSON.parse(product.description || "{}");
    if (parsed?.blocks?.length) {
      const textBlock = parsed.blocks.find(
        (b: { type: string }) => b.type === "paragraph"
      );
      if (textBlock?.data?.text) {
        metaDescription = normalize(String(textBlock.data.text)).substring(
          0,
          160
        );
      }
    }
  } catch {
    metaDescription = normalize(String(product.description || "")).substring(
      0,
      160
    );
  }

  // Heuristics: avoid blank/placeholder descriptions which cause duplicates and "empty description" meta tags.
  const looksPlaceholder =
    metaDescription.length < 30 ||
    /^info coming soon$/i.test(metaDescription) ||
    /^new product info coming soon/i.test(metaDescription);

  if (!metaDescription || looksPlaceholder) {
    metaDescription = `Shop ${product.name} at ${storeName}. ${
      product.category?.name || "Quality products"
    } with fast shipping.`;
  } else {
    // Help uniqueness across similar SKUs: include the product name in the meta description.
    const lower = metaDescription.toLowerCase();
    const nameLower = product.name.toLowerCase();
    if (!lower.startsWith(nameLower)) {
      metaDescription = `${product.name} - ${metaDescription}`.substring(
        0,
        160
      );
    }
  }

  const productUrl = `${baseUrl.replace(/\/$/, "")}/product/${slug}`;
  const productImage = product.media?.[0]?.url || `${baseUrl}/Logo.png`;

  return {
    title: `${product.name} | ${storeName}`,
    description: metaDescription,
    alternates: {
      canonical: productUrl,
    },
    openGraph: {
      title: `${product.name} | ${storeName}`,
      description: metaDescription,
      url: productUrl,
      siteName: storeName,
      type: "website",
      images: [
        {
          url: productImage,
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | ${storeName}`,
      description: metaDescription,
      images: [productImage],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const slug = decodeURIComponent(id);
  const product = await getProductBySlug(slug);
  if (!product) {
    notFound();
  }

  // Generate server-side JSON-LD schemas (initial render)
  // Note: Client component will update schema when variant selection changes
  let productSchema = null;
  let breadcrumbSchema = null;

  if (product) {
    const firstVariant = product.variants?.[0];
    const price = firstVariant?.pricing?.price?.gross?.amount ||
      product.pricing?.priceRange?.start?.gross?.amount ||
      0;
    const currency = firstVariant?.pricing?.price?.gross?.currency ||
      product.pricing?.priceRange?.start?.gross?.currency ||
      "USD";
    const isInStock = firstVariant?.quantityAvailable > 0 ||
      product.variants?.some((v: { quantityAvailable?: number }) => (v.quantityAvailable || 0) > 0);

    productSchema = generateProductSchema({
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description || "",
      image: product.media?.map((m: { url: string }) => m.url) || [],
      price: price,
      currency: currency,
      availability: isInStock ? "InStock" : "OutOfStock",
      sku: firstVariant?.sku || product.id,
      brand: product.category?.name,
      category: product.category,
    });

    breadcrumbSchema = generateBreadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "Products", url: "/products/all" },
      { name: product.name, url: `/product/${slug}` },
    ]);
  }

  return (
    <>
      <h1 className="container mx-auto px-4 md:px-6 pt-8 text-2xl md:text-3xl lg:text-4xl font-semibold text-[var(--color-secondary-800)]">
        {product.name}
      </h1>
      {/* Server-side JSON-LD structured data */}
      {productSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />
      )}
      {breadcrumbSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      )}
      <ProductDetailClient />
    </>
  );
}
