"use client";

import Breadcrumb from "@/app/components/reuseableUI/breadcrumb";
import CommonButton from "@/app/components/reuseableUI/commonButton";
import PrimaryButton from "@/app/components/reuseableUI/primaryButton";
import Image from "next/image";
import {
  useParams,
  useRouter,
  useSearchParams,
  usePathname,
} from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  gtmViewItem,
  Product,
} from "../../utils/googleTagManager";
import { useAppConfiguration } from "../../components/providers/ServerAppConfigurationProvider";
import { generateProductSchema, generateBreadcrumbSchema } from "@/lib/schema";
import ItemInquiryModal from "./components/itemInquiryModal";
import { ProductInquiryIcon } from "@/app/utils/svgs/productInquiryIcon";
import { partsLogicClient } from "@/lib/client/partslogic";
import type { FitmentData } from "@/lib/api/shop";
import type { ProductDetailsByIdData } from "@/graphql/queries/productDetailsById";
/* No cart/checkout in this template. Product pages support "Request a Quote". */

type EditorBlock =
  | { id: string; type: "paragraph"; data: { text: string } }
  | { id: string; type: "header"; data: { text: string; level?: number } }
  | {
      id: string;
      type: "list";
      data: { items: string[]; style?: "ordered" | "unordered" };
    }
  | {
      id: string;
      type: "quote";
      data: {
        text: string;
        caption?: string;
        alignment?: "left" | "center" | "right";
      };
    };

type InitialProduct = NonNullable<ProductDetailsByIdData["product"]>;

export function ProductDetailClient({ initialProduct }: { initialProduct: InitialProduct }) {
  const params = useParams<{ id: string }>();
  // The URL param contains the normalized slug (with single dashes)
  // We need to pass the original Saleor slug for the API query
  // Since we can't perfectly reconstruct it, we just use the normalized version
  // and rely on Saleor's flexible slug matching
  const slug = params?.id ? decodeURIComponent(params.id as string) : "";

  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [fitmentData, setFitmentData] = useState<FitmentData[] | null>(null);
  const [fitmentLoading, setFitmentLoading] = useState(false);
  const [fitmentError, setFitmentError] = useState<string | null>(null);
  const [showAllFitments, setShowAllFitments] = useState(false);
  // No auth/cart in this template; keep inquiry modal state only.

  const { getGoogleTagManagerConfig } = useAppConfiguration();
  const gtmConfig = getGoogleTagManagerConfig();

  // SEO/perf: product data is fetched on the server and passed in.
  // This avoids a client-side Apollo fetch (which would otherwise render a skeleton in HTML).
  const product = initialProduct;
  const loading = false;
  const error = null;

  const images = product?.media ?? [];
  const firstImageUrl = images[0]?.url ?? "";

  // Track product view when product data is loaded
  useEffect(() => {
    if (product && !loading) {
      const productData: Product = {
        item_id: product.id,
        item_name: product.name,
        item_category: product.category?.name || "Products",
        price: product.pricing?.priceRange?.start?.gross?.amount || 0,
        currency: product.pricing?.priceRange?.start?.gross?.currency || "USD",
        item_brand: product.category?.name || undefined,
      };

      gtmViewItem(
        [productData],
        productData.currency,
        productData.price,
        gtmConfig?.container_id
      );
    }
  }, [product, loading]);
  const [selectedImage, setSelectedImage] = useState<string>(firstImageUrl);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    null
  );
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Function to update URL with SKU parameter
  const updateURLWithSKU = useCallback(
    (sku: string | null) => {
      if (!sku) {
        // Remove SKU param if no SKU
        router.replace(pathname, { scroll: false });
        return;
      }

      // Convert SKU to URL-friendly format (replace spaces with hyphens)
      const urlFriendlySKU = sku.replace(/\s+/g, "-");

      const params = new URLSearchParams();
      params.set("sku", urlFriendlySKU);

      const newURL = `${pathname}?${params.toString()}`;
      router.replace(newURL, { scroll: false });
    },
    [pathname, router]
  );

  const raw = product?.description || "";
  const lineHeight = 28; // px
  const maxLines = 10;
  const maxHeight = lineHeight * maxLines;
  const [showFull, setShowFull] = useState(false);
  const [isOverflow, setIsOverflow] = useState(false);
  const descriptionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (descriptionRef.current) {
      const height = descriptionRef.current.scrollHeight;
      if (height > maxHeight) {
        setIsOverflow(true);
      }
    }
  }, [raw]);

  const toggleShow = () => setShowFull(!showFull);

  // Keep selected image in sync with first loaded image (simpler, no useMemo)
  useEffect(() => {
    if (firstImageUrl) setSelectedImage(firstImageUrl);
  }, [firstImageUrl]);

  // Initialize variant selection from URL or default to first variant
  useEffect(() => {
    if (!product?.variants?.length || isInitialized) return;

    const skuFromURL = searchParams.get("sku");

    if (skuFromURL) {
      // Convert URL-friendly SKU back to original format (replace hyphens with spaces)
      const originalSKU = skuFromURL.replace(/-/g, " ");

      // Try to find variant by SKU from URL (check both formats for compatibility)
      const variantFromURL = product.variants.find(
        (v) => v.sku === originalSKU || v.sku === skuFromURL
      );

      if (variantFromURL) {
        setSelectedVariantId(variantFromURL.id);
        setIsInitialized(true);
        return;
      }
    }

    // Default to first variant if no SKU in URL or SKU not found
    if (product.variants[0]?.id) {
      setSelectedVariantId(product.variants[0].id);
      setIsInitialized(true);
    }
  }, [product?.variants, searchParams, isInitialized]);

  const selectedVariant = useMemo(() => {
    if (!product?.variants?.length) return null;
    return (
      product.variants.find((v) => v.id === (selectedVariantId ?? "")) ??
      product.variants[0]
    );
  }, [product, selectedVariantId]);

  // Update URL with SKU when variant changes (after initialization)
  useEffect(() => {
    if (isInitialized && selectedVariant?.sku) {
      updateURLWithSKU(selectedVariant.sku);
    }
  }, [isInitialized, selectedVariant?.sku, updateURLWithSKU]);

  // ---------- PRICING (variant-first) ----------
  const variantPrice = selectedVariant?.pricing?.price?.gross ?? null;
  const variantOriginal =
    selectedVariant?.pricing?.priceUndiscounted?.gross ?? null;

  const rawCurrentPrice =
    variantPrice?.amount ??
    product?.pricing?.priceRange?.start?.gross?.amount ??
    0;

  const currency =
    variantPrice?.currency ??
    variantOriginal?.currency ??
    product?.pricing?.priceRange?.start?.gross?.currency ??
    "USD";

  // ✅ Calculate original price correctly: discounted price + discount amount
  const discountAmount = product?.pricing?.discount?.gross?.amount ?? 0;
  const rawOriginalPrice =
    discountAmount > 0
      ? rawCurrentPrice + discountAmount // Original = Current + Discount
      : variantOriginal?.amount ??
        product?.pricing?.priceRange?.stop?.gross?.amount ??
        null;

  // Format prices properly (convert from cents if needed)
  const currentPrice = rawCurrentPrice;
  const originalPrice = rawOriginalPrice;

  // ✅ Use Saleor's discount info for more accurate detection
  const hasDiscount =
    discountAmount > 0 ||
    (typeof originalPrice === "number" && originalPrice > currentPrice);
  const compareAt = hasDiscount ? originalPrice : null;

  // Memoized formatter
  const moneyFmt = useMemo(
    () => new Intl.NumberFormat(undefined, { style: "currency", currency }),
    [currency]
  );
  // --------------------------------------------

  // Effect to update schema.org structured data when variant changes
  useEffect(() => {
    if (!product || !selectedVariant) return;

    const productSchema = generateProductSchema({
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description || "",
      image: images.map((img) => img.url),
      price: currentPrice,
      currency: currency,
      availability:
        selectedVariant.quantityAvailable &&
        selectedVariant.quantityAvailable > 0
          ? "InStock"
          : "OutOfStock",
      sku: selectedVariant.sku || product.id,
      brand: product.category?.name,
      rating: undefined,
      reviewCount: undefined,
    });

    const breadcrumbSchema = generateBreadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "Products", url: "/products/all" },
      { name: product.name, url: `/product/${slug}` },
    ]);

    // Remove existing schema scripts
    const existingSchemas = document.querySelectorAll(
      "script[data-schema-type]"
    );
    existingSchemas.forEach((script) => script.remove());

    // Add updated product schema
    const productScript = document.createElement("script");
    productScript.type = "application/ld+json";
    productScript.setAttribute("data-schema-type", "product");
    productScript.textContent = JSON.stringify(productSchema);
    document.head.appendChild(productScript);

    // Add breadcrumb schema
    const breadcrumbScript = document.createElement("script");
    breadcrumbScript.type = "application/ld+json";
    breadcrumbScript.setAttribute("data-schema-type", "breadcrumb");
    breadcrumbScript.textContent = JSON.stringify(breadcrumbSchema);
    document.head.appendChild(breadcrumbScript);

    // Cleanup on unmount
    return () => {
      const schemas = document.querySelectorAll("script[data-schema-type]");
      schemas.forEach((script) => script.remove());
    };
  }, [product, selectedVariant, currentPrice, currency, images, slug]);

  // Helper to read attribute value by slug from selected variant
  const getAttrVal = useCallback(
    (slug: string) => {
      const attr = selectedVariant?.attributes?.find(
        (a) => a.attribute?.slug === slug
      );
      return attr?.values?.[0]?.name ?? null;
    },
    [selectedVariant]
  );
  const lengthVal = getAttrVal("length_in") || getAttrVal("length");
  const heightVal = getAttrVal("height_in") || getAttrVal("height");
  const widthVal = getAttrVal("width_in") || getAttrVal("width");
  const requestQuote = () => setShowInquiryModal(true);

  useEffect(() => {
    const fetchFitmentData = async () => {
      try {
        setFitmentLoading(true);
        setFitmentError(null);
        const numericId = product?.id;
        if (!numericId) {
          setFitmentData(null);
          return;
        }
        const response = await partsLogicClient.getFitmentGroups(String(numericId));
        setFitmentData((response as { data?: FitmentData[] }).data ?? []);
      } catch (error) {
        console.error("Error fetching fitment data:", error);
        setFitmentError("Failed to load fitment data");
      } finally {
        setFitmentLoading(false);
      }
    };

    fetchFitmentData();
  }, [product?.id]);

  const processedFitmentData = useMemo(() => {
    if (!fitmentData || fitmentData.length === 0) return [];

    const fitmentSets: Array<Record<string, string>> = [];

    fitmentData.forEach((item) => {
      const groups = item.fitment_group_set.fitment_groups;

      const fitmentSet: Record<string, string> = {};

      groups.forEach((group) => {
        if (group.fitment_value.fitment.is_hidden) {
          return;
        }

        const key = group.fitment_value.fitment.fitment;
        const value = group.fitment_value.fitment_value;

        fitmentSet[key] = value;
      });

      if (Object.keys(fitmentSet).length > 0) {
        fitmentSets.push(fitmentSet);
      }
    });

    return fitmentSets;
  }, [fitmentData]);

  const displayedFitments = useMemo(() => {
    if (showAllFitments) {
      return processedFitmentData;
    }
    return processedFitmentData.slice(0, 50);
  }, [processedFitmentData, showAllFitments]);

  const hasMoreFitments = processedFitmentData.length > 50;

  const fitmentKeys = useMemo(() => {
    const keys = new Set<string>();
    processedFitmentData.forEach((fitmentSet) => {
      Object.keys(fitmentSet).forEach((key) => keys.add(key));
    });
    return Array.from(keys);
  }, [processedFitmentData]);

  const productBreadcrumbItems = [
    { text: "HOME", link: "/" },
    { text: "PRODUCT", link: "/products/all" },
    { text: product?.name ?? "" },
  ];

  const baseText =
    "text-[var(--color-secondary-800)] font-secondary -tracking-[0.045px] leading-relaxed";
  type HeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

  // NOTE: Assumes product.description (Editor.js JSON) is already sanitized server-side.
  const renderBlock = (b: EditorBlock) => {
    switch (b.type) {
      case "quote": {
        const align =
          b.data.alignment === "center"
            ? "text-center"
            : b.data.alignment === "right"
            ? "text-right"
            : "text-left";
        return (
          <figure key={b.id} className={`not-prose ${align}`}>
            <blockquote
              className="border-l-4 pl-4 py-2 italic bg-[var(--color-secondary-200)]  text-[var(--color-secondary-800)]"
              dangerouslySetInnerHTML={{ __html: b.data.text || "" }}
            />
            {b.data.caption && (
              <figcaption
                className="mt-1 text-sm text-[var(--color-secondary-600)]"
                dangerouslySetInnerHTML={{ __html: b.data.caption }}
              />
            )}
          </figure>
        );
      }
      case "header": {
        // Prevent H1 from CMS content - page already has main H1 for product name
        const level = Math.min(Math.max(b.data.level ?? 2, 2), 6);
        const Tag = `h${level}` as HeadingTag;
        return (
          <Tag
            key={b.id}
            className={`${baseText} ${
              level === 1 ? "text-2xl font-semibold" : ""
            }`}
            dangerouslySetInnerHTML={{ __html: b.data.text || "" }}
          />
        );
      }
      case "list": {
        const ordered = (b.data.style || "unordered") === "ordered";
        const ListTag = (ordered ? "ol" : "ul") as "ol" | "ul";
        return (
          <ListTag
            key={b.id}
            className={`${baseText} pl-5 space-y-3 ${
              ordered ? "list-decimal" : "list-disc"
            } marker:text-[var(--color-primary-600)] text-sm lg:text-lg`}
          >
            {b.data.items.map((it, i) => (
              <li
                key={`${b.id}-${i}`}
                dangerouslySetInnerHTML={{ __html: it }}
              />
            ))}
          </ListTag>
        );
      }
      case "paragraph":
      default: {
        const html = (b.data.text || "").replace(/\n/g, "<br/>");
        return (
          <div
            key={b.id}
            className={`${baseText} text-sm lg:text-base`}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      }
    }
  };

  const renderDescription = () => {
    try {
      const parsed = JSON.parse(raw) as { blocks?: EditorBlock[] };
      if (parsed?.blocks?.length) {
        return (
          <div className="relative pb-12">
            <div
              ref={descriptionRef}
              className={`space-y-2 [&_ul]:pl-5 [&_ol]:pl-5 [&_ul]:list-disc [&_ol]:list-decimal [&_li]:marker:text-[var(--color-primary-600)] [&_a]:underline [&_a]:text-[var(--color-primary-600)] hover:[&_a]:text-[var(--color-primary-700)] overflow-hidden transition-all duration-300
                      ${!showFull ? "line-clamp-[10]" : ""}`}
              style={{ maxHeight: showFull ? "none" : `${maxHeight}px` }}
            >
              {parsed.blocks.map(renderBlock)}
            </div>

            {isOverflow && (
              <CommonButton
                onClick={toggleShow}
                className={`absolute bottom-0 px-0 ${
                  showFull ? "mt-0" : "mt-4"
                } underline text-sm md:text-base hover:underline-offset-4 hover:text-[var(--color-primary)]`}
              >
                {showFull ? "View Less" : "View More"}
              </CommonButton>
            )}
          </div>
        );
      }
    } catch {
      // Fallback to plain text
      return <p className={`${baseText} text-lg`}>{raw}</p>;
    }
  };
  const btnSecondary =
    "border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold  transition-colors";

  const isLoading = loading;

  const hasAnyDimension =
    parseFloat(lengthVal || "0") > 0 ||
    parseFloat(widthVal || "0") > 0 ||
    parseFloat(heightVal || "0") > 0 ||
    (selectedVariant?.weight?.value ?? 0) > 0;

  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setMousePosition({ x, y });
  };

  const handleMouseEnter = () => setIsZoomed(true);
  const handleMouseLeave = () => {
    setIsZoomed(false);
    setMousePosition({ x: 50, y: 50 });
  };

  return (
    <>
      <div className="lg:container lg:mx-auto px-4 py-12 md:px-6 md:py-16 lg:px-4 lg:py-24">
        {isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div>
              <div className="relative w-full aspect-square bg-gray-100  overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-pulse w-3/4 h-3/4 bg-gray-200 " />
                </div>
              </div>
              <div className="flex gap-2 mt-2 md:mt-5">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="size-20 md:size-24 bg-gray-200 rounded animate-pulse"
                  />
                ))}
              </div>
            </div>
            <div>
              <div className="space-y-3">
                <div className="h-8 bg-gray-200 rounded w-2/3 animate-pulse" />
                <div className="h-5 bg-gray-200 rounded w-1/3 animate-pulse" />
                <div className="h-24 bg-gray-100 rounded animate-pulse" />
                <div className="h-10 bg-gray-200 rounded w-1/2 animate-pulse" />
              </div>
            </div>
          </div>
        )}

        {error && <div className="text-red-600">Failed to load product.</div>}
        {!isLoading &&
          !product &&
          !error && (
            <div className="text-center py-12">
              <h2 className="text-2xl font-semibold text-[var(--color-secondary-800)] mb-2">
                Product Not Found
              </h2>
              <p className="text-[var(--color-secondary-600)] mb-6">
                The product you&apos;re looking for doesn&apos;t exist or has
                been removed.
              </p>
              <CommonButton
                onClick={() => router.push("/products/all")}
                variant="primary"
                className="mx-auto"
              >
                Browse All Products
              </CommonButton>
            </div>
          )}

        {product && (
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[40%_1fr] gap-8 lg:gap-12">
            {/* Image Gallery */}
            <div>
              <Breadcrumb items={productBreadcrumbItems} />
              <div className="lg:sticky lg:top-36 lg:self-start mt-5">
                <div
                  className="relative w-full aspect-square bg-[#F7F7F7] border border-[var(--color-secondary-200)] overflow-hidden cursor-zoom-in"
                  onMouseMove={handleMouseMove}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  {hasDiscount && (
                    <span className="absolute top-3 right-3 z-10 inline-flex items-center bg-[var(--color-primary-600)] px-3 py-1 text-base uppercase text-white font-secondary -tracking-[0.04px]">
                      Sale
                    </span>
                  )}
                  {selectedImage ? (
                    <Image
                      src={selectedImage}
                      alt={product.name || "Product image"}
                      fill
                      priority
                      sizes="100vw"
                      className="object-contain transition-transform duration-200 ease-out"
                      style={{
                        transform: isZoomed ? "scale(2.5)" : "scale(1)",
                        transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`,
                      }}
                    />
                  ) : (
                    <Image
                      src={"/no-image-avail-large.jpg"}
                      alt={`${product.name} - Image not available`}
                      fill
                      quality={90}
                      sizes="100vw"
                      className="object-contain transition-transform duration-200 ease-out"
                      style={{
                        transform: isZoomed ? "scale(2.5)" : "scale(1)",
                        transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`,
                      }}
                    />
                  )}
                </div>
                {images.length > 0 && (
                  <div className="flex gap-2 mt-4">
                    {images.map((img) => {
                      const isActive = selectedImage === img.url;
                      return (
                        <button
                          key={img.id}
                          type="button"
                          className={`relative size-16 md:size-20 lg:size-24 bg-[#F7F7F7] border cursor-pointer overflow-hidden transition-opacity duration-200 ${
                            isActive
                              ? "border-[var(--color-secondary-400)] opacity-100"
                              : "opacity-60 hover:opacity-80 border-[var(--color-secondary-200)]"
                          }`}
                          aria-pressed={isActive}
                          onClick={() => setSelectedImage(img.url)}
                        >
                          <Image
                            src={img.url}
                            alt={
                              img.alt?.trim() ||
                              `${product.name} - thumbnail ${
                                images.indexOf(img) + 1
                              }`
                            }
                            fill
                            sizes="100vw"
                            className="object-contain"
                          />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Product Info */}
            <div className="lg:pl-8">
              {/* Brand/Collection */}
              {/* {!!product.collections?.length && (
              <div className="font-secondary text-xl -tracking-[0.05px] text-[var(--color-primary-700)] font-bold flex gap-1">
                <span className="text-[var(--color-secondary-600)] font-normal">
                  BRAND
                </span>
                {product.collections.map((c) => c.name).join(", ")}
              </div>
            )} */}
              <h2 className="text-xl lg:text-3xl font-primary uppercase -tracking-[0.09px] mb-2">
                {product.name}
              </h2>

              {/* Meta: SKU and stock */}
              {selectedVariant && (
                <div className="text-xl flex items-center gap-3 font-secondary -tracking-[0.045px] text-[var(--color-secondary-600)] mb-4">
                  <span>
                    SKU:{" "}
                    <span className="font-semibold text-[var(--color-secondary-800)]">
                      {selectedVariant.sku}
                    </span>
                  </span>
                </div>
              )}

              {/* Product Message from Metadata */}
              {(() => {
                const productMessage = product?.metadata?.find(
                  (item) => item.key === "product_message"
                )?.value;

                const shippingIsActive =
                  product?.metadata
                    ?.find((item) => item.key === "shipping_isactive")
                    ?.value?.toLowerCase() === "true";

                // Only show the product message if shipping_isactive is true
                if (productMessage && shippingIsActive) {
                  return (
                    <div className="my-5 p-4 bg-[var(--color-secondary-100)] border-l-4 border-[var(--color-primary-600)] rounded-r">
                      <p className="text-sm lg:text-base text-[var(--color-secondary-800)] font-secondary -tracking-[0.045px]">
                        {productMessage}
                      </p>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Variants */}
              {product?.metadata?.find((item) => item?.key === "availability")
                ?.value !== "Please Call" && (
                <>
                  {!!product.variants?.length &&
                    product.variants?.length !== 1 && (
                      <div className="mb-10">
                        <label className="block font-secondary text-lg font-semibold text-[var(--color-secondary-800)] uppercase mb-4 -tracking-[0.045px]">
                          Variant
                        </label>
                        <div
                          className="grid grid-cols-1 md:grid-cols-2 gap-3"
                          role="radiogroup"
                          aria-label="Variants"
                        >
                          {product.variants.map((v) => {
                            const selected =
                              (selectedVariant?.id ??
                                product.variants[0].id) === v.id;
                            return (
                              <div
                                key={v.id}
                                role="radio"
                                aria-checked={selected}
                                onClick={() => setSelectedVariantId(v.id)}
                                className={`border flex justify-between font-secondary w-full items-center px-4 py-5 cursor-pointer transition-colors ${
                                  selected
                                    ? "border-[var(--color-primary-100)] bg-[var(--color-primary-50)] text-[var(--color-primary-700)]"
                                    : "border-[var(--color-secondary-200)] hover:bg-gray-50"
                                }`}
                              >
                                <div className="flex items-center gap-3 text-sm md:text-base">
                                  <input
                                    type="radio"
                                    name="variant"
                                    className="accent-[var(--color-primary-600)]"
                                    checked={selected}
                                    onChange={() => setSelectedVariantId(v.id)}
                                  />
                                  <p
                                    title={v.name}
                                    className="font-medium  -tracking-[0.04px]"
                                  >
                                    {v.name}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                </>
              )}
              {/* Actions (no cart/checkout in this template) */}
              {product?.metadata?.find((item) => item?.key === "availability")
                ?.value !== "Please Call" && (
                <div className="space-y-3">
                  <PrimaryButton
                    content="Request a Quote"
                    className="w-full text-base font-semibold leading-[24px] tracking-[-0.04px] py-3 px-4"
                    onClick={requestQuote}
                    disabled={!product}
                  />
                  <CommonButton
                    className="w-full"
                    onClick={() => router.push("/locator")}
                    variant="secondary"
                  >
                    Where to Buy
                  </CommonButton>
                </div>
              )}
              <button
                type="button"
                onClick={requestQuote}
                className="mt-4 flex items-center gap-1 cursor-pointer hover:text-[var(--color-primary)] transition-all ease-in-out duration-300 bg-transparent border-none p-0"
                aria-label="Open quote request form"
              >
                <span aria-hidden="true">{ProductInquiryIcon}</span>
                <span>Request a Quote</span>
              </button>

              {/* Extra details (Dimensions/Weight) */}
              {hasAnyDimension && (
                <div className="mt-10">
                  <h3 className="text-lg md:text-xl lg:text-2xl font-semibold text-[var(--color-secondary-800)] font-secondary uppercase -tracking-[0.06px] mb-4">
                    Product Dimensions
                  </h3>
                  <ul className="text-sm lg:text-lg -tracking-[0.045px] font-semibold font-secondary text-[var(--color-secondary-800)] list-disc marker:text-[var(--color-primary-600)] pl-5 space-y-3">
                    {lengthVal === "0" ||
                    parseFloat(lengthVal || "") == 0 ? null : (
                      <li>
                        Length:{" "}
                        <span className="font-normal">{lengthVal} Inches</span>
                      </li>
                    )}
                    {widthVal === "0" ||
                    parseFloat(widthVal || "") == 0 ? null : (
                      <li>
                        Width:{" "}
                        <span className="font-normal">{widthVal} Inches</span>
                      </li>
                    )}
                    {heightVal === "0" ||
                    parseFloat(heightVal || "") == 0 ? null : (
                      <li>
                        Height:{" "}
                        <span className="font-normal">{heightVal} Inches</span>
                      </li>
                    )}
                    {selectedVariant?.weight?.value === 0 ? null : (
                      <li>
                        Weight:{" "}
                        <span className="font-normal">
                          {selectedVariant?.weight?.value}
                          {selectedVariant?.weight?.unit}
                        </span>
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* Description */}
              <div className="mt-8">
                <h3 className="text-base lg:text-lg font-semibold text-[var(--color-secondary-800)] font-secondary uppercase -tracking-[0.06px] mb-2">
                  Product Description
                </h3>
                <div className="text-sm lg:text-base leading-relaxed">
                  {renderDescription()}
                </div>
              </div>
              {fitmentLoading ? (
                <div className="mt-8">
                  <h3 className="text-base lg:text-lg font-semibold text-[var(--color-secondary-800)] font-secondary uppercase -tracking-[0.06px] mb-4">
                    DETAILS
                  </h3>
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div
                        key={index}
                        className="h-5 bg-gray-300 w-2/3 animate-pulse"
                      />
                    ))}
                  </div>
                </div>
              ) : fitmentError ? (
                <div className="text-sm text-red-600 px-4 py-2">
                  {fitmentError}
                </div>
              ) : displayedFitments?.length > 0 ? (
                <div className="mt-8">
                  <h3 className="text-base lg:text-lg font-semibold text-[var(--color-secondary-800)] font-secondary uppercase -tracking-[0.06px] mb-4">
                    DETAILS
                  </h3>
                  <div>
                    <div className="space-y-2">
                      {displayedFitments.map((fitmentSet, index) => {
                        const entries = fitmentKeys
                          .map((key) => ({ key, value: fitmentSet[key] }))
                          .filter((entry) => entry.value);

                        return (
                          <p
                            key={index}
                            className="text-sm font-secondary text-[var(--color-secondary-800)]"
                          >
                            <span className="font-primary uppercase text-xs">
                              {entries.map((entry) => entry.key).join(" ")}:
                            </span>{" "}
                            <span className="font-normal">
                              {entries.map((entry) => entry.value).join(" ")}
                            </span>
                          </p>
                        );
                      })}
                    </div>

                    {hasMoreFitments && (
                      <CommonButton
                        onClick={() => setShowAllFitments(!showAllFitments)}
                        className="text-sm md:text-base underline hover:underline-offset-4 px-0 hover:text-[var(--color-primary)]"
                      >
                        {showAllFitments ? "View Less" : "View More"}
                      </CommonButton>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

      </div>
      <ItemInquiryModal
        isModalOpen={showInquiryModal}
        onClose={() => setShowInquiryModal(false)}
      />
    </>
  );
}
