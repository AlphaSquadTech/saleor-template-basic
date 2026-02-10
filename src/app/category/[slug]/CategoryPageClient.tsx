"use client";

import { useState, useEffect } from "react";
import Breadcrumb from "@/app/components/reuseableUI/breadcrumb";
import EmptyState from "@/app/components/reuseableUI/emptyState";
import { ProductCard } from "@/app/components/reuseableUI/productCard";
import ItemsPerPageSelectClient from "@/app/components/shop/ItemsPerPageSelectClient";
import SearchFilterClient from "@/app/components/shop/SearchFilterClient";
import { partsLogicClient, type PLSearchProduct } from "@/lib/client/partslogic";

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

export default function CategoryPageClient(props: CategoryPageClientProps) {
  const { slug, initialProducts, initialPagination, initialCategoryName } = props;

  // Use initial data if provided (from SSR)
  const hasInitialData = initialProducts && initialProducts.length > 0;

  const [itemsPerPage, setItemsPerPage] = useState<ItemsPerPage>(
    (initialPagination?.per_page as ItemsPerPage) || 10
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<PLSearchProduct[]>(
    initialProducts || []
  );
  const [loading, setLoading] = useState(!hasInitialData);
  const [loadingMore, setLoadingMore] = useState(false);
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
  const [isInitialized, setIsInitialized] = useState(hasInitialData);

  useEffect(() => {
    const cacheKey = `${slug}_${itemsPerPage}_${searchQuery}`;

    // Skip initial fetch if we have SSR data and haven't changed filters
    if (
      isInitialized &&
      hasInitialData &&
      itemsPerPage === (initialPagination?.per_page || 10) &&
      !searchQuery
    ) {
      return;
    }

    const fetchCategoryAndProducts = async () => {
      if (categoryCache.has(cacheKey)) {
        const cached = categoryCache.get(cacheKey)!;
        setCategoryName(cached.categoryName);
        setProducts(cached.products);
        setPagination(cached.pagination);
        setLoading(false);
        setIsInitialized(true);
        return;
      }

      setLoading(true);

      try {
        const name = slug
          .replace(/-/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());

        const response = await partsLogicClient.searchProducts({
          category_slug: slug,
          page: 1,
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
        setIsInitialized(true);
      }
    };

    fetchCategoryAndProducts();
  }, [slug, itemsPerPage, searchQuery, isInitialized, hasInitialData, initialPagination?.per_page]);

  const loadMore = async () => {
    if (loadingMore || pagination.page >= pagination.total_pages) return;

    setLoadingMore(true);
    const nextPage = pagination.page + 1;

    try {
      const response = await partsLogicClient.searchProducts({
        category_slug: slug,
        page: nextPage,
        per_page: itemsPerPage,
        q: searchQuery || undefined,
      });

      const newProducts = response.products || [];
      setProducts((prev) => [...prev, ...newProducts]);
      setPagination(response.pagination);
    } catch (error) {
      console.error("Error loading more products:", error);
    } finally {
      setLoadingMore(false);
    }
  };

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
            {/* <SearchFilterClient value={searchQuery} onChange={setSearchQuery} /> */}
            <ItemsPerPageSelectClient
              value={itemsPerPage}
              onChange={setItemsPerPage}
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

        {!loading &&
          pagination.page < pagination.total_pages &&
          products.length > 0 && (
            <div className="mt-10 flex justify-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-4 py-2 bg-[var(--color-secondary-200)] text-gray-800 hover:opacity-80 disabled:opacity-60 transition-opacity"
              >
                {loadingMore ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
      </section>
    </div>
  );
}
