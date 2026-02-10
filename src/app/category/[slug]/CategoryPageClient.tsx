"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Breadcrumb from "@/app/components/reuseableUI/breadcrumb";
import EmptyState from "@/app/components/reuseableUI/emptyState";
import { ProductCard } from "@/app/components/reuseableUI/productCard";
import ItemsPerPageSelectClient from "@/app/components/shop/ItemsPerPageSelectClient";
import { partsLogicClient, type PLSearchProduct } from "@/lib/client/partslogic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface PaginationInfo {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

interface CategoryCacheData {
  categoryName: string;
  products: PLSearchProduct[];
  pagination: PaginationInfo;
}

const categoryCache = new Map<string, CategoryCacheData>();

type ItemsPerPage = 10 | 20 | 50 | 100;

interface CategoryPageClientProps {
  slug: string;
  initialProducts?: PLSearchProduct[] | null;
  initialPagination?: PaginationInfo | null;
  initialCategoryName?: string;
}

function parsePositiveInt(value: string | null, fallback: number) {
  const n = value ? Number.parseInt(value, 10) : Number.NaN;
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return n;
}

export default function CategoryPageClient(props: CategoryPageClientProps) {
  const { slug, initialProducts, initialPagination, initialCategoryName } = props;
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const skipFirstFetchRef = useRef<boolean>(false);

  // Use initial data if provided (from SSR)
  const hasInitialData =
    Array.isArray(initialProducts) && initialPagination != null;
  skipFirstFetchRef.current = skipFirstFetchRef.current || hasInitialData;

  const [itemsPerPage, setItemsPerPage] = useState<ItemsPerPage>(
    (initialPagination?.per_page as ItemsPerPage) || 10
  );
  const [currentPage, setCurrentPage] = useState<number>(
    initialPagination?.page || 1
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [products, setProducts] = useState<PLSearchProduct[]>(
    initialProducts || []
  );
  const [loading, setLoading] = useState(!hasInitialData);
  const [categoryName, setCategoryName] = useState<string>(
    initialCategoryName || ""
  );
  const [pagination, setPagination] = useState<PaginationInfo>(
    initialPagination || {
      total: 0,
      page: 1,
      per_page: 10,
      total_pages: 0,
    }
  );
  const [isInitialized, setIsInitialized] = useState(false);

  const urlState = useMemo(() => {
    const page = parsePositiveInt(searchParams.get("page"), 1);
    const perPageRaw = parsePositiveInt(searchParams.get("per_page"), itemsPerPage);
    const perPage = ([10, 20, 50, 100] as number[]).includes(perPageRaw)
      ? (perPageRaw as ItemsPerPage)
      : itemsPerPage;
    const q = (searchParams.get("q") || "").trim();
    return { page, perPage, q };
  }, [itemsPerPage, searchParams]);

  const buildHref = useMemo(() => {
    return (page: number) => {
      const params = new URLSearchParams();
      if (urlState.q) params.set("q", urlState.q);
      if (urlState.perPage !== 10) params.set("per_page", String(urlState.perPage));
      if (page > 1) params.set("page", String(page));
      const qs = params.toString();
      return qs ? `${pathname}?${qs}` : pathname;
    };
  }, [pathname, urlState.perPage, urlState.q]);

  const updateURL = (next: { page: number; perPage: number; q: string }) => {
    const params = new URLSearchParams();
    if (next.q) params.set("q", next.q);
    if (next.perPage !== 10) params.set("per_page", String(next.perPage));
    if (next.page > 1) params.set("page", String(next.page));
    const qs = params.toString();
    const nextUrl = qs ? `${pathname}?${qs}` : pathname;
    router.replace(nextUrl, { scroll: false });
  };

  useEffect(() => {
    // Keep state driven by the URL (SSR baseline). This makes pagination/filtering
    // work without JS and ensures the client does not "fight" the server HTML.
    if (!isInitialized) setIsInitialized(true);
    if (currentPage !== urlState.page) setCurrentPage(urlState.page);
    if (itemsPerPage !== urlState.perPage) setItemsPerPage(urlState.perPage);
    if (searchQuery !== urlState.q) setSearchQuery(urlState.q);
  }, [currentPage, isInitialized, itemsPerPage, searchQuery, urlState.page, urlState.perPage, urlState.q]);

  useEffect(() => {
    if (!isInitialized) return;
    if (skipFirstFetchRef.current) {
      skipFirstFetchRef.current = false;
      return;
    }

    const cacheKey = `${slug}_${currentPage}_${itemsPerPage}_${searchQuery}`;

    const fetchCategoryAndProducts = async () => {
      if (categoryCache.has(cacheKey)) {
        const cached = categoryCache.get(cacheKey)!;
        setCategoryName(cached.categoryName);
        setProducts(cached.products);
        setPagination(cached.pagination);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const name = slug
          .replace(/-/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());

        const response = await partsLogicClient.searchProducts({
          category_slug: slug,
          page: currentPage,
          per_page: itemsPerPage,
          q: searchQuery || undefined,
        });

        categoryCache.set(cacheKey, {
          categoryName: name,
          products: response.products || [],
          pagination: response.pagination,
        });

        setCategoryName(name);
        setProducts(response.products || []);
        setPagination(response.pagination);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryAndProducts();
  }, [currentPage, isInitialized, itemsPerPage, searchQuery, slug]);

  const breadcrumbItems = [
    { text: "HOME", link: "/" },
    { text: "SHOP", link: "/products/all" },
    { text: categoryName || slug },
  ];

  return (
    <div className="container mx-auto min-h-dvh py-12 px-4 md:px-6 md:py-16 lg:py-24 lg:px-0 relative">
      <div className="space-y-5">
        <Breadcrumb items={breadcrumbItems} />
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between w-full gap-4">
          <div className="space-y-2">
            {/* H1 is rendered server-side in `src/app/category/[slug]/page.tsx` for SEO. */}
            <h2 className="font-normal uppercase text-(--color-secondary-800) whitespace-nowrap text-xl md:text-3xl lg:text-5xl font-primary">
              {categoryName || slug}
            </h2>
            {searchQuery && (
              <div className="flex items-center gap-2 text-sm text-(--color-secondary-600)">
                <div className="flex items-center gap-2">
                  {pagination.total > 0
                    ? `Found ${pagination.total} result${
                        pagination.total === 1 ? "" : "s"
                      } for "${searchQuery}" in ${categoryName || slug}`
                    : `No results found for "${searchQuery}" in ${
                        categoryName || slug
                      }`}
                </div>
              </div>
            )}
            {!searchQuery && (
              <div className="flex items-center gap-2 text-sm text-(--color-secondary-600)">
                <div className="flex items-center gap-2">
                  {pagination.total} product{pagination.total === 1 ? "" : "s"}{" "}
                  in {categoryName || slug}
                </div>
              </div>
            )}
          </div>
          <div className="flex w-full flex-col md:flex-row md:items-center justify-between lg:justify-end gap-4">
            <form
              className="w-full md:w-auto"
              method="get"
              onSubmit={(e) => {
                e.preventDefault();
                updateURL({ page: 1, perPage: itemsPerPage, q: searchQuery });
              }}
            >
              <input type="hidden" name="per_page" value={itemsPerPage} />
              <div className="flex w-full md:w-96 gap-2">
                <input
                  name="q"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search in this category"
                  className="w-full rounded-md border border-[var(--color-secondary-200)] px-3 py-2 text-sm font-secondary"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[var(--color-secondary-200)] text-gray-800 hover:opacity-80 disabled:opacity-60 transition-opacity text-sm font-secondary whitespace-nowrap"
                >
                  Search
                </button>
              </div>
            </form>
            <ItemsPerPageSelectClient
              value={itemsPerPage}
              onChange={(v) => {
                setItemsPerPage(v);
                updateURL({ page: 1, perPage: v, q: searchQuery });
              }}
            />
          </div>
        </div>
      </div>

      <section className="mt-10 relative min-h-[400px]">
        {loading && (
          <div className="h-[60vh] z-10 flex items-center justify-center">
            <div className="size-14 block border-t-2 border-black rounded-full animate-spin" />
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products && products.length > 0
            ? products
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((item) => (
                  <ProductCard
                    key={item.id}
                    id={item.id}
                    name={item.name}
                    image={item.primary_image || "/images/Hero.png"}
                    href={`/product/${item.slug}`}
                    price={item.price_min || 0}
                    category_id={item.category_id || ""}
                    category={item.category_name || ""}
                    discount={
                      item.price_max &&
                      item.price_min &&
                      item.price_max > item.price_min
                        ? item.price_max - item.price_min
                        : null
                    }
                    isFeatured={
                      item.collection_names?.includes("Best Sellers") || false
                    }
                    onSale={(item.price_max || 0) > (item.price_min || 0)}
                    skus={item.skus || []}
                  />
                ))
            : !loading && (
                <EmptyState
                  text="No products found"
                  textParagraph="Try adjusting your search or filter to find what you're looking for."
                  className="col-span-full my-12"
                />
              )}
        </div>

        {!loading && pagination.total_pages > 1 && (
          <nav className="mt-10 flex items-center justify-center gap-4 font-secondary text-sm">
            {currentPage > 1 ? (
              <a
                href={buildHref(currentPage - 1)}
                className="px-3 py-2 bg-[var(--color-secondary-200)] text-gray-800 hover:opacity-80 transition-opacity"
                onClick={(e) => {
                  // With JS enabled, keep it snappy; without JS the href works.
                  e.preventDefault();
                  updateURL({
                    page: currentPage - 1,
                    perPage: itemsPerPage,
                    q: searchQuery,
                  });
                }}
              >
                Prev
              </a>
            ) : (
              <span className="px-3 py-2 bg-[var(--color-secondary-100)] text-gray-500">
                Prev
              </span>
            )}

            <span className="text-[var(--color-secondary-700)]">
              Page {currentPage} of {pagination.total_pages}
            </span>

            {currentPage < pagination.total_pages ? (
              <a
                href={buildHref(currentPage + 1)}
                className="px-3 py-2 bg-[var(--color-secondary-200)] text-gray-800 hover:opacity-80 transition-opacity"
                onClick={(e) => {
                  e.preventDefault();
                  updateURL({
                    page: currentPage + 1,
                    perPage: itemsPerPage,
                    q: searchQuery,
                  });
                }}
              >
                Next
              </a>
            ) : (
              <span className="px-3 py-2 bg-[var(--color-secondary-100)] text-gray-500">
                Next
              </span>
            )}
          </nav>
        )}
      </section>
    </div>
  );
}
